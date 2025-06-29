import React, { useState, useCallback } from 'react'
import { 
  FolderPlus, 
  FolderOpen, 
  Github, 
  Save, 
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import ProjectModal from './modals/ProjectModal'
import LoadProjectModal from './modals/LoadProjectModal'
import GithubModal from './modals/GithubModal'
import FileExplorer from './FileExplorer'
import LayersPanel from './LayersPanel'
import ComponentsPanel from './ComponentsPanel'
import AssetsPanel from './AssetsPanel'
import DesignSystemPanel from './DesignSystemPanel'
import HistoryPanel from './HistoryPanel'
import type { Project, SelectedElement } from '../types'

interface SidebarProps {
  currentProject: Project | null
  onCreateProject: (name: string, template: string) => void
  onLoadProject: (project: Project) => void
  onLoadFromGithub: (url: string, branch?: string) => void
  onSaveProject: () => void
  onElementSelect: (element: SelectedElement) => void
  selectedElement: SelectedElement | null
  onCodeChange: (filePath: string, content: string) => void
  onProjectUpdate: (project: Project) => void
}

type SidebarPanel = 'project' | 'layers' | 'components' | 'assets' | 'design-system' | 'history' | 'files'

const Sidebar: React.FC<SidebarProps> = ({
  currentProject,
  onCreateProject,
  onLoadProject,
  onLoadFromGithub,
  onSaveProject,
  onElementSelect,
  selectedElement,
  onCodeChange,
  onProjectUpdate
}) => {
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [showLoadModal, setShowLoadModal] = useState(false)
  const [showGithubModal, setShowGithubModal] = useState(false)
  const [activePanel, setActivePanel] = useState<SidebarPanel>('layers')
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())

  const handleCreateProject = useCallback((name: string, template: string) => {
    onCreateProject(name, template)
    setShowProjectModal(false)
  }, [onCreateProject])

  const handleLoadProject = useCallback((project: Project) => {
    onLoadProject(project)
    setShowLoadModal(false)
  }, [onLoadProject])

  const handleLoadFromGithub = useCallback((url: string, branch?: string) => {
    onLoadFromGithub(url, branch)
    setShowGithubModal(false)
  }, [onLoadFromGithub])

  const toggleSection = useCallback((sectionId: string) => {
    const newCollapsed = new Set(collapsedSections)
    if (newCollapsed.has(sectionId)) {
      newCollapsed.delete(sectionId)
    } else {
      newCollapsed.add(sectionId)
    }
    setCollapsedSections(newCollapsed)
  }, [collapsedSections])

  const panels = [
    { id: 'layers', label: 'Layers', icon: '📋' },
    { id: 'components', label: 'Components', icon: '🧩' },
    { id: 'assets', label: 'Assets', icon: '🖼️' },
    { id: 'design-system', label: 'Design System', icon: '🎨' },
    { id: 'history', label: 'History', icon: '⏱️' },
    { id: 'files', label: 'Files', icon: '📁' },
  ] as const

  const renderPanelContent = () => {
    switch (activePanel) {
      case 'layers':
        return (
          <LayersPanel
            selectedElement={selectedElement}
            onElementSelect={onElementSelect}
            currentProject={currentProject}
            onCodeChange={onCodeChange}
            onProjectUpdate={onProjectUpdate}
          />
        )
      case 'components':
        return (
          <ComponentsPanel
            currentProject={currentProject}
            onAddComponent={onCodeChange}
            selectedElement={selectedElement}
            onProjectUpdate={onProjectUpdate}
          />
        )
      case 'assets':
        return (
          <AssetsPanel
            currentProject={currentProject}
            onAddAsset={onCodeChange}
          />
        )
      case 'design-system':
        return (
          <DesignSystemPanel
            currentProject={currentProject}
            onUpdateDesignSystem={onCodeChange}
            onProjectUpdate={onProjectUpdate}
          />
        )
      case 'history':
        return (
          <HistoryPanel
            currentProject={currentProject}
            onRestoreVersion={onCodeChange}
          />
        )
      case 'files':
        return <FileExplorer project={currentProject} />
      default:
        return null
    }
  }

  return (
    <>
      <div className="w-80 panel flex flex-col">
        {/* Header */}
        <div className="panel-header flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center font-bold">
            A
          </div>
          <h1 className="text-lg font-bold">Aura</h1>
        </div>

        {/* Project Section */}
        <div className="panel-section border-b border-gray-700">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('project')}
          >
            <h3 className="section-title flex items-center gap-2">
              {collapsedSections.has('project') ? (
                <ChevronRight size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
              Project
            </h3>
          </div>
          
          {!collapsedSections.has('project') && (
            <div className="space-y-2 mt-3">
              <button
                onClick={() => setShowProjectModal(true)}
                className="btn btn-primary w-full justify-start text-sm"
              >
                <FolderPlus size={16} />
                New Project
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowLoadModal(true)}
                  className="btn btn-secondary justify-start text-xs"
                >
                  <FolderOpen size={14} />
                  Load
                </button>
                <button
                  onClick={() => setShowGithubModal(true)}
                  className="btn btn-secondary justify-start text-xs"
                >
                  <Github size={14} />
                  GitHub
                </button>
              </div>
              <button
                onClick={onSaveProject}
                disabled={!currentProject}
                className="btn btn-secondary w-full justify-start text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={16} />
                Save Project
              </button>
            </div>
          )}
        </div>

        {/* Panel Navigation */}
        <div className="border-b border-gray-700">
          <div className="grid grid-cols-3 gap-0">
            {panels.map((panel) => (
              <button
                key={panel.id}
                onClick={() => setActivePanel(panel.id)}
                className={`p-3 text-xs font-medium transition-colors border-b-2 ${
                  activePanel === panel.id
                    ? 'bg-gray-700 text-primary-400 border-primary-400'
                    : 'bg-transparent text-gray-400 border-transparent hover:text-gray-300 hover:bg-gray-750'
                }`}
                title={panel.label}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-sm">{panel.icon}</span>
                  <span className="text-xs truncate w-full">{panel.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Panel Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {renderPanelContent()}
        </div>
      </div>

      {/* Modals */}
      {showProjectModal && (
        <ProjectModal
          onSubmit={handleCreateProject}
          onClose={() => setShowProjectModal(false)}
        />
      )}

      {showLoadModal && (
        <LoadProjectModal
          onSubmit={handleLoadProject}
          onClose={() => setShowLoadModal(false)}
        />
      )}

      {showGithubModal && (
        <GithubModal
          onSubmit={handleLoadFromGithub}
          onClose={() => setShowGithubModal(false)}
        />
      )}
    </>
  )
}

export default Sidebar
