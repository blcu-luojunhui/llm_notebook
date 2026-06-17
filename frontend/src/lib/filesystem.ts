const DB_NAME = "llm-notebook-fs"
const DB_VERSION = 1
const STORE_NAME = "handles"
const HANDLE_KEY = "workspace"
const META_DIR = ".llm_notebook"
const META_FILE = "index.json"

interface NoteMeta {
  id: string
  title: string
  folder?: string
  createdAt: string
  updatedAt: string
}

interface WorkspaceMeta {
  version: 1
  notes: NoteMeta[]
}

// --- IndexedDB for persisting the directory handle ---

function openHandleDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function getStoredHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openHandleDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly")
      const req = tx.objectStore(STORE_NAME).get(HANDLE_KEY)
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

async function storeHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openHandleDB()
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    tx.objectStore(STORE_NAME).put(handle, HANDLE_KEY)
    tx.oncomplete = () => resolve()
  })
}

async function clearHandle(): Promise<void> {
  const db = await openHandleDB()
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    tx.objectStore(STORE_NAME).delete(HANDLE_KEY)
    tx.oncomplete = () => resolve()
  })
}

// --- Permission ---

async function ensurePermission(
  handle: FileSystemDirectoryHandle
): Promise<boolean> {
  const opts: FileSystemHandlePermissionDescriptor = { mode: "readwrite" }
  const status = await handle.queryPermission(opts)
  if (status === "granted") return true
  const result = await handle.requestPermission(opts)
  return result === "granted"
}

// --- Workspace ---

let workspaceHandle: FileSystemDirectoryHandle | null = null

export function getWorkspaceHandle(): FileSystemDirectoryHandle | null {
  return workspaceHandle
}

export async function openWorkspace(): Promise<FileSystemDirectoryHandle | null> {
  // Try stored handle first
  const stored = await getStoredHandle()
  if (stored) {
    const ok = await ensurePermission(stored)
    if (ok) {
      workspaceHandle = stored
      return stored
    }
    // Permission lost, clear stale handle
    await clearHandle()
  }

  // Fallback: ask user to pick a directory
  if (!("showDirectoryPicker" in window)) {
    console.warn("File System Access API not supported")
    return null
  }

  try {
    const handle = await window.showDirectoryPicker({
      mode: "readwrite",
      startIn: "documents",
    })
    await storeHandle(handle)
    workspaceHandle = handle
    return handle
  } catch {
    // User cancelled
    return null
  }
}

export async function closeWorkspace(): Promise<void> {
  workspaceHandle = null
  await clearHandle()
}

// --- Metadata ---

async function ensureMetaDir(handle: FileSystemDirectoryHandle) {
  try {
    await handle.getDirectoryHandle(META_DIR)
  } catch {
    await handle.getDirectoryHandle(META_DIR, { create: true })
  }
}

async function readMetaFile(
  handle: FileSystemDirectoryHandle
): Promise<WorkspaceMeta> {
  await ensureMetaDir(handle)
  const metaDir = await handle.getDirectoryHandle(META_DIR)
  try {
    const fileHandle = await metaDir.getFileHandle(META_FILE)
    const file = await fileHandle.getFile()
    const text = await file.text()
    return JSON.parse(text)
  } catch {
    return { version: 1, notes: [] }
  }
}

async function writeMetaFile(
  handle: FileSystemDirectoryHandle,
  meta: WorkspaceMeta
): Promise<void> {
  await ensureMetaDir(handle)
  const metaDir = await handle.getDirectoryHandle(META_DIR)
  const fileHandle = await metaDir.getFileHandle(META_FILE, { create: true })
  const writable = await fileHandle.createWritable()
  await writable.write(JSON.stringify(meta, null, 2))
  await writable.close()
}

// --- Note CRUD ---

export interface NoteFile {
  id: string
  title: string
  content: string
  folder?: string
  createdAt: string
  updatedAt: string
}

export async function loadAllNotes(): Promise<NoteFile[]> {
  if (!workspaceHandle) return []

  const meta = await readMetaFile(workspaceHandle)
  const notes: NoteFile[] = []

  for (const m of meta.notes) {
    const fileName = `${m.id}.html`
    try {
      const fileHandle = await workspaceHandle.getFileHandle(fileName)
      const file = await fileHandle.getFile()
      const content = await file.text()
      notes.push({ ...m, content, folder: m.folder })
    } catch {
      // File missing, skip
    }
  }

  return notes.sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
}

export async function saveNoteToFile(
  id: string,
  title: string,
  content: string
): Promise<string> {
  if (!workspaceHandle) throw new Error("No workspace open")

  const meta = await readMetaFile(workspaceHandle)
  const existing = meta.notes.find((n) => n.id === id)
  const now = new Date().toISOString()

  if (existing) {
    existing.title = title
    existing.updatedAt = now
  } else {
    meta.notes.unshift({
      id,
      title,
      createdAt: now,
      updatedAt: now,
    })
  }

  // Write the .html file
  const fileName = `${id}.html`
  const fileHandle = await workspaceHandle.getFileHandle(fileName, {
    create: true,
  })
  const writable = await fileHandle.createWritable()
  await writable.write(content)
  await writable.close()

  // Update metadata
  await writeMetaFile(workspaceHandle, meta)

  return now
}

export async function deleteNoteFile(id: string): Promise<void> {
  if (!workspaceHandle) throw new Error("No workspace open")

  const meta = await readMetaFile(workspaceHandle)
  meta.notes = meta.notes.filter((n) => n.id !== id)
  await writeMetaFile(workspaceHandle, meta)

  const fileName = `${id}.html`
  try {
    await workspaceHandle.removeEntry(fileName)
  } catch {
    // File doesn't exist, ignore
  }
}

// --- Folders ---

export async function createFolder(name: string): Promise<void> {
  if (!workspaceHandle) throw new Error("No workspace open")
  await workspaceHandle.getDirectoryHandle(name, { create: true })
}

export async function listFolders(): Promise<string[]> {
  if (!workspaceHandle) return []
  const folders: string[] = []
  // FileSystemDirectoryHandle supports async iteration in modern browsers
  const handle = workspaceHandle as FileSystemDirectoryHandle & AsyncIterable<[string, FileSystemHandle]>
  for await (const [name, entry] of handle) {
    if (name.startsWith(".")) continue
    if (name.endsWith(".html")) continue
    if (entry.kind === "directory") {
      folders.push(name)
    }
  }
  return folders.sort()
}

export async function deleteFolder(name: string): Promise<void> {
  if (!workspaceHandle) throw new Error("No workspace open")
  await workspaceHandle.removeEntry(name, { recursive: true })
}

export function isFileSystemSupported(): boolean {
  return "showDirectoryPicker" in window
}
