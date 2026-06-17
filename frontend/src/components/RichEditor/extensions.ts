import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import { Table } from "@tiptap/extension-table"
import { TableRow } from "@tiptap/extension-table"
import { TableCell } from "@tiptap/extension-table"
import { TableHeader } from "@tiptap/extension-table"
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight"
import Placeholder from "@tiptap/extension-placeholder"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { common, createLowlight } from "lowlight"
import { CodeBlockComponent } from "./CodeBlockComponent"
import { CodeBlockEditing } from "./CodeBlockEditing"

const lowlight = createLowlight(common)

const CodeBlock = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockComponent)
  },
}).configure({ lowlight, enableTabIndentation: true })

export const editorExtensions = [
  StarterKit.configure({
    codeBlock: false,
    heading: { levels: [1, 2, 3, 4, 5, 6] },
  }),
  CodeBlock,
  CodeBlockEditing,
  Image.configure({
    allowBase64: true,
    inline: false,
  }),
  Link.configure({
    openOnClick: true,
    HTMLAttributes: { class: "text-primary underline cursor-pointer" },
  }),
  Table.configure({ resizable: true }),
  TableRow,
  TableCell,
  TableHeader,
  Placeholder.configure({
    placeholder: "输入 / 使用快捷指令，或直接开始写作...",
  }),
]
