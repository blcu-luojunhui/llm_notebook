import { useCallback, useEffect, useState } from "react"
import { useEditor } from "@tiptap/react"
import { editorExtensions } from "@/components/RichEditor/extensions"
import { RichEditor } from "@/components/RichEditor/RichEditor"
import "@/components/RichEditor/RichEditor.css"
import type { Note } from "@/types"

interface NotebookEditorProps {
  note: Note | null
  onContentChange: (id: string, content: string) => void
  onTitleChange: (id: string, title: string) => void
}

export function NotebookEditor({
  note,
  onContentChange,
  onTitleChange,
}: NotebookEditorProps) {
  const [title, setTitle] = useState("")

  const editor = useEditor({
    extensions: editorExtensions,
    content: note?.content ?? "",
    onUpdate: ({ editor }) => {
      if (note) {
        const html = editor.getHTML()
        onContentChange(note.id, html)
      }
    },
  })

  // Sync editor content when switching notes
  useEffect(() => {
    if (note && editor) {
      setTitle(note.title)
      const currentHtml = editor.getHTML()
      if (note.content !== currentHtml) {
        editor.commands.setContent(note.content ?? "")
      }
    }
  }, [note?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleTitleBlur = useCallback(() => {
    if (note && title.trim() && title !== note.title) {
      onTitleChange(note.id, title.trim())
    }
  }, [note, title, onTitleChange])

  const handleTitleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault()
        ;(e.target as HTMLInputElement).blur()
      }
    },
    []
  )

  if (!note) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6 max-w-md text-center px-8 animate-fade-in">
          <img
            src="/logo.png"
            alt="第一性笔记"
            className="h-16 w-16 rounded-xl opacity-90"
          />
          <div className="flex flex-col gap-3">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              第一性笔记
            </h1>
            <p className="text-base font-medium text-primary/80">
              回归本质，从头思考
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              拆解问题到不可再分的基本元素<br />
              从最底层公理出发，重建你的认知体系
            </p>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <kbd className="rounded-md border border-border bg-muted px-2 py-1 text-xs text-muted-foreground">
              ⌘ N
            </kbd>
            <span className="text-xs text-muted-foreground">新建笔记</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Title bar */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          onKeyDown={handleTitleKeyDown}
          className="flex-1 bg-transparent text-2xl font-bold text-foreground outline-none placeholder:text-muted-foreground/50"
          placeholder="笔记标题..."
        />
      </div>

      {/* Rich editor */}
      <div className="flex-1 overflow-hidden">
        <RichEditor editor={editor} />
      </div>
    </div>
  )
}
