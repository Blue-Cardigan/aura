import React, { useState, useCallback } from 'react'
import { 
  History, 
  RotateCcw, 
  GitBranch, 
  Clock, 
  User,
  FileText,
  ArrowRight,
  Bookmark,
  Plus
} from 'lucide-react'
import type { HistoryPanelProps } from '../types'

interface HistoryEntry {
  id: string
  timestamp: Date
  action: string
  description: string
  author: string
  files: string[]
  preview?: string
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({
  selectedElement,
  onElementSelect,
  currentProject,
  onCodeChange,
  onProjectUpdate
}) => {
  // Mock history data - in a real implementation, this would come from version control
  const [history, setHistory] = useState<HistoryEntry[]>([
    {
      id: 'hist-1',
      timestamp: new Date(Date.now() - 300000), // 5 minutes ago
      action: 'edit',
      description: 'Updated button colors to match brand',
      author: 'You',
      files: ['/src/App.tsx'],
      preview: 'Changed primary button from blue-500 to primary-600'
    },
    {
      id: 'hist-2',
      timestamp: new Date(Date.now() - 900000), // 15 minutes ago
      action: 'add',
      description: 'Added hero section component',
      author: 'You',
      files: ['/src/App.tsx'],
      preview: 'Inserted hero section with gradient background'
    },
    {
      id: 'hist-3',
      timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
      action: 'create',
      description: 'Created new project',
      author: 'You',
      files: ['/src/App.tsx', '/package.json', '/tailwind.config.js'],
      preview: 'Initial project setup with Vite + React + TypeScript'
    },
    {
      id: 'hist-4',
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      action: 'edit',
      description: 'Updated design system colors',
      author: 'You',
      files: ['/tailwind.config.js'],
      preview: 'Modified primary color palette'
    },
    {
      id: 'hist-5',
      timestamp: new Date(Date.now() - 7200000), // 2 hours ago
      action: 'edit',
      description: 'Refined navigation layout',
      author: 'You',
      files: ['/src/App.tsx'],
      preview: 'Adjusted navbar spacing and alignment'
    }
  ])

  const [selectedEntry, setSelectedEntry] = useState<string | null>(null)

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create':
        return <FileText size={14} className="text-green-400" />
      case 'edit':
        return <History size={14} className="text-blue-400" />
      case 'add':
        return <GitBranch size={14} className="text-purple-400" />
      case 'delete':
        return <History size={14} className="text-red-400" />
      default:
        return <History size={14} className="text-gray-400" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'bg-green-500/20 text-green-300'
      case 'edit':
        return 'bg-blue-500/20 text-blue-300'
      case 'add':
        return 'bg-purple-500/20 text-purple-300'
      case 'delete':
        return 'bg-red-500/20 text-red-300'
      default:
        return 'bg-gray-500/20 text-gray-300'
    }
  }

  const formatTimeAgo = (date: Date): string => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000)
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  const handleRestoreVersion = useCallback(async (entry: HistoryEntry) => {
    if (!currentProject) return

    if (!confirm(`Are you sure you want to restore to "${entry.description}"? This will overwrite current changes.`)) {
      return
    }

    try {
      // In a real implementation, this would restore the actual file contents
      // from the version control system
      const mockContent = generateMockContentForEntry(entry)
      
      for (const filePath of entry.files) {
        await onRestoreVersion(filePath, mockContent)
      }
      
      console.log(`Restored to version: ${entry.description}`)
    } catch (error) {
      console.error('Failed to restore version:', error)
    }
  }, [currentProject, onRestoreVersion])

  const generateMockContentForEntry = (entry: HistoryEntry): string => {
    // Generate mock file content based on the history entry
    // In a real implementation, this would retrieve the actual historical content
    
    if (entry.action === 'create') {
      return `import React from 'react'

function App() {
  return (
    <div className="min-h-screen bg-gray-50" data-webstudio-element="root">
      <h1 className="text-3xl font-bold text-center py-20" data-webstudio-element="title">
        New Project - ${entry.timestamp.toISOString()}
      </h1>
    </div>
  )
}

export default App`
    }
    
    return `// Restored from: ${entry.description}
// Timestamp: ${entry.timestamp.toISOString()}
import React from 'react'

function App() {
  return (
    <div className="min-h-screen bg-gray-50" data-webstudio-element="root">
      <div className="container mx-auto px-4 py-8" data-webstudio-element="container">
        <h1 className="text-3xl font-bold mb-4" data-webstudio-element="title">
          Restored Content
        </h1>
        <p className="text-gray-600" data-webstudio-element="description">
          ${entry.description}
        </p>
      </div>
    </div>
  )
}

export default App`
  }

  const handleCreateCheckpoint = useCallback(() => {
    const description = prompt('Enter checkpoint description:')
    if (!description) return

    // In a real implementation, this would create an actual checkpoint/commit
    const newEntry: HistoryEntry = {
      id: `hist-${Date.now()}`,
      timestamp: new Date(),
      action: 'checkpoint',
      description: description,
      author: 'You',
      files: ['/src/App.tsx'],
      preview: 'Manual checkpoint created'
    }

    setHistory(prev => [newEntry, ...prev])
    console.log('Checkpoint created:', description)
  }, [])

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 p-4">
        <div className="text-center">
          <div className="text-2xl mb-2">⏱️</div>
          <p className="text-sm">No project loaded</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-white">History</h4>
          <button
            onClick={handleCreateCheckpoint}
            className="btn-ghost p-1"
            title="Create Checkpoint"
          >
            <Bookmark size={14} />
          </button>
        </div>
        
        <div className="text-xs text-gray-400">
          {history.length} changes tracked
        </div>
      </div>

      {/* History Timeline */}
      <div className="flex-1 overflow-y-auto">
        {history.length === 0 ? (
          <div className="p-4 text-center text-gray-400">
            <Clock size={32} className="mx-auto mb-2" />
            <p className="text-sm">No history yet</p>
            <p className="text-xs mt-1">Make some changes to see history</p>
          </div>
        ) : (
          <div className="p-3">
            {history.map((entry, index) => (
              <div
                key={entry.id}
                className={`relative group ${index < history.length - 1 ? 'pb-4' : ''}`}
              >
                {/* Timeline Line */}
                {index < history.length - 1 && (
                  <div className="absolute left-4 top-8 w-0.5 h-full bg-gray-700"></div>
                )}
                
                {/* History Entry */}
                <div
                  className={`bg-gray-800 rounded-lg p-3 border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer ${
                    selectedEntry === entry.id ? 'border-primary-500 bg-primary-500/10' : ''
                  }`}
                  onClick={() => setSelectedEntry(selectedEntry === entry.id ? null : entry.id)}
                >
                  <div className="flex items-start gap-3">
                    {/* Action Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      {getActionIcon(entry.action)}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="font-medium text-white text-sm truncate">
                          {entry.description}
                        </h5>
                        <span className={`text-xs px-2 py-0.5 rounded ${getActionColor(entry.action)}`}>
                          {entry.action}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                        <User size={10} />
                        <span>{entry.author}</span>
                        <span>•</span>
                        <Clock size={10} />
                        <span>{formatTimeAgo(entry.timestamp)}</span>
                      </div>
                      
                      {entry.preview && (
                        <p className="text-xs text-gray-500 mb-2">{entry.preview}</p>
                      )}
                      
                      {/* Files Changed */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {entry.files.map((file, fileIndex) => (
                          <span
                            key={fileIndex}
                            className="text-xs px-2 py-0.5 bg-gray-700 text-gray-300 rounded"
                          >
                            {file.split('/').pop()}
                          </span>
                        ))}
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRestoreVersion(entry)
                          }}
                          className="btn btn-secondary text-xs py-1 px-2"
                          title="Restore this version"
                        >
                          <RotateCcw size={10} />
                          Restore
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            // In a real implementation, this would show a diff view
                            console.log('View diff for:', entry.id)
                          }}
                          className="btn btn-secondary text-xs py-1 px-2"
                          title="View changes"
                        >
                          <FileText size={10} />
                          Diff
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded Details */}
                  {selectedEntry === entry.id && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <div className="space-y-2">
                        <div className="text-xs">
                          <span className="text-gray-400">Full timestamp:</span>
                          <span className="text-gray-300 ml-2 font-mono">
                            {entry.timestamp.toLocaleString()}
                          </span>
                        </div>
                        <div className="text-xs">
                          <span className="text-gray-400">Files modified:</span>
                          <div className="mt-1 space-y-1">
                            {entry.files.map((file, fileIndex) => (
                              <div key={fileIndex} className="flex items-center gap-2 text-gray-300">
                                <FileText size={10} />
                                <span className="font-mono">{file}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="border-t border-gray-700 p-3">
        <div className="space-y-2">
          <button
            onClick={handleCreateCheckpoint}
            className="btn btn-primary w-full text-sm"
          >
            <Bookmark size={14} />
            Create Checkpoint
          </button>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                // In a real implementation, this would show uncommitted changes
                console.log('Show uncommitted changes')
              }}
              className="btn btn-secondary text-xs"
            >
              <GitBranch size={12} />
              Changes
            </button>
            <button
              onClick={() => {
                // In a real implementation, this would open version comparison
                console.log('Compare versions')
              }}
              className="btn btn-secondary text-xs"
            >
              <ArrowRight size={12} />
              Compare
            </button>
          </div>
        </div>
        
        <p className="text-xs text-gray-500 mt-2 text-center">
          Auto-saves every change
        </p>
      </div>
    </div>
  )
}

export default HistoryPanel
