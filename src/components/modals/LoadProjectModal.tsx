import React, { useState, useEffect } from 'react'
import { X, Calendar, FolderOpen, Folder, Trash2 } from 'lucide-react'
import type { Project } from '../../types'
import { ProjectService } from '../../services/ProjectService'

interface LoadProjectModalProps {
  onSubmit: (project: Project) => void
  onClose: () => void
}

const LoadProjectModal: React.FC<LoadProjectModalProps> = ({ onSubmit, onClose }) => {
  const [savedProjects, setSavedProjects] = useState<Project[]>([])
  const [generatedProjects, setGeneratedProjects] = useState<Project[]>([])
  const [activeTab, setActiveTab] = useState<'saved' | 'generated'>('saved')
  const [loading, setLoading] = useState(false)

  const projectService = new ProjectService()

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    setLoading(true)
    try {
      // Load saved projects from localStorage
      const saved = projectService.getSavedProjects()
      setSavedProjects(saved)

      // Load generated projects from filesystem
      const generated = await projectService.getGeneratedProjects()
      setGeneratedProjects(generated)
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLoadProject = (project: Project) => {
    onSubmit(project)
  }

  const handleDeleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return
    }

    try {
      await projectService.deleteProject(projectId)
      
      // Refresh the project lists
      await loadProjects()
      
      console.log(`Deleted project ${projectId}`)
    } catch (error) {
      console.error('Failed to delete project:', error)
      alert('Failed to delete project. Please try again.')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderProjectList = (projects: Project[], showPath: boolean = false) => {
    if (projects.length === 0) {
      return (
        <div className="text-center py-8">
          <FolderOpen size={48} className="text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">
            No {activeTab === 'saved' ? 'Saved' : 'Generated'} Projects
          </h3>
          <p className="text-gray-400">
            {activeTab === 'saved' 
              ? 'Create and save a project to see it here.'
              : 'Create a new project to see it here.'
            }
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {projects.map((project) => (
          <div
            key={project.id}
            className="flex items-center justify-between p-4 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer transition-colors group"
            onClick={() => handleLoadProject(project)}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                {showPath ? <Folder size={20} className="text-white" /> : <FolderOpen size={20} className="text-white" />}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-white truncate">{project.name}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Calendar size={14} />
                  <span>
                    {activeTab === 'saved' && project.savedAt
                      ? `Saved ${formatDate(project.savedAt)}`
                      : `Created ${formatDate(project.createdAt)}`
                    }
                  </span>
                  {project.template && (
                    <>
                      <span>•</span>
                      <span>{project.template}</span>
                    </>
                  )}
                </div>
                {showPath && project.projectPath && (
                  <div className="text-xs text-gray-500 truncate mt-1 font-mono">
                    {project.projectPath}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={(e) => handleDeleteProject(project.id, e)}
              className="opacity-0 group-hover:opacity-100 btn btn-secondary px-2 py-1 text-xs transition-opacity flex items-center gap-1"
              title="Delete project"
            >
              <Trash2 size={12} />
              Delete
            </button>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-2xl">
        <div className="modal-header">
          <h2 className="modal-title">Load Project</h2>
          <button onClick={onClose} className="btn-ghost p-1">
            <X size={20} />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-700 mb-4">
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'saved'
                ? 'text-primary-400 border-b-2 border-primary-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Saved Projects ({savedProjects.length})
          </button>
          <button
            onClick={() => setActiveTab('generated')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'generated'
                ? 'text-primary-400 border-b-2 border-primary-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Generated Projects ({generatedProjects.length})
          </button>
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-400">Loading projects...</p>
          </div>
        ) : (
          <>
            {activeTab === 'saved' && (
              <div>
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-300 mb-2">Saved Projects</h3>
                  <p className="text-xs text-gray-400">
                    Projects saved to browser localStorage. These are temporary and may be lost when clearing browser data.
                  </p>
                </div>
                {renderProjectList(savedProjects, false)}
              </div>
            )}

            {activeTab === 'generated' && (
              <div>
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-300 mb-2">Generated Projects</h3>
                  <p className="text-xs text-gray-400">
                    Projects created as copies of the vite-template in the generated-projects folder. These are real project files you can edit.
                  </p>
                </div>
                {renderProjectList(generatedProjects, true)}
              </div>
            )}
          </>
        )}
        
        <div className="flex justify-between items-center pt-4 border-t border-gray-700">
          <button
            onClick={() => loadProjects()}
            className="btn btn-secondary text-sm"
            disabled={loading}
          >
            Refresh
          </button>
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoadProjectModal
