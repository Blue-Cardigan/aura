import React, { useState, useCallback, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  Package, 
  Grid, 
  Type, 
  Image, 
  Square, 
  Circle, 
  MousePointer, 
  Layout,
  Menu,
  Check,
  X,
  MoreHorizontal,
  Copy,
  Trash2,
  Edit3
} from 'lucide-react'
import type { ComponentsPanelProps, ComponentDefinition, Project, SelectedElement } from '../types'

const ComponentsPanel: React.FC<ComponentsPanelProps> = ({
  selectedElement,
  onElementSelect,
  currentProject,
  onCodeChange,
  onProjectUpdate
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isAddingComponent, setIsAddingComponent] = useState(false)
  const [newComponentName, setNewComponentName] = useState('')
  const [customComponents, setCustomComponents] = useState<ComponentDefinition[]>([])
  const [draggedComponent, setDraggedComponent] = useState<ComponentDefinition | null>(null)
  const [existingComponents, setExistingComponents] = useState<{id: string, name: string, type: string}[]>([])
  const [showExistingComponents, setShowExistingComponents] = useState(false)

  // Initialize custom components from project
  useEffect(() => {
    if (currentProject?.customComponents) {
      setCustomComponents(currentProject.customComponents)
      console.log('ComponentsPanel: Loaded custom components from project')
    }
  }, [currentProject?.id])

  // Default component definitions
  const defaultComponents: ComponentDefinition[] = [
    {
      id: 'div-container',
      name: 'Container',
      category: 'layout',
      icon: 'Square',
      description: 'Basic container div',
      template: '<div data-webstudio-element="container" className="p-4 border border-gray-300 rounded-lg bg-white">Container Content</div>',
      props: {
        className: 'p-4 border border-gray-300 rounded-lg bg-white'
      }
    },
    {
      id: 'flex-container',
      name: 'Flex Container',
      category: 'layout',
      icon: 'Layout',
      description: 'Flexbox container',
      template: '<div data-webstudio-element="flex-container" className="flex gap-4 p-4">Flex Content</div>',
      props: {
        className: 'flex gap-4 p-4'
      }
    },
    {
      id: 'grid-container',
      name: 'Grid Container',
      category: 'layout', 
      icon: 'Grid',
      description: 'CSS Grid container',
      template: '<div data-webstudio-element="grid-container" className="grid grid-cols-2 gap-4 p-4">Grid Content</div>',
      props: {
        className: 'grid grid-cols-2 gap-4 p-4'
      }
    },
    {
      id: 'heading-h1',
      name: 'Heading 1',
      category: 'text',
      icon: 'Type',
      description: 'Main heading',
      template: '<h1 data-webstudio-element="heading-h1" className="text-3xl font-bold text-gray-900 mb-4">Your Heading</h1>',
      props: {
        className: 'text-3xl font-bold text-gray-900 mb-4'
      }
    },
    {
      id: 'heading-h2',
      name: 'Heading 2',
      category: 'text',
      icon: 'Type',
      description: 'Secondary heading',
      template: '<h2 data-webstudio-element="heading-h2" className="text-2xl font-semibold text-gray-900 mb-3">Your Heading</h2>',
      props: {
        className: 'text-2xl font-semibold text-gray-900 mb-3'
      }
    },
    {
      id: 'paragraph',
      name: 'Paragraph',
      category: 'text',
      icon: 'Type',
      description: 'Text paragraph',
      template: '<p data-webstudio-element="paragraph" className="text-gray-700 mb-4">Your paragraph text goes here. Click to edit this content.</p>',
      props: {
        className: 'text-gray-700 mb-4'
      }
    },
    {
      id: 'button-primary',
      name: 'Primary Button',
      category: 'interactive',
      icon: 'MousePointer',
      description: 'Primary action button',
      template: '<button data-webstudio-element="button-primary" className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">Click me</button>',
      props: {
        className: 'px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'
      }
    },
    {
      id: 'button-secondary',
      name: 'Secondary Button',
      category: 'interactive',
      icon: 'MousePointer',
      description: 'Secondary action button',
      template: '<button data-webstudio-element="button-secondary" className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Click me</button>',
      props: {
        className: 'px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'
      }
    },
    {
      id: 'image-placeholder',
      name: 'Image',
      category: 'media',
      icon: 'Image',
      description: 'Image element',
      template: '<img data-webstudio-element="image" src="https://via.placeholder.com/400x200" alt="Placeholder" className="max-w-full h-auto rounded-lg" />',
      props: {
        src: 'https://via.placeholder.com/400x200',
        alt: 'Placeholder',
        className: 'max-w-full h-auto rounded-lg'
      }
    },
    {
      id: 'text-input',
      name: 'Text Input',
      category: 'forms',
      icon: 'Edit3',
      description: 'Text input field',
      template: '<input data-webstudio-element="text-input" type="text" placeholder="Enter text..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />',
      props: {
        type: 'text',
        placeholder: 'Enter text...',
        className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
      }
    }
  ]

  const categories = [
    { id: 'all', name: 'All Components', icon: 'Package' },
    { id: 'layout', name: 'Layout', icon: 'Layout' },
    { id: 'text', name: 'Text', icon: 'Type' },
    { id: 'interactive', name: 'Interactive', icon: 'MousePointer' },
    { id: 'media', name: 'Media', icon: 'Image' },
    { id: 'forms', name: 'Forms', icon: 'Edit3' },
    { id: 'custom', name: 'Custom', icon: 'Package' }
  ]

  const allComponents = [...defaultComponents, ...customComponents]

  const filteredComponents = allComponents.filter(component => {
    const matchesSearch = component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         component.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || component.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const handleComponentClick = useCallback(async (component: ComponentDefinition) => {
    console.log(`ComponentsPanel: Adding component: ${component.name}`)

    if (!currentProject || !onCodeChange) {
      console.warn('ComponentsPanel: No project or code change handler available')
      return
    }

    try {
      // Read current App.tsx content to preserve existing components
      const webContainerService = (window as any).webContainerService || 
                                  (window as any).webStudio?.webContainerService
      
      let currentAppContent = ''
      if (webContainerService) {
        try {
          currentAppContent = await webContainerService.readFile('/src/App.tsx')
        } catch (error) {
          console.log('ComponentsPanel: Could not read current App.tsx, using default template')
          currentAppContent = getDefaultAppTemplate(currentProject)
        }
      } else {
        currentAppContent = getDefaultAppTemplate(currentProject)
      }
      
      // Add the new component to the existing content
      const updatedAppContent = addComponentToExistingApp(currentAppContent, component, selectedElement)
      
      // Update the file in webcontainer
      await onCodeChange('/src/App.tsx', updatedAppContent)
      
      // Update project components list
      await updateProjectComponents()
      
      // Trigger Canvas to re-scan for new elements
      setTimeout(() => {
        const webStudioCanvas = (window as any).webStudioCanvas
        if (webStudioCanvas?.setupVisualEditing) {
          console.log('ComponentsPanel: Triggering Canvas re-scan for new elements')
          webStudioCanvas.setupVisualEditing()
        }
      }, 1500) // Wait for webcontainer to update and iframe to reload
      
      console.log(`ComponentsPanel: Successfully added ${component.name} to code`)

    } catch (error) {
      console.error('ComponentsPanel: Error adding component:', error)
    }
  }, [selectedElement, currentProject, onCodeChange])

  const handleRemoveComponent = useCallback(async (elementId: string) => {
    console.log(`ComponentsPanel: Removing component with ID: ${elementId}`)

    if (!currentProject || !onCodeChange) {
      console.warn('ComponentsPanel: No project or code change handler available')
      return
    }

    try {
      const webContainerService = (window as any).webContainerService || 
                                  (window as any).webStudio?.webContainerService
      
      if (webContainerService) {
        const currentAppContent = await webContainerService.readFile('/src/App.tsx')
        const updatedAppContent = removeComponentFromApp(currentAppContent, elementId)
        
        await onCodeChange('/src/App.tsx', updatedAppContent)
        await updateProjectComponents()
        
        // Trigger Canvas to re-scan after component removal
        setTimeout(() => {
          const webStudioCanvas = (window as any).webStudioCanvas
          if (webStudioCanvas?.setupVisualEditing) {
            console.log('ComponentsPanel: Triggering Canvas re-scan after component removal')
            webStudioCanvas.setupVisualEditing()
          }
        }, 1500)
        
        console.log(`ComponentsPanel: Successfully removed component ${elementId}`)
      }
    } catch (error) {
      console.error('ComponentsPanel: Error removing component:', error)
    }
  }, [currentProject, onCodeChange])

  const getDefaultAppTemplate = (project: Project | null): string => {
    return `import React from 'react'

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" data-webstudio-element="root">
      <div className="max-w-md mx-auto text-center" data-webstudio-element="container">
        <h1 className="text-4xl font-bold text-gray-900 mb-4" data-webstudio-element="title">
          Welcome to ${project?.name || 'Your Project'}
        </h1>
        <p className="text-lg text-gray-600 mb-8" data-webstudio-element="description">
          Visual design meets code. Click on any element to start editing.
        </p>
        <div className="space-y-4" data-webstudio-element="actions">
          <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors" data-webstudio-element="primary-btn">
            Get Started
          </button>
          <button className="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors" data-webstudio-element="secondary-btn">
            Learn More
          </button>
        </div>
      </div>
    </div>
  )
}

export default App`
  }

  const addComponentToExistingApp = (appContent: string, component: ComponentDefinition, selectedElement: SelectedElement | null): string => {
    const lines = appContent.split('\n')
    const uniqueId = `${component.id}-${Date.now()}`
    const componentJSX = generateComponentJSX(component, uniqueId, '')
    
    // Find the best insertion point
    let insertionLine = -1
    let targetIndent = '          ' // Default indentation
    
    // If we have a selected element, try to insert near it
    if (selectedElement?.dataAttribute) {
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(`data-webstudio-element="${selectedElement.dataAttribute}"`)) {
          insertionLine = i
          // Calculate indentation from this line
          const match = lines[i].match(/^(\s*)/)
          targetIndent = match ? match[1] : '          '
          break
        }
      }
    }
    
    // If no selected element or element not found, find the actions div or last element in container
    if (insertionLine === -1) {
      // Look for actions div or any suitable container
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('data-webstudio-element="actions"') ||
            lines[i].includes('data-webstudio-element="container"')) {
          // Find the closing tag and insert before it
          let depth = 0
          let foundOpening = false
          for (let j = i; j < lines.length; j++) {
            const line = lines[j]
            if (line.includes('<') && !line.includes('</') && !line.includes('/>')) {
              foundOpening = true
              depth++
            }
            if (line.includes('</')) {
              depth--
              if (foundOpening && depth === 0) {
                insertionLine = j - 1
                // Get indentation from the line above the closing tag
                const match = lines[j - 1]?.match(/^(\s*)/)
                targetIndent = match ? match[1] : '          '
                break
              }
            }
          }
          if (insertionLine !== -1) break
        }
      }
    }
    
    // If still no insertion point found, insert before the last closing div
    if (insertionLine === -1) {
      for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].includes('</div>') && lines[i].trim() === '</div>') {
          insertionLine = i
          targetIndent = '          '
          break
        }
      }
    }
    
    if (insertionLine === -1) {
      console.warn('ComponentsPanel: Could not find suitable insertion point')
      return appContent
    }
    
    // Insert the component with proper indentation
    const indentedComponent = `${targetIndent}${componentJSX}`
    const newLines = [
      ...lines.slice(0, insertionLine),
      indentedComponent,
      ...lines.slice(insertionLine)
    ]
    
    return newLines.join('\n')
  }

  const removeComponentFromApp = (appContent: string, elementId: string): string => {
    const lines = appContent.split('\n')
    const newLines: string[] = []
    let skipLines = false
    let depth = 0
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      // Check if this line contains the element to remove
      if (line.includes(`data-webstudio-element="${elementId}"`)) {
        skipLines = true
        depth = 0
        
        // If it's a self-closing tag, just skip this line
        if (line.includes('/>')) {
          skipLines = false
          continue
        }
        
        // Start counting depth for paired tags
        if (line.includes('<') && !line.includes('</')) {
          depth = 1
        }
        continue
      }
      
      // If we're skipping lines (inside a component to remove)
      if (skipLines) {
        // Count opening and closing tags to know when we're done
        if (line.includes('<') && !line.includes('</') && !line.includes('/>')) {
          depth++
        }
        if (line.includes('</')) {
          depth--
          if (depth === 0) {
            skipLines = false
          }
        }
        continue
      }
      
      // Keep this line
      newLines.push(line)
    }
    
    return newLines.join('\n')
  }

  const generateComponentJSX = (component: ComponentDefinition, uniqueId: string, indent: string): string => {
    // Convert HTML template to JSX by simple string replacement
    // This is more reliable than parsing and reconstructing
    let jsxTemplate = component.template
    
    // Replace the data-webstudio-element with the unique ID
    jsxTemplate = jsxTemplate.replace(
      /data-webstudio-element="[^"]*"/,
      `data-webstudio-element="${uniqueId}"`
    )
    
    // Ensure the template is already in JSX format (it should be based on the component definitions)
    // The templates already use className, so no conversion needed
    
    // Add proper indentation
    return `${indent}${jsxTemplate}`
  }

  // Scan for existing components in the current App.tsx
  const scanExistingComponents = useCallback(async () => {
    if (!currentProject) return

    try {
      const webContainerService = (window as any).webContainerService
      if (webContainerService) {
        const currentAppContent = await webContainerService.readFile('/src/App.tsx')
        const components = extractComponentsFromApp(currentAppContent)
        setExistingComponents(components)
      }
    } catch (error) {
      console.error('ComponentsPanel: Error scanning existing components:', error)
    }
  }, [currentProject])

  const extractComponentsFromApp = (appContent: string): {id: string, name: string, type: string}[] => {
    const components: {id: string, name: string, type: string}[] = []
    const lines = appContent.split('\n')
    
    for (const line of lines) {
      // Look for data-webstudio-element attributes
      const match = line.match(/data-webstudio-element="([^"]+)"/)
      if (match) {
        const elementId = match[1]
        // Skip default template elements
        if (['root', 'container', 'title', 'description', 'actions', 'primary-btn', 'secondary-btn'].includes(elementId)) {
          continue
        }
        
        // Determine component type from the element ID or tag
        let componentType = 'Unknown'
        let componentName = elementId
        
        if (elementId.includes('container')) {
          componentType = 'Container'
        } else if (elementId.includes('heading') || elementId.includes('h1') || elementId.includes('h2')) {
          componentType = 'Heading'
        } else if (elementId.includes('paragraph')) {
          componentType = 'Paragraph'
        } else if (elementId.includes('button')) {
          componentType = 'Button'
        } else if (elementId.includes('image')) {
          componentType = 'Image'
        } else if (elementId.includes('input')) {
          componentType = 'Input'
        } else if (elementId.includes('flex')) {
          componentType = 'Flex Container'
        } else if (elementId.includes('grid')) {
          componentType = 'Grid Container'
        }
        
        components.push({
          id: elementId,
          name: componentName,
          type: componentType
        })
      }
    }
    
    return components
  }

  // Update the updateProjectComponents function to also scan existing components
  const updateProjectComponents = async () => {
    if (!currentProject) return

    try {
      const updatedProject = {
        ...currentProject,
        customComponents: customComponents,
        updatedAt: new Date().toISOString()
      }
      onProjectUpdate(updatedProject)
      
      // Also scan for existing components
      await scanExistingComponents()
    } catch (error) {
      console.error('ComponentsPanel: Failed to update project components:', error)
    }
  }

  // Scan existing components when project changes
  useEffect(() => {
    if (currentProject) {
      scanExistingComponents()
    }
  }, [currentProject?.id, scanExistingComponents])

  // Expose global interface for ChatBot integration
  useEffect(() => {
    ;(window as any).webStudioComponentsPanel = {
      addComponent: async (componentId: string) => {
        // Find the component definition by ID
        const component = allComponents.find(comp => comp.id === componentId)
        if (component) {
          await handleComponentClick(component)
        } else {
          console.warn(`ComponentsPanel: Component with ID "${componentId}" not found`)
        }
      },
      removeComponent: handleRemoveComponent,
      getAvailableComponents: () => allComponents.map(comp => ({
        id: comp.id,
        name: comp.name,
        category: comp.category
      })),
      scanComponents: scanExistingComponents
    }

    console.log('ComponentsPanel: Global interface initialized for ChatBot')
  }, [allComponents, handleComponentClick, handleRemoveComponent, scanExistingComponents])

  const handleCreateCustomComponent = useCallback(async () => {
    if (!newComponentName.trim() || !selectedElement?.element) return

    const element = selectedElement.element
    const componentTemplate = element.outerHTML

    const newComponent: ComponentDefinition = {
      id: `custom-${Date.now()}`,
      name: newComponentName.trim(),
      category: 'custom',
      icon: 'Package',
      description: `Custom component created from ${element.tagName.toLowerCase()}`,
      template: componentTemplate,
      props: {
        className: element.className || ''
      }
    }

    const updatedCustomComponents = [...customComponents, newComponent]
    setCustomComponents(updatedCustomComponents)
    setNewComponentName('')
    setIsAddingComponent(false)

    // Update project
    if (currentProject) {
      const updatedProject = {
        ...currentProject,
        customComponents: updatedCustomComponents,
        updatedAt: new Date().toISOString()
      }
      onProjectUpdate(updatedProject)
    }

    console.log(`ComponentsPanel: Created custom component: ${newComponent.name}`)
  }, [newComponentName, selectedElement, customComponents, currentProject, onProjectUpdate])

  const handleDeleteCustomComponent = useCallback(async (componentId: string) => {
    const updatedCustomComponents = customComponents.filter(comp => comp.id !== componentId)
    setCustomComponents(updatedCustomComponents)

    if (currentProject) {
      const updatedProject = {
        ...currentProject,
        customComponents: updatedCustomComponents,
        updatedAt: new Date().toISOString()
      }
      onProjectUpdate(updatedProject)
    }
  }, [customComponents, currentProject, onProjectUpdate])

  const getIconComponent = (iconName: string, size: number = 16) => {
    const icons = {
      Package, Grid, Type, Image, Square, Circle, MousePointer, Layout, Menu, Edit3
    }
    const IconComponent = icons[iconName as keyof typeof icons] || Package
    return <IconComponent size={size} />
  }

  return (
    <div className="components-panel h-full flex flex-col bg-gray-800 text-white">
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <h3 className="text-sm font-medium">Components</h3>
        {selectedElement && (
          <button
            onClick={() => setIsAddingComponent(true)}
            className="p-1 hover:bg-gray-700 rounded"
            title="Create component from selection"
          >
            <Plus size={16} />
          </button>
        )}
      </div>

      {/* Search */}
      <div className="p-2 border-b border-gray-700">
        <div className="relative">
          <Search size={16} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search components..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="p-2 border-b border-gray-700">
        <div className="flex flex-wrap gap-1">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {getIconComponent(category.icon, 12)}
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Existing Components in Project */}
      {existingComponents.length > 0 && (
        <div className="border-b border-gray-700">
          <div className="flex items-center justify-between p-2">
            <button
              onClick={() => setShowExistingComponents(!showExistingComponents)}
              className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white"
            >
              <Menu size={14} />
              In Project ({existingComponents.length})
            </button>
            <button
              onClick={scanExistingComponents}
              className="p-1 hover:bg-gray-700 rounded"
              title="Refresh components list"
            >
              <Search size={12} />
            </button>
          </div>
          {showExistingComponents && (
            <div className="px-2 pb-2 max-h-32 overflow-y-auto">
              {existingComponents.map(component => (
                <div
                  key={component.id}
                  className="flex items-center justify-between p-1.5 hover:bg-gray-700 rounded text-xs"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-green-400">●</span>
                    <span className="text-white truncate">{component.type}</span>
                    <span className="text-gray-400 truncate">({component.name})</span>
                  </div>
                  <button
                    onClick={() => handleRemoveComponent(component.id)}
                    className="p-0.5 hover:bg-red-600 rounded opacity-70 hover:opacity-100"
                    title="Remove component"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Custom Component Modal */}
      {isAddingComponent && (
        <div className="p-3 bg-gray-700 border-b border-gray-600">
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Component name..."
              value={newComponentName}
              onChange={(e) => setNewComponentName(e.target.value)}
              className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-sm focus:outline-none focus:border-blue-500"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateCustomComponent}
                className="flex-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                disabled={!newComponentName.trim()}
              >
                <Check size={12} className="inline mr-1" />
                Create
              </button>
              <button
                onClick={() => {
                  setIsAddingComponent(false)
                  setNewComponentName('')
                }}
                className="flex-1 px-2 py-1 bg-gray-600 text-gray-300 rounded text-xs hover:bg-gray-500"
              >
                <X size={12} className="inline mr-1" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Components List */}
      <div className="flex-1 overflow-y-auto">
        {filteredComponents.length === 0 ? (
          <div className="p-4 text-center text-gray-400 text-sm">
            {searchTerm ? 'No components match your search' : 'No components available'}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredComponents.map(component => (
              <div
                key={component.id}
                className="component-item group bg-gray-700 hover:bg-gray-600 rounded p-2 cursor-pointer transition-colors"
                onClick={() => handleComponentClick(component)}
              >
                <div className="flex items-start gap-2">
                  <div className="text-blue-400 mt-0.5">
                    {getIconComponent(component.icon, 16)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-white truncate">
                        {component.name}
                      </h4>
                      {component.category === 'custom' && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteCustomComponent(component.id)
                            }}
                            className="p-1 hover:bg-red-600 rounded"
                            title="Delete custom component"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {component.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ComponentsPanel
