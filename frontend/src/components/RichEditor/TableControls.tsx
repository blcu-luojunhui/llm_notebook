import { BubbleMenu } from "@tiptap/react/menus"
import type { Editor } from "@tiptap/react"
import {
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Columns,
  Rows,
  Heading,
} from "lucide-react"

interface TableControlsProps {
  editor: Editor
}

const btnClass =
  "h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
const sepClass = "w-px h-5 bg-border"

export function TableControls({ editor }: TableControlsProps) {
  return (
    <BubbleMenu
      editor={editor}
      pluginKey="tableControls"
      shouldShow={({ editor }) => editor.isActive("table")}
    >
      <div className="flex items-center gap-0.5 rounded-lg border border-border bg-popover p-1 shadow-lg">
        {/* Column operations */}
        <button
          className={btnClass}
          title="上方插入行"
          onClick={() => editor.chain().focus().addRowBefore().run()}
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
        <button
          className={btnClass}
          title="下方插入行"
          onClick={() => editor.chain().focus().addRowAfter().run()}
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </button>
        <button
          className={btnClass}
          title="左侧插入列"
          onClick={() => editor.chain().focus().addColumnBefore().run()}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </button>
        <button
          className={btnClass}
          title="右侧插入列"
          onClick={() => editor.chain().focus().addColumnAfter().run()}
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </button>

        <div className={sepClass} />

        {/* Delete operations */}
        <button
          className={btnClass}
          title="删除行"
          onClick={() => editor.chain().focus().deleteRow().run()}
        >
          <Rows className="h-3.5 w-3.5" />
        </button>
        <button
          className={btnClass}
          title="删除列"
          onClick={() => editor.chain().focus().deleteColumn().run()}
        >
          <Columns className="h-3.5 w-3.5" />
        </button>

        <div className={sepClass} />

        {/* Header toggle */}
        <button
          className={btnClass}
          title="切换标题行"
          onClick={() => editor.chain().focus().toggleHeaderRow().run()}
        >
          <Heading className="h-3.5 w-3.5" />
        </button>

        <div className={sepClass} />

        {/* Delete table */}
        <button
          className={`${btnClass} text-destructive hover:bg-destructive/10 hover:text-destructive`}
          title="删除表格"
          onClick={() => editor.chain().focus().deleteTable().run()}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </BubbleMenu>
  )
}
