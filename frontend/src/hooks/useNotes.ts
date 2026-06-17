import { useState, useCallback, useEffect, useRef } from "react"
import type { Note } from "@/types"
import {
  openWorkspace,
  closeWorkspace,
  loadAllNotes,
  saveNoteToFile,
  deleteNoteFile,
  moveNoteFile,
  isFileSystemSupported,
  getStoredHandle,
} from "@/lib/filesystem"

const STORAGE_KEY = "llm-notebook-notes"

function loadLocalNotes(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalNotes(notes: Note[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
}

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>(loadLocalNotes)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [workspaceOpen, setWorkspaceOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Debounced save timers: id -> timeout
  const saveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    if (notes.length > 0 && !activeId) {
      setActiveId(notes[0].id)
    }
  }, [notes, activeId])

  // Auto-restore workspace from browser cache
  useEffect(() => {
    if (!isFileSystemSupported()) return
    getStoredHandle().then((h) => {
      if (!h) return
      h.queryPermission({ mode: "readwrite" }).then((status) => {
        if (status !== "granted") return
        openWorkspace().then(() => {
          loadAllNotes().then((files) => {
            if (files.length > 0) {
              setNotes(files)
              setActiveId(files[0].id)
            }
            setWorkspaceOpen(true)
          })
        })
      })
    })
  }, [])

  const notesRef = useRef(notes)
  notesRef.current = notes

  const activeNote = notes.find((n) => n.id === activeId) ?? null

  const openDir = useCallback(async () => {
    setLoading(true)
    const handle = await openWorkspace()
    if (handle) {
      const files = await loadAllNotes()
      if (files.length > 0) {
        setNotes(files)
        setActiveId(files[0].id)
      }
      setWorkspaceOpen(true)
    }
    setLoading(false)
  }, [])

  const closeDir = useCallback(async () => {
    await closeWorkspace()
    setWorkspaceOpen(false)
    setNotes([])
    setActiveId(null)
  }, [])

  const createNote = useCallback((folder?: string) => {
    const now = new Date().toISOString()
    const note: Note = {
      id: crypto.randomUUID(),
      title: "未命名笔记",
      content: "",
      folder,
      createdAt: now,
      updatedAt: now,
    }
    setNotes((prev) => [note, ...prev])
    setActiveId(note.id)
    if (workspaceOpen) {
      saveNoteToFile(note.id, note.title, note.content, folder)
    }
  }, [workspaceOpen])

  const updateContent = useCallback(
    (id: string, content: string) => {
      setNotes((prev) => {
        // Save to localStorage as fallback
        if (!workspaceOpen) {
          const next = prev.map((n) =>
            n.id === id
              ? { ...n, content, updatedAt: new Date().toISOString() }
              : n
          )
          saveLocalNotes(next)
          return next
        }
        return prev.map((n) =>
          n.id === id
            ? { ...n, content, updatedAt: new Date().toISOString() }
            : n
        )
      })

      // Debounced file save
      if (workspaceOpen) {
        const existing = saveTimers.current.get(id)
        if (existing) clearTimeout(existing)
        const timer = setTimeout(() => {
          const latest = notesRef.current.find((n) => n.id === id)
          if (latest) {
            saveNoteToFile(id, latest.title, content, latest.folder)
          }
          saveTimers.current.delete(id)
        }, 500)
        saveTimers.current.set(id, timer)
      }
    },
    [workspaceOpen]
  )

  const renameNote = useCallback(
    (id: string, title: string) => {
      setNotes((prev) => {
        if (!workspaceOpen) {
          const next = prev.map((n) =>
            n.id === id
              ? { ...n, title, updatedAt: new Date().toISOString() }
              : n
          )
          saveLocalNotes(next)
          return next
        }
        return prev.map((n) =>
          n.id === id
            ? { ...n, title, updatedAt: new Date().toISOString() }
            : n
        )
      })

      if (workspaceOpen) {
        const latest = notesRef.current.find((n) => n.id === id)
        if (latest) {
          saveNoteToFile(id, title, latest.content, latest.folder)
        }
      }
    },
    [workspaceOpen]
  )

  const moveNote = useCallback(
    (id: string, toFolder: string | undefined) => {
      setNotes((prev) => {
        const next = prev.map((n) =>
          n.id === id
            ? { ...n, folder: toFolder, updatedAt: new Date().toISOString() }
            : n
        )
        if (!workspaceOpen) saveLocalNotes(next)
        return next
      })
      if (workspaceOpen) {
        const note = notesRef.current.find((n) => n.id === id)
        if (note) {
          moveNoteFile(id, note.title, note.content, note.folder, toFolder)
        }
      }
    },
    [workspaceOpen]
  )

  const deleteNote = useCallback(
    (id: string) => {
      setNotes((prev) => {
        if (!workspaceOpen) {
          const next = prev.filter((n) => n.id !== id)
          saveLocalNotes(next)
          return next
        }
        return prev.filter((n) => n.id !== id)
      })
      setActiveId((prev) => (prev === id ? null : prev))

      if (workspaceOpen) {
        const note = notesRef.current.find((n) => n.id === id)
        deleteNoteFile(id, note?.folder)
      }
    },
    [workspaceOpen]
  )

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      saveTimers.current.forEach((t) => clearTimeout(t))
    }
  }, [])

  return {
    notes,
    activeNote,
    activeId,
    setActiveId,
    createNote,
    updateContent,
    renameNote,
    moveNote,
    deleteNote,
    workspaceOpen,
    loading,
    openDir,
    closeDir,
    fsSupported: isFileSystemSupported(),
  }
}
