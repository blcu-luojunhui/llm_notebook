import { useState } from "react"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Sidebar } from "@/components/Sidebar"
import { NotebookEditor } from "@/components/NotebookEditor"
import { useNotes } from "@/hooks/useNotes"

function App() {
  const {
    notes,
    activeNote,
    activeId,
    setActiveId,
    createNote,
    updateContent,
    renameNote,
    moveNote,
    deleteNote,
    workspaceOpen,
    loading,
    openDir,
    pickNewDir,
    fsSupported,
  } = useNotes()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <TooltipProvider delay={300}>
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        <Sidebar
          notes={notes}
          activeId={activeId}
          collapsed={sidebarCollapsed}
          workspaceOpen={workspaceOpen}
          loading={loading}
          fsSupported={fsSupported}
          onSelect={setActiveId}
          onCreate={createNote}
          onDelete={deleteNote}
          onMoveNote={moveNote}
          onToggle={() => setSidebarCollapsed((c) => !c)}
          onOpenDir={openDir}
          onSwitchDir={pickNewDir}
        />
        <main className="flex-1 overflow-hidden">
          <NotebookEditor
            note={activeNote}
            onContentChange={updateContent}
            onTitleChange={renameNote}
          />
        </main>
      </div>
    </TooltipProvider>
  )
}

export default App
