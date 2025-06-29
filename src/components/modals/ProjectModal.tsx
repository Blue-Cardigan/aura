import React, { useState } from 'react'
import { X } from 'lucide-react'

interface ProjectModalProps {
  onSubmit: (name: string, template: string) => void
  onClose: () => void
}

const ProjectModal: React.FC<ProjectModalProps> = ({ onSubmit, onClose }) => {
  const [projectName, setProjectName] = useState('')
  const [template, setTemplate] = useState('vite-react')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectName.trim()) {
      alert('Please enter a project name')
      return
    }
    onSubmit(projectName, template)
  }

  const templates = [
    { id: 'vite-react', name: 'Vite + React + TypeScript', description: 'Modern React app with TypeScript and Tailwind CSS' },
    { id: 'vite-vanilla', name: 'Vite + Vanilla JS', description: 'Simple vanilla JavaScript with Vite bundler' },
    { id: 'next', name: 'Next.js', description: 'Full-stack React framework' },
    { id: 'blank', name: 'Blank HTML', description: 'Empty HTML page to start from scratch' }
  ]

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Create New Project</h2>
          <button onClick={onClose} className="btn-ghost p-1">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Project Name
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="form-input"
              placeholder="My Awesome Project"
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Template
            </label>
            <div className="space-y-2">
              {templates.map((tmpl) => (
                <label key={tmpl.id} className="flex items-start gap-3 p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
                  <input
                    type="radio"
                    name="template"
                    value={tmpl.id}
                    checked={template === tmpl.id}
                    onChange={(e) => setTemplate(e.target.value)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-white">{tmpl.name}</div>
                    <div className="text-sm text-gray-400">{tmpl.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary flex-1">
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProjectModal
