import { useCallback, useEffect, useState } from "react"
import { useEditor } from "@tiptap/react"
import { editorExtensions } from "@/components/RichEditor/extensions"
import { RichEditor } from "@/components/RichEditor/RichEditor"
import "@/components/RichEditor/RichEditor.css"
import type { Note } from "@/types"
import { FileText } from "lucide-react"

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

  // ── Empty state ──
  if (!note) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-8 max-w-sm text-center px-8 animate-fade-in">
          <div className="flex flex-col items-center gap-3">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shadow-sm ring-1 ring-primary/10">
              <FileText className="h-10 w-10 text-primary/50" />
            </div>
            <div className="flex flex-col gap-2">
              <h1 className="text-[22px] font-bold text-foreground/90 tracking-tight">
                第一性笔记
              </h1>
              <p className="text-[13px] font-medium text-primary/60">
                回归本质，从头思考
              </p>
              <p className="text-[13px] text-muted-foreground/60 leading-relaxed mt-1">
                拆解问题到不可再分的基本元素<br />
                从最底层公理出发，重建你的认知体系
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2.5 rounded-xl border border-border/60 bg-card px-4 py-2 shadow-sm">
            <kbd className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground shadow-sm">
              Ctrl+N
            </kbd>
            <span className="text-[12px] text-muted-foreground/70">新建笔记</span>
          </div>
        </div>
      </div>
    )
  }

  // ── Editor ──
  return (
    <div className="flex h-full flex-col bg-background">
      {/* Title bar */}
      <div className="flex items-center border-b border-border/60 bg-card/80 backdrop-blur-sm px-6 py-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          onKeyDown={handleTitleKeyDown}
          className="flex-1 bg-transparent text-[22px] font-bold text-foreground/90 outline-none placeholder:text-muted-foreground/30 tracking-tight"
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
