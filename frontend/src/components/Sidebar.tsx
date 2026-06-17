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
  FolderPlus,
  Loader2,
  ChevronRight,
  ChevronDown,
} from "lucide-react"

interface SidebarProps {
  notes: Note[]
  activeId: string | null
  collapsed: boolean
  workspaceOpen: boolean
  loading: boolean
  fsSupported: boolean
  onSelect: (id: string) => void
  onCreate: () => void
  onDelete: (id: string) => void
  onToggle: () => void
  onOpenDir: () => void
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
  onToggle,
  onOpenDir,
}: SidebarProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [folders, setFolders] = useState<string[]>([])
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")

  // Load folders when workspace opens
  useEffect(() => {
    if (workspaceOpen) {
      listFolders().then(setFolders)
    } else {
      setFolders([])
    }
  }, [workspaceOpen, notes.length])

  const handleCreateFolder = async () => {
    const name = newFolderName.trim()
    if (!name) return
    await createFolder(name)
    setNewFolderName("")
    setShowNewFolder(false)
    listFolders().then(setFolders)
  }

  const handleDeleteFolder = async (name: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await deleteFolder(name)
    listFolders().then(setFolders)
  }

  const toggleFolder = (name: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const rootNotes = notes.filter((n) => !n.folder)

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-3 border-r border-border bg-card p-3">
        <Tooltip>
          <TooltipTrigger>
            <Button variant="ghost" size="icon" onClick={onToggle} className="h-8 w-8">
              <PanelLeft className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">展开侧栏</TooltipContent>
        </Tooltip>
        {!workspaceOpen && fsSupported && (
          <Tooltip>
            <TooltipTrigger>
              <button onClick={onOpenDir} className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent/50 transition-colors">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderClosed className="h-4 w-4" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">打开工作目录</TooltipContent>
          </Tooltip>
        )}
        {workspaceOpen && (
          <Tooltip>
            <TooltipTrigger>
              <Button variant="outline" size="icon" onClick={onCreate} className="h-8 w-8">
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">新建笔记</TooltipContent>
          </Tooltip>
        )}
      </div>
    )
  }

  return (
    <div className="flex w-56 flex-col border-r border-border bg-card">
      {/* Workspace header */}
      {workspaceOpen ? (
        <div className="flex items-center gap-2 px-3 py-3 border-b border-border">
          <img src="/logo.png" alt="" className="h-6 w-6 rounded-md shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-foreground truncate">第一性笔记</span>
            <span className="text-[10px] text-muted-foreground/60 truncate">回归本质，从头思考</span>
          </div>
        </div>
      ) : fsSupported ? (
        <div className="px-3 py-2.5 border-b border-border">
          <button
            onClick={onOpenDir}
            disabled={loading}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground transition-colors"
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

      {/* Action bar */}
      {workspaceOpen && (
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-xs font-semibold text-muted-foreground">文件</span>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger>
                <Button variant="ghost" size="icon" onClick={() => setShowNewFolder(true)} className="h-6 w-6">
                  <FolderPlus className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>新建文件夹</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger>
                <Button variant="ghost" size="icon" onClick={onCreate} className="h-6 w-6">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>新建笔记</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger>
                <Button variant="ghost" size="icon" onClick={onToggle} className="h-6 w-6">
                  <PanelLeftClose className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>收起侧栏</TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}

      {/* New folder input */}
      {showNewFolder && (
        <div className="flex items-center gap-1 px-3 pb-1">
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateFolder()
              if (e.key === "Escape") setShowNewFolder(false)
            }}
            placeholder="文件夹名..."
            className="h-7 text-xs"
            autoFocus
          />
        </div>
      )}

      <Separator />

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-0.5 p-2">
          {!workspaceOpen && !loading ? (
            <p className="px-2 py-8 text-center text-xs text-muted-foreground">
              {fsSupported
                ? "点击「打开工作目录」选择本地文件夹"
                : "浏览器不支持，请使用 Chrome/Edge/Arc"}
            </p>
          ) : folders.length === 0 && rootNotes.length === 0 ? (
            <p className="px-2 py-8 text-center text-xs text-muted-foreground">
              点击 + 创建笔记或文件夹
            </p>
          ) : (
            <>
              {/* Folders */}
              {folders.map((folder) => (
                <div key={folder}>
                  <button
                    onClick={() => toggleFolder(folder)}
                    className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground transition-colors group"
                  >
                    {expandedFolders.has(folder) ? (
                      <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <FolderClosed className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                    <span className="truncate flex-1">{folder}</span>
                    <button
                      onClick={(e) => handleDeleteFolder(folder, e)}
                      className="opacity-0 group-hover:opacity-100 rounded p-0.5 hover:bg-destructive/10 hover:text-destructive transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </button>
                  {/* Notes inside expanded folder */}
                  {expandedFolders.has(folder) && (
                    <div className="ml-4 flex flex-col gap-0.5">
                      {notes
                        .filter((n) => n.folder === folder)
                        .map((note) => (
                          <div key={note.id} className="group relative"
                            onMouseEnter={() => setHoveredId(note.id)}
                            onMouseLeave={() => setHoveredId(null)}
                          >
                            <button
                              onClick={() => onSelect(note.id)}
                              className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm transition-colors ${
                                note.id === activeId
                                  ? "bg-accent text-accent-foreground"
                                  : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                              }`}
                            >
                              <FileText className="h-3 w-3 shrink-0" />
                              <span className="truncate">{note.title}</span>
                            </button>
                            {hoveredId === note.id && (
                              <button
                                onClick={(e) => { e.stopPropagation(); onDelete(note.id) }}
                                className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-0.5 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      {notes.filter((n) => n.folder === folder).length === 0 && (
                        <p className="px-2 py-1 text-xs text-muted-foreground/50">空文件夹</p>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Root notes */}
              {rootNotes.map((note) => (
                <div key={note.id} className="group relative"
                  onMouseEnter={() => setHoveredId(note.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <button
                    onClick={() => onSelect(note.id)}
                    className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                      note.id === activeId
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{note.title}</span>
                  </button>
                  {hoveredId === note.id && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(note.id) }}
                      className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-0.5 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
