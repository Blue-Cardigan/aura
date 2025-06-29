import React, { useState } from 'react'
import { X, Github } from 'lucide-react'

interface GithubModalProps {
  onSubmit: (url: string, branch?: string) => void
  onClose: () => void
}

const GithubModal: React.FC<GithubModalProps> = ({ onSubmit, onClose }) => {
  const [githubUrl, setGithubUrl] = useState('')
  const [branch, setBranch] = useState('main')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!githubUrl.trim()) {
      alert('Please enter a GitHub repository URL')
      return
    }
    
    // Basic URL validation
    const urlPattern = /^https:\/\/github\.com\/[\w-]+\/[\w-]+/
    if (!urlPattern.test(githubUrl)) {
      alert('Please enter a valid GitHub repository URL (e.g., https://github.com/username/repository)')
      return
    }
    
    onSubmit(githubUrl, branch || 'main')
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title flex items-center gap-2">
            <Github size={20} />
            Load from GitHub
          </h2>
          <button onClick={onClose} className="btn-ghost p-1">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Repository URL
            </label>
            <input
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              className="form-input"
              placeholder="https://github.com/username/repository"
              autoFocus
            />
            <p className="text-xs text-gray-400 mt-1">
              Enter the full GitHub repository URL
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Branch (optional)
            </label>
            <input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="form-input"
              placeholder="main"
            />
            <p className="text-xs text-gray-400 mt-1">
              Leave empty to use the default branch
            </p>
          </div>
          
          <div className="bg-blue-950 border border-blue-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-300 mb-2">Note</h4>
            <p className="text-xs text-blue-200">
              This feature loads public repositories. For private repositories, 
              you'll need to provide authentication tokens in a production environment.
            </p>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary flex-1">
              Load Project
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default GithubModal
