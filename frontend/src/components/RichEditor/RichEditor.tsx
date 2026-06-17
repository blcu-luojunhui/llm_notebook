import { useCallback, useEffect, useRef, useState } from "react"
import { EditorContent, type Editor } from "@tiptap/react"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { COMMANDS } from "./SlashCommandMenu"
import { TableControls } from "./TableControls"
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  List,
  ListOrdered,
  Quote,
  Code2,
  Table2,
  Minus,
  Undo2,
  Redo2,
  ListTodo,
  ImageIcon,
} from "lucide-react"

interface RichEditorProps {
  editor: Editor | null
  onImageDrop?: (file: File) => Promise<string | void>
}

const FONT_SIZE_MIN = 16
const FONT_SIZE_MAX = 28

function MenuBar({
  editor,
  fontSize,
  onFontSizeChange,
}: {
  editor: Editor
  fontSize: number
  onFontSizeChange: (size: number) => void
}) {
  const [headingOpen, setHeadingOpen] = useState(false)
  const headingRef = useRef<HTMLDivElement>(null)

  // Close heading dropdown when clicking outside
  useEffect(() => {
    if (!headingOpen) return
    const handler = (e: MouseEvent) => {
      if (headingRef.current && !headingRef.current.contains(e.target as Node)) {
        setHeadingOpen(false)
      }
    }
    // Delay to avoid catching the trigger click
    setTimeout(() => document.addEventListener("click", handler), 0)
    return () => document.removeEventListener("click", handler)
  }, [headingOpen])

  if (!editor) return null

  const headingLabel = editor.isActive("heading", { level: 1 })
    ? "一级标题"
    : editor.isActive("heading", { level: 2 })
    ? "二级标题"
    : editor.isActive("heading", { level: 3 })
    ? "三级标题"
    : editor.isActive("heading", { level: 4 })
    ? "四级标题"
    : editor.isActive("heading", { level: 5 })
    ? "五级标题"
    : editor.isActive("heading", { level: 6 })
    ? "六级标题"
    : "正文"

  const btnClass = (active: boolean) =>
    `h-7 w-7 rounded-md flex items-center justify-center transition-colors ${
      active
        ? "bg-accent text-accent-foreground"
        : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
    }`

  const HEADING_ITEMS = [
    { label: "正文", action: () => editor.chain().focus().setParagraph().run(), icon: <span className="text-xs">¶</span> },
    { label: "一级标题", action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), icon: <Heading1 className="h-4 w-4" /> },
    { label: "二级标题", action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), icon: <Heading2 className="h-4 w-4" /> },
    { label: "三级标题", action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), icon: <Heading3 className="h-4 w-4" /> },
    { label: "四级标题", action: () => editor.chain().focus().toggleHeading({ level: 4 }).run(), icon: <Heading4 className="h-4 w-4" /> },
    { label: "五级标题", action: () => editor.chain().focus().toggleHeading({ level: 5 }).run(), icon: <Heading5 className="h-4 w-4" /> },
    { label: "六级标题", action: () => editor.chain().focus().toggleHeading({ level: 6 }).run(), icon: <Heading6 className="h-4 w-4" /> },
  ]

  return (
    <div className="flex items-center gap-0.5 border-b border-border bg-card px-3 py-2 overflow-visible">
      <Tooltip>
        <TooltipTrigger>
          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className={`h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent/50 disabled:opacity-30`}
          >
            <Undo2 className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>撤销</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className={`h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent/50 disabled:opacity-30`}
          >
            <Redo2 className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>重做</TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Heading dropdown */}
      <div ref={headingRef} className="relative">
        <button
          onClick={() => setHeadingOpen(!headingOpen)}
          className="flex items-center gap-1 rounded-md px-2 py-1 h-7 text-sm text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground transition-colors min-w-[80px]"
        >
          <span>{headingLabel}</span>
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
        </button>
        {headingOpen && (
          <div className="absolute left-0 top-full z-50 mt-1 w-36 rounded-md border border-border bg-popover p-1 shadow-lg">
            {HEADING_ITEMS.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  item.action()
                  setHeadingOpen(false)
                }}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-foreground hover:bg-accent transition-colors"
              >
                <span className="flex h-6 w-6 items-center justify-center text-muted-foreground">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <Separator orientation="vertical" className="mx-1 h-5" />

      <Tooltip>
        <TooltipTrigger>
          <button onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive("bold"))}>
            <Bold className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>加粗</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger>
          <button onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive("italic"))}>
            <Italic className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>斜体</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger>
          <button onClick={() => editor.chain().focus().toggleStrike().run()} className={btnClass(editor.isActive("strike"))}>
            <Strikethrough className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>删除线</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger>
          <button onClick={() => editor.chain().focus().toggleCode().run()} className={btnClass(editor.isActive("code"))}>
            <Code className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>行内代码</TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="mx-1 h-5" />

      <Tooltip>
        <TooltipTrigger>
          <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive("bulletList"))}>
            <List className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>无序列表</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger>
          <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive("orderedList"))}>
            <ListOrdered className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>有序列表</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger>
          <button onClick={() => editor.chain().focus().toggleTaskList().run()} className={btnClass(editor.isActive("taskList"))}>
            <ListTodo className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>待办列表</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger>
          <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btnClass(editor.isActive("blockquote"))}>
            <Quote className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>引用</TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="mx-1 h-5" />

      <Tooltip>
        <TooltipTrigger>
          <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={btnClass(editor.isActive("codeBlock"))}>
            <Code2 className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>代码块</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger>
          <button onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} className={btnClass(false)}>
            <Table2 className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>表格</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger>
          <button
            onClick={() => {
              const input = document.createElement("input")
              input.type = "file"
              input.accept = "image/*"
              input.onchange = () => {
                const file = input.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = () => {
                  editor.chain().focus().setImage({ src: reader.result as string }).run()
                }
                reader.readAsDataURL(file)
              }
              input.click()
            }}
            className={btnClass(false)}
          >
            <ImageIcon className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>图片</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger>
          <button onClick={() => editor.chain().focus().setHorizontalRule().run()} className={btnClass(false)}>
            <Minus className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>分隔线</TooltipContent>
      </Tooltip>

      <div className="flex-1" />

      <div className="flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger>
            <button
              onClick={() => onFontSizeChange(Math.max(FONT_SIZE_MIN, fontSize - 1))}
              disabled={fontSize <= FONT_SIZE_MIN}
              className="h-7 w-6 rounded-md flex items-center justify-center text-xs text-muted-foreground hover:bg-accent/50 disabled:opacity-30 transition-colors"
            >
              −
            </button>
          </TooltipTrigger>
          <TooltipContent>缩小字体</TooltipContent>
        </Tooltip>
        <span className="text-xs text-muted-foreground min-w-[2ch] text-center tabular-nums select-none">
          {fontSize}
        </span>
        <Tooltip>
          <TooltipTrigger>
            <button
              onClick={() => onFontSizeChange(Math.min(FONT_SIZE_MAX, fontSize + 1))}
              disabled={fontSize >= FONT_SIZE_MAX}
              className="h-7 w-6 rounded-md flex items-center justify-center text-xs text-muted-foreground hover:bg-accent/50 disabled:opacity-30 transition-colors"
            >
              +
            </button>
          </TooltipTrigger>
          <TooltipContent>放大字体</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}

// Map slash-command keywords to code block language identifiers
const LANGUAGE_MAP: Record<string, string> = {
  python: "python",
  py: "python",
  javascript: "javascript",
  js: "javascript",
  typescript: "typescript",
  ts: "typescript",
  java: "java",
  go: "go",
  rust: "rust",
  rs: "rust",
  sql: "sql",
  mysql: "sql",
  bash: "bash",
  shell: "bash",
  sh: "bash",
  json: "json",
  html: "html",
  css: "css",
  yaml: "yaml",
  xml: "xml",
  cpp: "cpp",
  "c++": "cpp",
  ruby: "ruby",
  rb: "ruby",
}

export function RichEditor({ editor, onImageDrop }: RichEditorProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [fontSize, setFontSize] = useState(16)
  const dragCounter = useRef(0)
  const editorContainerRef = useRef<HTMLDivElement>(null)

  // Apply font size to root element so rem-based prose scales correctly
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`
    return () => { document.documentElement.style.fontSize = "" }
  }, [fontSize])

  // Slash command: match "/keyword" pattern and auto-execute
  useEffect(() => {
    if (!editor) return

    const handleInput = () => {
      const { selection } = editor.state
      const { $from } = selection
      const text = $from.parent.textContent

      // Find the last "/" at block start or after space
      const slashIdx = text.lastIndexOf("/")
      if (slashIdx === -1) return
      if (slashIdx > 0 && text[slashIdx - 1] !== " ") return

      const trigger = text.slice(slashIdx + 1).trim()
      if (!trigger) return

      const t = trigger.toLowerCase()
      const cmd = COMMANDS.find(
        (c) =>
          c.title.toLowerCase() === t || c.keywords.some((k) => k === t)
      )
      if (!cmd) return

      // Delete "/trigger" and execute the command
      const from = $from.start() + slashIdx
      const to = $from.start() + slashIdx + trigger.length + 1
      editor.commands.deleteRange({ from, to })
      cmd.action(editor)

      // Set code block language for language keywords
      const lang = LANGUAGE_MAP[t]
      if (lang) {
        setTimeout(() => {
          editor.commands.updateAttributes("codeBlock", { language: lang })
        }, 10)
      }
    }

    editor.view.dom.addEventListener("input", handleInput)
    return () => editor.view.dom.removeEventListener("input", handleInput)
  }, [editor])

  // Drag and drop
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++
    if (e.dataTransfer.types.includes("Files")) setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current === 0) setIsDragOver(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)
      dragCounter.current = 0

      if (!editor) return
      const files = Array.from(e.dataTransfer.files).filter(
        (f) => f.type.startsWith("image/") || f.name.endsWith(".svg")
      )
      if (files.length === 0) return

      // Get drop position in editor
      const view = editor.view
      const dropPos = view.posAtCoords({
        left: e.clientX,
        top: e.clientY,
      })?.pos

      for (const file of files) {
        if (onImageDrop) {
          const result = await onImageDrop(file)
          if (result) {
            editor
              .chain()
              .focus()
              .setImage({ src: result })
              .run()
            continue
          }
        }

        if (file.name.endsWith(".svg")) {
          const svg = await file.text()
          const dataUrl = `data:image/svg+xml,${encodeURIComponent(svg)}`
          if (dropPos !== undefined) {
            editor
              .chain()
              .focus()
              .insertContentAt(dropPos, {
                type: "image",
                attrs: { src: dataUrl },
              })
              .run()
          } else {
            editor.chain().focus().setImage({ src: dataUrl }).run()
          }
        } else {
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.readAsDataURL(file)
          })
          if (dropPos !== undefined) {
            editor
              .chain()
              .focus()
              .insertContentAt(dropPos, {
                type: "image",
                attrs: { src: dataUrl },
              })
              .run()
          } else {
            editor.chain().focus().setImage({ src: dataUrl }).run()
          }
        }
      }
    },
    [editor, onImageDrop]
  )

  if (!editor) return null

  return (
    <div
      ref={editorContainerRef}
      className="relative flex h-full flex-col"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <MenuBar editor={editor} fontSize={fontSize} onFontSizeChange={setFontSize} />
      <ScrollArea className="flex-1">
        <div className="px-8 py-6 max-w-[900px]">
          <EditorContent editor={editor} className="prose prose-sm prose-stone dark:prose-invert max-w-none" />
          <TableControls editor={editor} />
        </div>
      </ScrollArea>

      {isDragOver && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-primary/10 backdrop-blur-sm pointer-events-none">
          <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-primary/50 bg-background/80 px-8 py-6">
            <ImageIcon className="h-8 w-8 text-primary" />
            <span className="text-sm font-medium text-primary">释放以插入图片</span>
          </div>
        </div>
      )}
    </div>
  )
}
