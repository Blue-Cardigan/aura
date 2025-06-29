import React from 'react'
import { File, FileText, FolderOpen, Code, Palette, ExternalLink } from 'lucide-react'
import type { Project } from '../types'

interface FileExplorerProps {
  project: Project | null
}

const FileExplorer: React.FC<FileExplorerProps> = ({ project }) => {
  if (!project) {
    return (
      <div className="text-center text-gray-400 py-4">
        No project loaded
      </div>
    )
  }

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    
    switch (ext) {
      case 'tsx':
      case 'jsx':
      case 'ts':
      case 'js':
        return <Code size={14} className="text-blue-400" />
      case 'css':
      case 'scss':
      case 'sass':
        return <Palette size={14} className="text-green-400" />
      case 'html':
        return <FileText size={14} className="text-orange-400" />
      case 'json':
        return <FileText size={14} className="text-yellow-400" />
      default:
        return <File size={14} className="text-gray-400" />
    }
  }

  const handleFileClick = (fileName: string) => {
    // In a full implementation, this would open the file in an editor
    console.log('Opening file:', fileName)
  }

  const handleOpenInFileManager = () => {
    if (project.projectPath) {
      // In a real implementation, this would open the project folder
      console.log('Opening project folder:', project.projectPath)
      alert(`Project folder: ${project.projectPath}\n\nIn a real implementation, this would open the folder in your file manager.`)
    }
  }

  const renderFileTree = (files: any, path = '') => {
    return Object.entries(files).map(([name, node]: [string, any]) => {
      const fullPath = path ? `${path}/${name}` : name
      
      if (node.directory) {
        return (
          <div key={fullPath}>
            <div className="file-item">
              <FolderOpen size={14} className="text-yellow-400" />
              <span>{name}</span>
            </div>
            <div className="ml-4">
              {renderFileTree(node.directory, fullPath)}
            </div>
          </div>
        )
      } else {
        return (
          <div
            key={fullPath}
            className="file-item"
            onClick={() => handleFileClick(fullPath)}
          >
            {getFileIcon(name)}
            <span>{name}</span>
          </div>
        )
      }
    })
  }

  return (
    <div className="space-y-2">
      {/* Project Info */}
      {project.projectPath && (
        <div className="bg-gray-700 rounded-lg p-3 space-y-2">
          <div className="text-xs text-gray-400">Project Location</div>
          <div className="text-xs text-gray-300 font-mono break-all">
            {project.projectPath}
          </div>
          <button
            onClick={handleOpenInFileManager}
            className="btn btn-secondary text-xs w-full"
          >
            <ExternalLink size={12} />
            Open Folder
          </button>
        </div>
      )}
      
      {/* File Tree */}
      <div className="max-h-48 overflow-y-auto bg-gray-800 rounded-lg p-2">
        {renderFileTree(project.files)}
      </div>
    </div>
  )
}

export default FileExplorer
