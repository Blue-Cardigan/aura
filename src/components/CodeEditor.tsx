import React, { useState, useEffect, useCallback } from 'react'
import { 
  FileText, 
  Save, 
  RefreshCw, 
  Copy, 
  Eye, 
  EyeOff,
  Download,
  Search,
  Zap,
  X,
  File,
  Code
} from 'lucide-react'
import type { Project } from '../types'
import type { WebContainerService } from '../services/WebContainerService'

interface CodeEditorProps {
  project: Project | null
  webContainerService: WebContainerService
  onCodeChange: (filePath: string, content: string) => void
}

interface FileTab {
  path: string
  name: string
  content: string
  modified: boolean
  language: string
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  project,
  webContainerService,
  onCodeChange
}) => {
  const [openTabs, setOpenTabs] = useState<FileTab[]>([])
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Default files to show
  const defaultFiles = [
    { path: '/src/App.tsx', name: 'App.tsx', language: 'typescript' },
    { path: '/src/index.css', name: 'index.css', language: 'css' },
    { path: '/src/main.tsx', name: 'main.tsx', language: 'typescript' },
    { path: '/package.json', name: 'package.json', language: 'json' },
    { path: '/index.html', name: 'index.html', language: 'html' }
  ]

  useEffect(() => {
    if (project && openTabs.length === 0) {
      // Auto-open App.tsx when project loads
      handleOpenFile('/src/App.tsx', 'App.tsx', 'typescript')
    }
  }, [project])

  const handleOpenFile = useCallback(async (filePath: string, fileName: string, language: string) => {
    if (!project) return

    try {
      setIsLoading(true)
      
      // Check if tab is already open
      const existingTab = openTabs.find(tab => tab.path === filePath)
      if (existingTab) {
        setActiveTab(filePath)
        return
      }

      // Try to read from WebContainer first, fallback to template
      let content = ''
      try {
        content = await webContainerService.readFile(filePath)
      } catch (error) {
        console.warn(`Could not read ${filePath} from WebContainer, using template`)
        content = getTemplateFileContent(filePath, project)
      }

      const newTab: FileTab = {
        path: filePath,
        name: fileName,
        content,
        modified: false,
        language
      }

      setOpenTabs(prev => [...prev, newTab])
      setActiveTab(filePath)
    } catch (error) {
      console.error('Failed to open file:', error)
    } finally {
      setIsLoading(false)
    }
  }, [project, openTabs, webContainerService])

  const handleCloseTab = useCallback((filePath: string) => {
    setOpenTabs(prev => prev.filter(tab => tab.path !== filePath))
    
    if (activeTab === filePath) {
      const remainingTabs = openTabs.filter(tab => tab.path !== filePath)
      setActiveTab(remainingTabs.length > 0 ? remainingTabs[0].path : null)
    }
  }, [activeTab, openTabs])

  const handleContentChange = useCallback((content: string) => {
    if (!activeTab) return

    setOpenTabs(prev => prev.map(tab => 
      tab.path === activeTab 
        ? { ...tab, content, modified: true }
        : tab
    ))
  }, [activeTab])

  const handleSaveFile = useCallback(async (filePath?: string) => {
    const targetPath = filePath || activeTab
    if (!targetPath) return

    const tab = openTabs.find(t => t.path === targetPath)
    if (!tab) return

    try {
      await onCodeChange(targetPath, tab.content)
      
      // Mark as saved
      setOpenTabs(prev => prev.map(t => 
        t.path === targetPath 
          ? { ...t, modified: false }
          : t
      ))
    } catch (error) {
      console.error('Failed to save file:', error)
    }
  }, [activeTab, openTabs, onCodeChange])

  const handleSaveAll = useCallback(async () => {
    const modifiedTabs = openTabs.filter(tab => tab.modified)
    
    for (const tab of modifiedTabs) {
      await handleSaveFile(tab.path)
    }
  }, [openTabs, handleSaveFile])

  const handleRefresh = useCallback(async () => {
    if (!activeTab || !project) return

    try {
      setIsLoading(true)
      const content = await webContainerService.readFile(activeTab)
      
      setOpenTabs(prev => prev.map(tab => 
        tab.path === activeTab 
          ? { ...tab, content, modified: false }
          : tab
      ))
    } catch (error) {
      console.error('Failed to refresh file:', error)
    } finally {
      setIsLoading(false)
    }
  }, [activeTab, project, webContainerService])

  const handleCopyContent = useCallback(async () => {
    const activeTabData = openTabs.find(tab => tab.path === activeTab)
    if (activeTabData) {
      try {
        await navigator.clipboard.writeText(activeTabData.content)
        console.log('Content copied to clipboard')
      } catch (error) {
        console.error('Failed to copy to clipboard:', error)
      }
    }
  }, [activeTab, openTabs])

  const getTemplateFileContent = (filePath: string, project: Project): string => {
    // Extract content from project.files structure
    const pathParts = filePath.split('/').filter(Boolean)
    let current: any = project.files
    
    for (const part of pathParts) {
      if (current[part]) {
        current = current[part]
      } else {
        return `// File not found: ${filePath}`
      }
    }
    
    if (current.file) {
      return current.file.contents
    }
    
    return `// Could not load content for: ${filePath}`
  }

  const getLanguageIcon = (language: string) => {
    switch (language) {
      case 'typescript':
      case 'javascript':
        return <Code size={14} className="text-blue-400" />
      case 'css':
        return <FileText size={14} className="text-green-400" />
      case 'html':
        return <FileText size={14} className="text-orange-400" />
      case 'json':
        return <FileText size={14} className="text-yellow-400" />
      default:
        return <File size={14} className="text-gray-400" />
    }
  }

  const getSyntaxHighlighting = (content: string, language: string): string => {
    // Basic syntax highlighting using CSS classes
    // In a real implementation, you'd use a library like Prism.js or Monaco Editor
    return content
  }

  if (!project) {
    return (
      <div className="h-full bg-gray-900 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <Code size={48} className="mx-auto mb-4" />
          <p>No project loaded</p>
          <p className="text-sm mt-2">Create or load a project to start editing code</p>
        </div>
      </div>
    )
  }

  const activeTabData = openTabs.find(tab => tab.path === activeTab)

  return (
    <div className="h-full bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Code Editor</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveAll}
              className="btn-ghost p-1"
              title="Save All (Ctrl+S)"
              disabled={!openTabs.some(tab => tab.modified)}
            >
              <Save size={14} />
            </button>
            <button
              onClick={handleRefresh}
              className="btn-ghost p-1"
              title="Refresh File"
              disabled={!activeTab || isLoading}
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={handleCopyContent}
              className="btn-ghost p-1"
              title="Copy Content"
              disabled={!activeTab}
            >
              <Copy size={14} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input-sm w-full pl-8"
          />
        </div>
      </div>

      {/* File List */}
      <div className="border-b border-gray-700 p-3">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Project Files
        </h4>
        <div className="space-y-1">
          {defaultFiles
            .filter(file => 
              searchTerm === '' || 
              file.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((file) => (
              <div
                key={file.path}
                className={`file-item text-sm ${
                  openTabs.some(tab => tab.path === file.path) ? 'bg-gray-700' : ''
                }`}
                onClick={() => handleOpenFile(file.path, file.name, file.language)}
              >
                {getLanguageIcon(file.language)}
                <span>{file.name}</span>
                {openTabs.find(tab => tab.path === file.path)?.modified && (
                  <span className="w-2 h-2 bg-primary-500 rounded-full ml-auto"></span>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Tabs */}
      {openTabs.length > 0 && (
        <div className="flex border-b border-gray-700 bg-gray-850">
          {openTabs.map((tab) => (
            <div
              key={tab.path}
              className={`flex items-center gap-2 px-3 py-2 border-r border-gray-700 cursor-pointer text-sm ${
                activeTab === tab.path
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-750'
              }`}
              onClick={() => setActiveTab(tab.path)}
            >
              {getLanguageIcon(tab.language)}
              <span>{tab.name}</span>
              {tab.modified && (
                <span className="w-1.5 h-1.5 bg-primary-500 rounded-full"></span>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleCloseTab(tab.path)
                }}
                className="ml-1 p-0.5 hover:bg-gray-600 rounded"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Editor Content */}
      <div className="flex-1 flex flex-col">
        {activeTabData ? (
          <>
            {/* Editor Toolbar */}
            <div className="bg-gray-800 border-b border-gray-700 px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                {getLanguageIcon(activeTabData.language)}
                <span>{activeTabData.name}</span>
                {activeTabData.modified && (
                  <span className="text-primary-400">(modified)</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className={`btn-ghost p-1 ${showPreview ? 'text-primary-400' : 'text-gray-400'}`}
                  title={showPreview ? 'Hide Preview' : 'Show Preview'}
                >
                  {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                  onClick={() => handleSaveFile(activeTab!)}
                  className="btn-ghost p-1"
                  title="Save File"
                  disabled={!activeTabData.modified}
                >
                  <Save size={14} />
                </button>
              </div>
            </div>

            {/* Code Editor */}
            <div className="flex-1 relative">
              <textarea
                value={activeTabData.content}
                onChange={(e) => handleContentChange(e.target.value)}
                className="w-full h-full bg-gray-900 text-gray-100 p-4 font-mono text-sm leading-6 resize-none focus:outline-none"
                style={{
                  fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, source-code-pro, monospace',
                  tabSize: 2
                }}
                placeholder="Start typing your code..."
                spellCheck={false}
              />
              
              {/* Line numbers overlay */}
              <div className="absolute left-0 top-0 p-4 text-gray-500 text-sm font-mono leading-6 pointer-events-none select-none">
                {activeTabData.content.split('\n').map((_, index) => (
                  <div key={index} className="text-right w-8">
                    {index + 1}
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <FileText size={48} className="mx-auto mb-4" />
              <p>No file selected</p>
              <p className="text-sm mt-2">Click on a file to start editing</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-800 border-t border-gray-700 px-3 py-2 text-xs text-gray-400">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>
              {openTabs.length} file{openTabs.length !== 1 ? 's' : ''} open
            </span>
            {activeTabData && (
              <span>
                {activeTabData.content.split('\n').length} lines
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span>
              {activeTabData?.language || 'No file'}
            </span>
            {openTabs.some(tab => tab.modified) && (
              <span className="text-primary-400">
                • Unsaved changes
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CodeEditor
