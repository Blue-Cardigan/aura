import React, { useState, useCallback } from 'react'
import { 
  FolderPlus, 
  FolderOpen, 
  Github, 
  Save, 
  File, 
  FileText, 
  Settings,
  Layers
} from 'lucide-react'
import ProjectModal from './modals/ProjectModal'
import LoadProjectModal from './modals/LoadProjectModal'
import GithubModal from './modals/GithubModal'
import FileExplorer from './FileExplorer'
import LayersPanel from './LayersPanel'
import type { Project, SelectedElement } from '../types'

interface SidebarProps {
  currentProject: Project | null
  onCreateProject: (name: string, template: string) => void
  onLoadProject: (project: Project) => void
  onLoadFromGithub: (url: string, branch?: string) => void
  onSaveProject: () => void
  onElementSelect: (element: SelectedElement) => void
  selectedElement: SelectedElement | null
}

const Sidebar: React.FC<SidebarProps> = ({
  currentProject,
  onCreateProject,
  onLoadProject,
  onLoadFromGithub,
  onSaveProject,
  onElementSelect,
  selectedElement
}) => {
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [showLoadModal, setShowLoadModal] = useState(false)
  const [showGithubModal, setShowGithubModal] = useState(false)

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

  return (
    <>
      <div className="w-80 panel flex flex-col">
        {/* Header */}
        <div className="panel-header flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center font-bold">
            WS
          </div>
          <h1 className="text-lg font-bold">WebStudio</h1>
        </div>

        {/* Project Actions */}
        <div className="panel-section">
          <h3 className="section-title">Project</h3>
          <div className="space-y-2">
            <button
              onClick={() => setShowProjectModal(true)}
              className="btn btn-primary w-full justify-start"
            >
              <FolderPlus size={16} />
              New Project
            </button>
            <button
              onClick={() => setShowLoadModal(true)}
              className="btn btn-secondary w-full justify-start"
            >
              <FolderOpen size={16} />
              Load Project
            </button>
            <button
              onClick={() => setShowGithubModal(true)}
              className="btn btn-secondary w-full justify-start"
            >
              <Github size={16} />
              From GitHub
            </button>
            <button
              onClick={onSaveProject}
              disabled={!currentProject}
              className="btn btn-secondary w-full justify-start disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={16} />
              Save Project
            </button>
          </div>
        </div>

        {/* File Explorer */}
        <div className="panel-section flex-1 min-h-0">
          <h3 className="section-title">Files</h3>
          <FileExplorer project={currentProject} />
        </div>

        {/* Layers Panel */}
        <div className="panel-section">
          <h3 className="section-title">Layers</h3>
          <LayersPanel
            selectedElement={selectedElement}
            onElementSelect={onElementSelect}
          />
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
