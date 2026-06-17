import { Extension } from "@tiptap/core"
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state"

const PAIRS: Record<string, string> = {
  "(": ")",
  "[": "]",
  "{": "}",
}

const QUOTES: Record<string, string> = {
  '"': '"',
  "'": "'",
  "`": "`",
}

export const CodeBlockEditing = Extension.create({
  name: "codeBlockEditing",

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        if (!editor.isActive("codeBlock")) return false

        const { state } = editor
        const { $from } = state.selection
        const text = $from.parent.textContent

        const beforeCursor = text.slice(0, $from.parentOffset)
        const lastNL = beforeCursor.lastIndexOf("\n")
        const line = lastNL >= 0 ? beforeCursor.slice(lastNL + 1) : beforeCursor
        const indent = line.match(/^(\s*)/)?.[1] ?? ""

        const trimmed = line.trimEnd()
        // extra indent after opening brackets/colon
        const extra = /[{[(:]\s*$/.test(trimmed) ? "    " : ""

        // look ahead: is there a closing bracket right after cursor?
        const afterCursor = text.slice($from.parentOffset)
        const nextNL = afterCursor.indexOf("\n")
        const rest = nextNL >= 0 ? afterCursor.slice(0, nextNL) : afterCursor
        const closingMatch = rest.match(/^\s*([}\]\)])/)

        const TAB = 4

        if (closingMatch) {
          const dedentLen = Math.min(indent.length, TAB)
          const dedent = indent.slice(0, -dedentLen)
          const closeBracket = closingMatch[1]
          editor.commands.insertContent(`\n${dedent}${closeBracket}`)
          const pos = $from.pos + 1 + dedent.length + closeBracket.length
          editor.commands.setTextSelection(pos)
          return true
        }

        editor.commands.insertContent(`\n${indent}${extra}`)
        return true
      },

    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("codeBlockEditing"),
        props: {
          handleTextInput(view, from, to, text) {
            const { state } = view
            const $from = state.doc.resolve(from)
            let inCB = false
            for (let d = $from.depth; d >= 0; d--) {
              if ($from.node(d).type.name === "codeBlock") {
                inCB = true
                break
              }
            }
            if (!inCB || from !== to) return false

            // bracket auto-close
            if (PAIRS[text]) {
              const tr = state.tr.insertText(text + PAIRS[text], from, to)
              tr.setSelection(TextSelection.create(tr.doc, from + 1))
              view.dispatch(tr)
              return true
            }

            // quote auto-close — only when next char is whitespace/end
            if (QUOTES[text]) {
              const after =
                to < state.doc.content.size
                  ? state.doc.textBetween(to, to + 1)
                  : ""
              const shouldClose =
                after === "" || after === " " || after === "\n"
              if (shouldClose) {
                const tr = state.tr.insertText(text + text, from, to)
                tr.setSelection(TextSelection.create(tr.doc, from + 1))
                view.dispatch(tr)
                return true
              }
            }

            // smart skip: if typing closing bracket and next char is the same
            const allClose = [
              ...Object.values(PAIRS),
              ...Object.values(QUOTES),
            ]
            if (allClose.includes(text)) {
              const next =
                to < state.doc.content.size
                  ? state.doc.textBetween(to, to + 1)
                  : ""
              if (next === text) {
                view.dispatch(
                  state.tr.setSelection(
                    TextSelection.create(state.doc, to + 1),
                  ),
                )
                return true
              }
            }

            return false
          },

          handleKeyDown(view, event) {
            const { state } = view
            const { $from, from, to } = state.selection

            let inCB = false
            for (let d = $from.depth; d >= 0; d--) {
              if ($from.node(d).type.name === "codeBlock") {
                inCB = true
                break
              }
            }
            if (!inCB) return false

            // backspace empty bracket pair
            if (event.key === "Backspace" && from === to) {
              const before =
                from > 0 ? state.doc.textBetween(from - 1, from) : ""
              const after =
                to < state.doc.content.size
                  ? state.doc.textBetween(to, to + 1)
                  : ""
              const allPairs = { ...PAIRS, ...QUOTES }
              if (allPairs[before] && allPairs[before] === after) {
                const tr = state.tr.delete(from - 1, to + 1)
                view.dispatch(tr)
                return true
              }
            }

            return false
          },
        },
      }),
    ]
  },
})
