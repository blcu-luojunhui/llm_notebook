import type { Editor } from "@tiptap/react"
import {
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
  ImageIcon,
  Minus,
  ListTodo,
  Bold,
  Link2,
  Paperclip,
} from "lucide-react"

interface Command {
  title: string
  description: string
  keywords: string[]
  icon: React.ElementType
  action: (editor: Editor) => void
}

const COMMANDS: Command[] = [
  {
    title: "一级标题",
    description: "大标题，用于章节开头",
    keywords: ["h1", "heading1"],
    icon: Heading1,
    action: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    title: "二级标题",
    description: "中等标题，用于小节",
    keywords: ["h2", "heading2"],
    icon: Heading2,
    action: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    title: "三级标题",
    description: "小标题，用于段落标题",
    keywords: ["h3", "heading3"],
    icon: Heading3,
    action: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    title: "四级标题",
    description: "更小的层级标题",
    keywords: ["h4", "heading4"],
    icon: Heading4,
    action: (e) => e.chain().focus().toggleHeading({ level: 4 }).run(),
  },
  {
    title: "五级标题",
    description: "深层层级标题",
    keywords: ["h5", "heading5"],
    icon: Heading5,
    action: (e) => e.chain().focus().toggleHeading({ level: 5 }).run(),
  },
  {
    title: "六级标题",
    description: "最深层层级标题",
    keywords: ["h6", "heading6"],
    icon: Heading6,
    action: (e) => e.chain().focus().toggleHeading({ level: 6 }).run(),
  },
  {
    title: "加粗",
    description: "切换选中文字加粗",
    keywords: ["b", "bold", "strong"],
    icon: Bold,
    action: (e) => e.chain().focus().toggleBold().run(),
  },
  {
    title: "超链接",
    description: "插入超链接",
    keywords: ["link", "url", "href", "a"],
    icon: Link2,
    action: (e) => {
      const url = window.prompt("输入链接地址", "https://")
      if (url) {
        e.chain().focus().setLink({ href: url }).run()
      }
    },
  },
  {
    title: "无序列表",
    description: "创建项目符号列表",
    keywords: ["list", "ul", "bullet"],
    icon: List,
    action: (e) => e.chain().focus().toggleBulletList().run(),
  },
  {
    title: "有序列表",
    description: "创建编号列表",
    keywords: ["ol", "ordered", "numbered"],
    icon: ListOrdered,
    action: (e) => e.chain().focus().toggleOrderedList().run(),
  },
  {
    title: "待办列表",
    description: "创建任务清单",
    keywords: ["todo", "task", "checkbox"],
    icon: ListTodo,
    action: (e) => e.chain().focus().toggleTaskList().run(),
  },
  {
    title: "引用块",
    description: "创建引用或提示块",
    keywords: ["quote", "blockquote", "cite"],
    icon: Quote,
    action: (e) => e.chain().focus().toggleBlockquote().run(),
  },
  {
    title: "代码块",
    description: "插入语法高亮的代码块，/python /java /mysql 直接指定语言",
    keywords: [
      "code", "codeblock", "javascript", "python", "java", "go", "typescript",
      "sql", "mysql", "rust", "cpp", "c++", "bash", "shell", "json", "html",
      "css", "yaml", "xml", "ts", "js", "py", "rb", "rs", "sh",
    ],
    icon: Code2,
    action: (e) => e.chain().focus().toggleCodeBlock().run(),
  },
  {
    title: "表格",
    description: "插入 3x3 表格",
    keywords: ["table", "grid"],
    icon: Table2,
    action: (e) =>
      e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
  {
    title: "图片",
    description: "从本地文件插入图片",
    keywords: ["pic", "picture", "image", "img", "photo"],
    icon: ImageIcon,
    action: (e) => {
      const input = document.createElement("input")
      input.type = "file"
      input.accept = "image/*"
      input.onchange = () => {
        const file = input.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = () => {
          e.chain().focus().setImage({ src: reader.result as string }).run()
        }
        reader.readAsDataURL(file)
      }
      input.click()
    },
  },
  {
    title: "附件",
    description: "从本地文件插入附件引用",
    keywords: ["file", "attachment", "attach"],
    icon: Paperclip,
    action: (e) => {
      const input = document.createElement("input")
      input.type = "file"
      input.onchange = () => {
        const file = input.files?.[0]
        if (!file) return
        const size =
          file.size < 1024
            ? `${file.size}B`
            : file.size < 1024 * 1024
            ? `${(file.size / 1024).toFixed(1)}KB`
            : `${(file.size / (1024 * 1024)).toFixed(1)}MB`
        e
          .chain()
          .focus()
          .insertContent(
            `<p>📎 <strong>${file.name}</strong> (${size})</p>`
          )
          .run()
      }
      input.click()
    },
  },
  {
    title: "分隔线",
    description: "插入水平分隔线",
    keywords: ["hr", "divider", "line"],
    icon: Minus,
    action: (e) => e.chain().focus().setHorizontalRule().run(),
  },
]

interface SlashCommandMenuProps {
  commands: Command[]
  position: { x: number; y: number }
  selectedIndex: number
  searchText: string
  onSelect: (command: Command) => void
}

export function SlashCommandMenu({
  commands,
  position,
  selectedIndex,
  searchText,
  onSelect,
}: SlashCommandMenuProps) {
  const hasSearch = searchText.length > 0

  return (
    <div
      className="absolute z-50 w-64 overflow-hidden rounded-lg border border-border bg-popover shadow-xl"
      style={{ left: position.x, top: position.y }}
    >
      <div className="border-b border-border px-3 py-2">
        <span className="text-xs font-medium text-muted-foreground">
          {hasSearch ? `匹配 "${searchText}"` : "快捷指令"}
        </span>
      </div>
      <div className="max-h-64 overflow-y-auto p-1">
        {commands.length === 0 ? (
          <p className="px-2 py-4 text-center text-xs text-muted-foreground">
            无匹配命令
          </p>
        ) : (
          commands.map((cmd, i) => (
            <button
              key={cmd.title}
              onClick={() => onSelect(cmd)}
              className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors ${
                i === selectedIndex
                  ? "bg-accent text-accent-foreground"
                  : "text-foreground hover:bg-accent/50"
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                  i === selectedIndex
                    ? "bg-background text-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <cmd.icon className="h-4 w-4" />
              </span>
              <div className="flex flex-col min-w-0">
                <span className="font-medium truncate">{cmd.title}</span>
                <span className="text-xs text-muted-foreground truncate">
                  {hasSearch ? cmd.keywords.slice(0, 3).join(", ") : cmd.description}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}

export { COMMANDS }
export type { Command }
