import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { Note } from "@/types"
import { listFolders, createFolder, deleteFolder } from "@/lib/filesystem"
import {
  Plus,
  Trash2,
  FileText,
  PanelLeftClose,
  PanelLeft,
  FolderClosed,
  FolderOpen,
  FolderPlus,
  FolderSync,
  Loader2,
  ChevronRight,
  ChevronDown,
} from "lucide-react"

interface FolderNode {
  name: string
  path: string
  children: FolderNode[]
}

function buildFolderTree(folders: string[]): FolderNode[] {
  const root: FolderNode[] = []
  const map = new Map<string, FolderNode>()
  for (const path of folders) {
    const parts = path.split("/")
    const name = parts[parts.length - 1]
    const node: FolderNode = { name, path, children: [] }
    map.set(path, node)
    if (parts.length === 1) {
      root.push(node)
    } else {
      const parentPath = parts.slice(0, -1).join("/")
      const parent = map.get(parentPath)
      if (parent) {
        parent.children.push(node)
      } else {
        root.push(node)
      }
    }
  }
  return root
}

interface SidebarProps {
  notes: Note[]
  activeId: string | null
  collapsed: boolean
  workspaceOpen: boolean
  loading: boolean
  fsSupported: boolean
  onSelect: (id: string) => void
  onCreate: (folder?: string) => void
  onDelete: (id: string) => void
  onMoveNote: (id: string, toFolder: string | undefined) => void
  onToggle: () => void
  onOpenDir: () => void
  onSwitchDir: () => void
}

export function Sidebar({
  notes,
  activeId,
  collapsed,
  workspaceOpen,
  loading,
  fsSupported,
  onSelect,
  onCreate,
  onDelete,
  onMoveNote,
  onToggle,
  onOpenDir,
  onSwitchDir,
}: SidebarProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [folders, setFolders] = useState<string[]>([])
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderIn, setNewFolderIn] = useState<string | null>(null)
  const [newFolderName, setNewFolderName] = useState("")
  const [dragNoteId, setDragNoteId] = useState<string | null>(null)
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null)

  const folderTree = buildFolderTree(folders)

  useEffect(() => {
    if (workspaceOpen) {
      listFolders().then(setFolders)
    } else {
      setFolders([])
    }
  }, [workspaceOpen, notes.length])

  const handleCreateFolder = async (parentPath?: string) => {
    const name = newFolderName.trim()
    if (!name) return
    await createFolder(name, parentPath)
    setNewFolderName("")
    setShowNewFolder(false)
    setNewFolderIn(null)
    if (parentPath) {
      setExpandedFolders((prev) => new Set(prev).add(parentPath))
    }
    listFolders().then(setFolders)
  }

  const handleDeleteFolder = async (path: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await deleteFolder(path)
    listFolders().then(setFolders)
  }

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  const handleDragOver = (e: React.DragEvent, folderPath: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverFolder(folderPath)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget === e.target) {
      setDragOverFolder(null)
    }
  }

  const handleDrop = (e: React.DragEvent, folderPath: string | undefined) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverFolder(null)
    setDragNoteId(null)
    if (dragNoteId) {
      const note = notes.find((n) => n.id === dragNoteId)
      if (note && note.folder !== folderPath) {
        onMoveNote(dragNoteId, folderPath)
      }
    }
  }

  const noteItemClass = (noteId: string, isActive: boolean) => {
    const base =
      "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] leading-snug transition-all duration-150"
    if (isActive)
      return `${base} bg-primary/10 text-primary font-medium`
    if (dragNoteId === noteId)
      return `${base} text-foreground/30`
    return `${base} text-foreground/70 hover:bg-muted/80 hover:text-foreground`
  }

  const renderNoteItem = (note: Note) => (
    <div
      key={note.id}
      className="group relative"
      draggable
      onDragStart={(e) => {
        setDragNoteId(note.id)
        e.dataTransfer.effectAllowed = "move"
      }}
      onDragEnd={() => {
        setDragNoteId(null)
        setDragOverFolder(null)
      }}
      onMouseEnter={() => setHoveredId(note.id)}
      onMouseLeave={() => setHoveredId(null)}
    >
      <button
        onClick={() => onSelect(note.id)}
        className={noteItemClass(note.id, note.id === activeId)}
      >
        <FileText className="h-3.5 w-3.5 shrink-0 opacity-60" />
        <span className="truncate">{note.title}</span>
      </button>
      {hoveredId === note.id && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(note.id) }}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}
    </div>
  )

  const renderFolderNode = (node: FolderNode, depth: number = 0): React.ReactNode => {
    const isExpanded = expandedFolders.has(node.path)
    const folderNotes = notes.filter((n) => n.folder === node.path)
    const isCreatingSub = newFolderIn === node.path
    const isDragOver = dragOverFolder === node.path && dragNoteId && folderNotes.every((n) => n.id !== dragNoteId)

    return (
      <div key={node.path}>
        <div
          onDragOver={(e) => handleDragOver(e, node.path)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, node.path)}
        >
          <button
            onClick={() => toggleFolder(node.path)}
            className={`flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] leading-snug transition-all duration-150 group ${
              isDragOver
                ? "bg-primary/10 ring-2 ring-primary/25 text-primary"
                : "text-foreground/70 hover:bg-muted/80 hover:text-foreground"
            }`}
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" />
            )}
            {isExpanded ? (
              <FolderOpen className="h-3.5 w-3.5 shrink-0 text-amber-500/80" />
            ) : (
              <FolderClosed className="h-3.5 w-3.5 shrink-0 text-amber-500/70" />
            )}
            <span className="truncate flex-1 font-medium">{node.name}</span>
            <button
              onClick={(e) => { e.stopPropagation(); setNewFolderIn(node.path); setNewFolderName("") }}
              className="opacity-0 group-hover:opacity-100 rounded-md p-0.5 hover:bg-muted-foreground/10 transition-all"
              title="新建子文件夹"
            >
              <FolderPlus className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onCreate(node.path) }}
              className="opacity-0 group-hover:opacity-100 rounded-md p-0.5 hover:bg-muted-foreground/10 transition-all"
              title="新建笔记"
            >
              <Plus className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => handleDeleteFolder(node.path, e)}
              className="opacity-0 group-hover:opacity-100 rounded-md p-0.5 hover:bg-destructive/10 hover:text-destructive transition-all"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </button>
        </div>
        {isExpanded && (
          <div className="ml-3.5 border-l border-border/60 pl-2.5 flex flex-col gap-0.5">
            {isCreatingSub && (
              <div className="flex items-center gap-1 py-0.5">
                <Input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateFolder(node.path)
                    if (e.key === "Escape") { setNewFolderIn(null); setNewFolderName("") }
                  }}
                  placeholder="子文件夹名..."
                  className="h-7 text-xs rounded-lg"
                  autoFocus
                />
              </div>
            )}
            {node.children.map((child) => renderFolderNode(child, depth + 1))}
            {folderNotes.map((note) => renderNoteItem(note))}
            {folderNotes.length === 0 && node.children.length === 0 && !isCreatingSub && (
              <p className="px-2.5 py-1.5 text-[11px] text-muted-foreground/40 italic">空文件夹</p>
            )}
          </div>
        )}
      </div>
    )
  }

  const rootNotes = notes.filter((n) => !n.folder)
  const rootFolders = folderTree

  // ── Collapsed ──
  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-3 border-r border-border/60 bg-sidebar py-4 px-2.5">
        <Tooltip>
          <TooltipTrigger>
            <Button variant="ghost" size="icon" onClick={onToggle} className="h-9 w-9 rounded-xl">
              <PanelLeft className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">展开侧栏</TooltipContent>
        </Tooltip>
        {!workspaceOpen && fsSupported && (
          <Tooltip>
            <TooltipTrigger>
              <button onClick={onOpenDir} className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted transition-all">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderClosed className="h-4 w-4" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">打开工作目录</TooltipContent>
          </Tooltip>
        )}
        {workspaceOpen && (
          <>
            <Tooltip>
              <TooltipTrigger>
                <Button variant="outline" size="icon" onClick={() => onCreate()} className="h-9 w-9 rounded-xl shadow-sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">新建笔记</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger>
                <button onClick={onSwitchDir} disabled={loading} className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted transition-all">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderSync className="h-4 w-4" />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">切换工作目录</TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    )
  }

  // ── Expanded ──
  return (
    <div className="flex w-60 flex-col border-r border-border/60 bg-sidebar">
      {/* Header */}
      {workspaceOpen ? (
        <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-border/50">
          <img src="/logo.png" alt="" className="h-7 w-7 rounded-lg shrink-0 shadow-sm" />
          <div className="flex flex-col min-w-0 gap-0.5 flex-1">
            <span className="text-[13px] font-semibold text-foreground/90 tracking-tight leading-none">第一性笔记</span>
            <span className="text-[10px] text-muted-foreground/50 leading-none">回归本质，从头思考</span>
          </div>
          <Tooltip>
            <TooltipTrigger>
              <button
                onClick={onSwitchDir}
                disabled={loading}
                className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground/60 hover:bg-muted hover:text-foreground transition-all"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FolderSync className="h-3.5 w-3.5" />}
              </button>
            </TooltipTrigger>
            <TooltipContent>切换工作目录</TooltipContent>
          </Tooltip>
        </div>
      ) : fsSupported ? (
        <div className="px-3 py-3 border-b border-border/50">
          <button
            onClick={onOpenDir}
            disabled={loading}
            className="flex w-full items-center gap-2.5 rounded-xl border border-dashed border-border/70 px-3 py-2 text-[12px] text-muted-foreground hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-all"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FolderClosed className="h-3.5 w-3.5" />
            )}
            打开工作目录
          </button>
        </div>
      ) : null}

      {/* Toolbar */}
      {workspaceOpen && (
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-[11px] font-semibold text-muted-foreground/70 tracking-wider uppercase">文件</span>
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger>
                <button
                  onClick={() => setShowNewFolder(true)}
                  className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                >
                  <FolderPlus className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>新建文件夹</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger>
                <button
                  onClick={() => onCreate()}
                  className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>新建笔记</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger>
                <button
                  onClick={onToggle}
                  className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                >
                  <PanelLeftClose className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>收起侧栏</TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}

      {/* Root-level new folder input */}
      {showNewFolder && (
        <div className="px-3 pb-1.5">
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateFolder()
              if (e.key === "Escape") { setShowNewFolder(false); setNewFolderName("") }
            }}
            placeholder="文件夹名..."
            className="h-7 text-xs rounded-lg"
            autoFocus
          />
        </div>
      )}

      <div className="mx-3">
        <Separator />
      </div>

      {/* File tree */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-0.5 p-2.5">
          {!workspaceOpen && !loading ? (
            <p className="px-2.5 py-10 text-center text-[12px] text-muted-foreground/60 leading-relaxed">
              {fsSupported
                ? "点击「打开工作目录」选择本地文件夹"
                : "浏览器不支持，请使用 Chrome/Edge/Arc"}
            </p>
          ) : folders.length === 0 && rootNotes.length === 0 ? (
            <p className="px-2.5 py-10 text-center text-[12px] text-muted-foreground/60 leading-relaxed">
              点击 + 创建笔记或文件夹
            </p>
          ) : (
            <>
              {/* Folders (recursive) */}
              {rootFolders.map((node) => renderFolderNode(node))}

              {/* Root notes drop zone */}
              {rootNotes.length > 0 && (
                <div
                  onDragOver={(e) => handleDragOver(e, "__root__")}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, undefined)}
                  className={`rounded-xl -mx-1 px-1 py-0.5 transition-all ${
                    dragOverFolder === "__root__" ? "bg-primary/5 ring-2 ring-primary/20" : ""
                  }`}
                >
                  {rootNotes.map((note) => renderNoteItem(note))}
                </div>
              )}
              {rootNotes.length === 0 && dragNoteId && (
                <div
                  onDragOver={(e) => handleDragOver(e, "__root__")}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, undefined)}
                  className={`rounded-xl px-3 py-5 text-center text-[12px] transition-all ${
                    dragOverFolder === "__root__"
                      ? "bg-primary/8 ring-2 ring-primary/30 text-primary font-medium"
                      : "text-muted-foreground/35 border-2 border-dashed border-border/60"
                  }`}
                >
                  拖到此处移出文件夹
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
