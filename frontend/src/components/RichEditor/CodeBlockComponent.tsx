import { NodeViewContent, NodeViewWrapper } from "@tiptap/react"
import { Check, Copy } from "lucide-react"
import { useState, useRef, useCallback } from "react"

const LANG_LABELS: Record<string, string> = {
  python: "Python", py: "Python",
  javascript: "JavaScript", js: "JavaScript",
  typescript: "TypeScript", ts: "TypeScript",
  java: "Java", go: "Go", rust: "Rust", rs: "Rust",
  sql: "SQL", mysql: "MySQL",
  bash: "Bash", shell: "Shell", sh: "Shell",
  json: "JSON", html: "HTML", css: "CSS",
  yaml: "YAML", xml: "XML",
  cpp: "C++", "c++": "C++",
  ruby: "Ruby", rb: "Ruby",
}

export function CodeBlockComponent({ node }: { node: { attrs: { language?: string } } }) {
  const lang = node.attrs.language || ""
  const label = LANG_LABELS[lang] || lang || "code"
  const [copied, setCopied] = useState(false)
  const preRef = useRef<HTMLPreElement>(null)

  const getText = useCallback(() => {
    return preRef.current?.textContent ?? ""
  }, [])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(getText()).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [getText])

  // Intercept native copy to strip HTML formatting
  const handleNativeCopy = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    e.clipboardData.setData("text/plain", getText())
  }, [getText])

  return (
    <NodeViewWrapper as="div" className="code-block-wrapper" data-language={lang}>
      <div className="code-block-header">
        <span className="code-block-lang">{label}</span>
        <button
          type="button"
          className="code-block-copy"
          onClick={handleCopy}
          title={copied ? "已复制" : "复制代码"}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
      <pre ref={preRef} onCopy={handleNativeCopy}>
        <NodeViewContent />
      </pre>
    </NodeViewWrapper>
  )
}
