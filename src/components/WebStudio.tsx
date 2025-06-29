import React, { useState, useCallback, useEffect } from 'react'
import Sidebar from './Sidebar'
import Toolbar from './Toolbar'
import Canvas from './Canvas'
import PropertiesPanel from './PropertiesPanel'
import StatusBar from './StatusBar'
import CodeEditor from './CodeEditor'
import { WebContainerService } from '../services/WebContainerService'
import { ProjectService } from '../services/ProjectService'
import type { Project, SelectedElement, Tool } from '../types'

const WebStudio: React.FC = () => {
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null)
  const [currentTool, setCurrentTool] = useState<Tool>('select')
  const [zoomLevel, setZoomLevel] = useState(100)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState('WebStudio ready - Create or load a project to start designing')
  const [showCodeEditor, setShowCodeEditor] = useState(false)

  // Use singleton instance to prevent multiple WebContainer boots
  const webContainerService = WebContainerService.getInstance()
  const projectService = new ProjectService()

  useEffect(() => {
    const initializeWebContainer = async () => {
      try {
        await webContainerService.initialize()
        console.log('WebContainer initialized successfully')
      } catch (error) {
        console.error('Failed to initialize WebContainer:', error)
        setStatusMessage('Failed to initialize WebContainer - some features may not work')
      }
    }

    initializeWebContainer()
  }, [])

  const handleCreateProject = useCallback(async (name: string, template: string) => {
    setIsLoading(true)
    setLoadingMessage('Creating new project...')
    
    try {
      const project = await projectService.createProject(name, template)
      setCurrentProject(project)
      
      // Start the project in WebContainer
      const url = await webContainerService.startProject(project)
      setPreviewUrl(url)
      
      setStatusMessage(`Project "${name}" created successfully`)
    } catch (error) {
      console.error('Failed to create project:', error)
      setStatusMessage('Failed to create project - using fallback mode')
      
      // Continue with limited functionality even if WebContainer fails
      const project = await projectService.createProject(name, template)
      setCurrentProject(project)
    } finally {
      setIsLoading(false)
      setLoadingMessage('')
    }
  }, [])

  const handleLoadProject = useCallback(async (project: Project) => {
    setIsLoading(true)
    setLoadingMessage('Loading project...')
    
    try {
      setCurrentProject(project)
      
      // Start the project in WebContainer
      const url = await webContainerService.startProject(project)
      setPreviewUrl(url)
      
      setStatusMessage(`Project "${project.name}" loaded successfully`)
    } catch (error) {
      console.error('Failed to load project:', error)
      setStatusMessage('Failed to load project - using fallback mode')
      
      // Continue with limited functionality
      setCurrentProject(project)
    } finally {
      setIsLoading(false)
      setLoadingMessage('')
    }
  }, [])

  const handleLoadFromGithub = useCallback(async (url: string, branch?: string) => {
    setIsLoading(true)
    setLoadingMessage('Loading project from GitHub...')
    
    try {
      const project = await projectService.loadFromGithub(url, branch)
      setCurrentProject(project)
      
      // Start the project in WebContainer
      const projectUrl = await webContainerService.startProject(project)
      setPreviewUrl(projectUrl)
      
      setStatusMessage(`Project loaded from ${url}`)
    } catch (error) {
      console.error('Failed to load from GitHub:', error)
      setStatusMessage('Failed to load project from GitHub')
    } finally {
      setIsLoading(false)
      setLoadingMessage('')
    }
  }, [])

  const handleSaveProject = useCallback(() => {
    if (!currentProject) {
      setStatusMessage('No project to save')
      return
    }
    
    try {
      projectService.saveProject(currentProject)
      setStatusMessage('Project saved successfully')
    } catch (error) {
      console.error('Failed to save project:', error)
      setStatusMessage('Failed to save project')
    }
  }, [currentProject])

  const handleElementSelect = useCallback((element: SelectedElement) => {
    setSelectedElement(element)
    setStatusMessage(`Selected: ${element.tagName.toLowerCase()} - ${element.id || element.className || 'element'}`)
  }, [])

  const handleProjectUpdate = useCallback((updatedProject: Project) => {
    console.log('WebStudio: Project update requested:', updatedProject)
    setCurrentProject(updatedProject)
    
    // Save the updated project
    try {
      projectService.saveProject(updatedProject)
      setStatusMessage(`Project "${updatedProject.name}" updated successfully`)
    } catch (error) {
      console.error('WebStudio: Failed to save updated project:', error)
      setStatusMessage('Failed to save project updates')
    }
  }, [projectService])

  const handleElementUpdate = useCallback(async (property: string, value: string) => {
    console.log('WebStudio: Element update requested:', { property, value, selectedElement })
    
    if (!selectedElement) {
      console.warn('WebStudio: No element selected for update')
      setStatusMessage('No element selected')
      return
    }
    
    if (!currentProject) {
      console.warn('WebStudio: No project loaded for update')
      setStatusMessage('No project loaded')
      return
    }

    try {
      // First, update the element visually in the iframe
      if (selectedElement.element && property.startsWith('style.')) {
        const styleProperty = property.replace('style.', '')
        const iframeElement = selectedElement.element
        
        // Convert camelCase to kebab-case for CSS properties
        const cssProperty = styleProperty.replace(/([A-Z])/g, '-$1').toLowerCase()
        
        console.log(`WebStudio: Applying visual update: ${cssProperty} = ${value}`)
        iframeElement.style.setProperty(cssProperty, value)
        
        // Update the selectedElement object to reflect the change
        const updatedElement = {
          ...selectedElement,
          styles: {
            ...selectedElement.styles,
            [styleProperty]: value
          }
        }
        setSelectedElement(updatedElement)
      } else if (property === 'textContent') {
        console.log(`WebStudio: Updating text content: ${value}`)
        if (selectedElement.element) {
          selectedElement.element.textContent = value
        }
        
        const updatedElement = {
          ...selectedElement,
          textContent: value
        }
        setSelectedElement(updatedElement)
      } else if (property === 'id' || property === 'className') {
        console.log(`WebStudio: Updating attribute ${property}: ${value}`)
        if (selectedElement.element) {
          selectedElement.element.setAttribute(property === 'className' ? 'class' : property, value)
        }
        
        const updatedElement = {
          ...selectedElement,
          [property]: value
        }
        setSelectedElement(updatedElement)
      }
      
      // Then update the project structure (this will eventually save to files)
      const updatedProject = await projectService.updateElement(currentProject, selectedElement, property, value)
      setCurrentProject(updatedProject)
      
      // Update the WebContainer with the new code (for file-based persistence)
      if (webContainerService.getServerUrl()) {
        await webContainerService.updateProject(updatedProject)
      }
      
      setStatusMessage(`Updated ${property}: ${value}`)
      console.log('WebStudio: Element update completed successfully')
    } catch (error) {
      console.error('WebStudio: Failed to update element:', error)
      setStatusMessage('Failed to update element')
    }
  }, [selectedElement, currentProject, webContainerService, projectService])

  const handleZoomChange = useCallback((newZoom: number) => {
    setZoomLevel(Math.max(10, Math.min(500, newZoom)))
  }, [])

  const handleToggleCodeEditor = useCallback(() => {
    setShowCodeEditor(!showCodeEditor)
  }, [showCodeEditor])

  const handleCodeChange = useCallback(async (filePath: string, content: string) => {
    if (!currentProject) return

    try {
      await webContainerService.writeFile(filePath, content)
      
      // If we have a project path, also sync to filesystem
      if (currentProject.projectPath) {
        await webContainerService.syncFileToFilesystem(currentProject.projectPath, filePath, content)
      }
      
      setStatusMessage(`Updated ${filePath}`)
    } catch (error) {
      console.error('Failed to update code:', error)
      setStatusMessage('Failed to update code')
    }
  }, [currentProject])

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault()
            handleSaveProject()
            break
          case 'n':
            e.preventDefault()
            // Would trigger new project modal
            break
          case 'o':
            e.preventDefault()
            // Would trigger load project modal
            break
          case '`':
            e.preventDefault()
            handleToggleCodeEditor()
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleSaveProject, handleToggleCodeEditor])

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar with Full Figma Features */}
      <Sidebar
        currentProject={currentProject}
        onCreateProject={handleCreateProject}
        onLoadProject={handleLoadProject}
        onLoadFromGithub={handleLoadFromGithub}
        onSaveProject={handleSaveProject}
        onElementSelect={handleElementSelect}
        selectedElement={selectedElement}
        onCodeChange={handleCodeChange}
        onProjectUpdate={handleProjectUpdate}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <Toolbar
          currentTool={currentTool}
          onToolChange={setCurrentTool}
          zoomLevel={zoomLevel}
          onZoomChange={handleZoomChange}
          showCodeEditor={showCodeEditor}
          onToggleCodeEditor={handleToggleCodeEditor}
        />

        {/* Canvas and Code Editor */}
        <div className="flex-1 flex">
          {showCodeEditor ? (
            <div className="flex-1 flex">
              <div className="flex-1">
                <Canvas
                  previewUrl={previewUrl}
                  zoomLevel={zoomLevel}
                  isLoading={isLoading}
                  loadingMessage={loadingMessage}
                  onElementSelect={handleElementSelect}
                  currentTool={currentTool}
                />
              </div>
              <div className="w-1/2 border-l border-gray-700">
                <CodeEditor
                  project={currentProject}
                  webContainerService={webContainerService}
                  onCodeChange={handleCodeChange}
                />
              </div>
            </div>
          ) : (
            <Canvas
              previewUrl={previewUrl}
              zoomLevel={zoomLevel}
              isLoading={isLoading}
              loadingMessage={loadingMessage}
              onElementSelect={handleElementSelect}
              currentTool={currentTool}
            />
          )}
        </div>

        {/* Status Bar */}
        <StatusBar
          message={statusMessage}
          selectedElement={selectedElement}
          projectName={currentProject?.name}
          showCodeEditor={showCodeEditor}
        />
      </div>

      {/* Properties Panel */}
      <PropertiesPanel
        selectedElement={selectedElement}
        onElementUpdate={handleElementUpdate}
      />
    </div>
  )
}

export default WebStudio
