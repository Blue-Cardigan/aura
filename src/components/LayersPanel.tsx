import React, { useState, useCallback, useEffect } from 'react'
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Trash2, 
  Copy, 
  Move3d,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  Plus,
  Search
} from 'lucide-react'
import type { SelectedElement, Project } from '../types'

interface LayersPanelProps {
  selectedElement: SelectedElement | null
  onElementSelect: (element: SelectedElement) => void
  currentProject: Project | null
  onCodeChange: (filePath: string, content: string) => void
}

interface LayerNode {
  id: string
  name: string
  type: string
  element?: HTMLElement
  children: LayerNode[]
  visible: boolean
  locked: boolean
  dataAttribute: string
  depth: number
}

const LayersPanel: React.FC<LayersPanelProps> = ({
  selectedElement,
  onElementSelect,
  currentProject,
  onCodeChange
}) => {
  const [layers, setLayers] = useState<LayerNode[]>([])
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [draggedNode, setDraggedNode] = useState<LayerNode | null>(null)

  useEffect(() => {
    if (selectedElement) {
      updateLayersFromDOM()
    }
  }, [selectedElement])

  const updateLayersFromDOM = useCallback(() => {
    // Get all elements with data-webstudio-element attributes
    const iframe = document.getElementById('previewFrame') as HTMLIFrameElement
    if (!iframe?.contentDocument) return

    const elements = iframe.contentDocument.querySelectorAll('[data-webstudio-element]')
    const layerNodes: LayerNode[] = []

    elements.forEach((element, index) => {
      const htmlElement = element as HTMLElement
      const dataAttr = htmlElement.getAttribute('data-webstudio-element') || `element-${index}`
      
      const node: LayerNode = {
        id: `layer-${index}`,
        name: getElementDisplayName(htmlElement),
        type: htmlElement.tagName.toLowerCase(),
        element: htmlElement,
        children: [],
        visible: htmlElement.style.display !== 'none',
        locked: htmlElement.hasAttribute('data-locked'),
        dataAttribute: dataAttr,
        depth: getElementDepth(htmlElement)
      }

      layerNodes.push(node)
    })

    // Sort by depth to create hierarchy
    const sortedLayers = buildLayerHierarchy(layerNodes)
    setLayers(sortedLayers)
  }, [])

  const getElementDisplayName = (element: HTMLElement): string => {
    const dataAttr = element.getAttribute('data-webstudio-element')
    if (dataAttr) return dataAttr

    const id = element.id
    if (id) return `#${id}`

    const className = element.className
    if (className) return `.${className.split(' ')[0]}`

    return element.tagName.toLowerCase()
  }

  const getElementDepth = (element: HTMLElement): number => {
    let depth = 0
    let parent = element.parentElement
    while (parent && parent.hasAttribute('data-webstudio-element')) {
      depth++
      parent = parent.parentElement
    }
    return depth
  }

  const buildLayerHierarchy = (nodes: LayerNode[]): LayerNode[] => {
    // For simplicity, we'll just sort by depth
    // In a real implementation, you'd build a proper tree structure
    return nodes.sort((a, b) => a.depth - b.depth)
  }

  const handleLayerClick = useCallback((node: LayerNode) => {
    if (!node.element) return

    const computedStyle = getComputedStyle(node.element)
    const selectedElement: SelectedElement = {
      id: node.element.id || '',
      className: node.element.className || '',
      tagName: node.element.tagName,
      textContent: node.element.textContent || '',
      styles: {
        display: computedStyle.display,
        width: computedStyle.width,
        height: computedStyle.height,
        margin: computedStyle.margin,
        padding: computedStyle.padding,
        fontSize: computedStyle.fontSize,
        fontWeight: computedStyle.fontWeight,
        color: computedStyle.color,
        backgroundColor: computedStyle.backgroundColor,
        borderWidth: computedStyle.borderWidth,
        borderStyle: computedStyle.borderStyle,
        borderColor: computedStyle.borderColor,
        borderRadius: computedStyle.borderRadius,
      },
      element: node.element,
      dataAttribute: node.dataAttribute
    }

    onElementSelect(selectedElement)
  }, [onElementSelect])

  const handleToggleVisibility = useCallback(async (node: LayerNode, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!node.element || !currentProject) return

    const newVisibility = !node.visible
    node.element.style.display = newVisibility ? '' : 'none'
    
    // Update the layer state
    setLayers(prev => prev.map(layer => 
      layer.id === node.id ? { ...layer, visible: newVisibility } : layer
    ))

    // Update the code
    await updateElementInCode(node.element, 'style.display', newVisibility ? 'block' : 'none')
  }, [currentProject])

  const handleToggleLock = useCallback(async (node: LayerNode, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!node.element || !currentProject) return

    const newLocked = !node.locked
    if (newLocked) {
      node.element.setAttribute('data-locked', 'true')
    } else {
      node.element.removeAttribute('data-locked')
    }

    // Update the layer state
    setLayers(prev => prev.map(layer => 
      layer.id === node.id ? { ...layer, locked: newLocked } : layer
    ))

    // Update the code
    await updateElementInCode(node.element, 'data-locked', newLocked ? 'true' : null)
  }, [currentProject])

  const handleDeleteLayer = useCallback(async (node: LayerNode, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!node.element || !currentProject) return

    if (!confirm(`Are you sure you want to delete "${node.name}"?`)) return

    // Remove from DOM
    node.element.remove()

    // Update layers
    setLayers(prev => prev.filter(layer => layer.id !== node.id))

    // Update the code by regenerating the component
    await regenerateComponent()
  }, [currentProject])

  const handleDuplicateLayer = useCallback(async (node: LayerNode, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!node.element || !currentProject) return

    // Clone the element
    const clonedElement = node.element.cloneNode(true) as HTMLElement
    const newDataAttr = `${node.dataAttribute}-copy-${Date.now()}`
    clonedElement.setAttribute('data-webstudio-element', newDataAttr)

    // Insert after the original element
    node.element.parentNode?.insertBefore(clonedElement, node.element.nextSibling)

    // Update layers
    updateLayersFromDOM()

    // Update the code
    await regenerateComponent()
  }, [currentProject])

  const updateElementInCode = async (element: HTMLElement, property: string, value: string | null) => {
    if (!currentProject) return

    try {
      // Generate updated component code
      await regenerateComponent()
    } catch (error) {
      console.error('Failed to update code:', error)
    }
  }

  const regenerateComponent = async () => {
    if (!currentProject) return

    try {
      // Get the current DOM structure
      const iframe = document.getElementById('previewFrame') as HTMLIFrameElement
      if (!iframe?.contentDocument) return

      const rootElement = iframe.contentDocument.querySelector('[data-webstudio-element="root"]')
      if (!rootElement) return

      // Generate new JSX from DOM
      const newJSX = generateJSXFromDOM(rootElement as HTMLElement)
      
      // Create complete component with proper structure
      const componentCode = `import React from 'react'

function App() {
  return (
    ${newJSX}
  )
}

export default App`

      // Save the updated code
      await onCodeChange('/src/App.tsx', componentCode)
    } catch (error) {
      console.error('Failed to regenerate component:', error)
    }
  }

  const generateJSXFromDOM = (element: HTMLElement, indent: number = 4): string => {
    const tag = element.tagName.toLowerCase()
    const indentStr = ' '.repeat(indent)
    
    // Get attributes
    const attributes: string[] = []
    Array.from(element.attributes).forEach(attr => {
      if (attr.name === 'class') {
        attributes.push(`className="${attr.value}"`)
      } else if (attr.name.startsWith('data-')) {
        attributes.push(`${attr.name}="${attr.value}"`)
      } else if (attr.name === 'style' && attr.value) {
        // Convert CSS to JSX style object
        const styleObj = attr.value.split(';')
          .filter(s => s.trim())
          .map(s => {
            const [prop, val] = s.split(':')
            if (!prop || !val) return ''
            const jsxProp = prop.trim().replace(/-([a-z])/g, (g) => g[1].toUpperCase())
            return `${jsxProp}: '${val.trim()}'`
          })
          .filter(s => s)
          .join(', ')
        if (styleObj) {
          attributes.push(`style={{${styleObj}}}`)
        }
      } else if (['src', 'alt', 'href', 'type', 'placeholder'].includes(attr.name)) {
        attributes.push(`${attr.name}="${attr.value}"`)
      }
    })

    const attrString = attributes.length > 0 ? ' ' + attributes.join(' ') : ''
    
    // Handle children - only process WebStudio elements
    const childElements = Array.from(element.children)
      .filter(child => child.hasAttribute('data-webstudio-element'))
    
    if (childElements.length > 0) {
      const childrenJSX = childElements
        .map(child => generateJSXFromDOM(child as HTMLElement, indent + 2))
        .join('\n')
      
      return `${indentStr}<${tag}${attrString}>
${childrenJSX}
${indentStr}</${tag}>`
    } else {
      // Handle text content and self-closing tags
      const textContent = getDirectTextContent(element)
      
      if (textContent && textContent.trim()) {
        return `${indentStr}<${tag}${attrString}>
${indentStr}  ${textContent.trim()}
${indentStr}</${tag}>`
      } else if (['img', 'input', 'br', 'hr'].includes(tag)) {
        return `${indentStr}<${tag}${attrString} />`
      } else {
        return `${indentStr}<${tag}${attrString}></${tag}>`
      }
    }
  }

  const getDirectTextContent = (element: HTMLElement): string => {
    // Get only the direct text content, not from child elements
    let textContent = ''
    for (const node of element.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        textContent += node.textContent || ''
      }
    }
    return textContent.trim()
  }

  const handleAddElement = useCallback(async (elementType: string) => {
    if (!currentProject) return

    const iframe = document.getElementById('previewFrame') as HTMLIFrameElement
    if (!iframe?.contentDocument) return

    // Find the selected parent or use the root container
    let parentElement = selectedElement?.element
    
    if (!parentElement) {
      // Try to find a container element
      parentElement = iframe.contentDocument.querySelector('[data-webstudio-element="container"]') as HTMLElement
      
      if (!parentElement) {
        // Use the root element
        parentElement = iframe.contentDocument.querySelector('[data-webstudio-element="root"]') as HTMLElement
      }
    }
    
    if (!parentElement) return

    // Create new element
    const newElement = iframe.contentDocument.createElement(elementType)
    const elementId = `new-${elementType}-${Date.now()}`
    newElement.setAttribute('data-webstudio-element', elementId)
    
    // Add default content and styling based on element type
    switch (elementType) {
      case 'div':
        newElement.className = 'p-4 border border-gray-300 rounded-lg bg-white'
        newElement.textContent = 'New Container'
        break
      case 'button':
        newElement.className = 'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors'
        newElement.textContent = 'Click me'
        break
      case 'h1':
        newElement.className = 'text-3xl font-bold text-gray-900 mb-4'
        newElement.textContent = 'New Heading'
        break
      case 'h2':
        newElement.className = 'text-2xl font-semibold text-gray-900 mb-3'
        newElement.textContent = 'New Heading'
        break
      case 'h3':
        newElement.className = 'text-xl font-semibold text-gray-900 mb-2'
        newElement.textContent = 'New Heading'
        break
      case 'p':
        newElement.className = 'text-gray-700 mb-4'
        newElement.textContent = 'New paragraph text. Click to edit this content.'
        break
      case 'img':
        newElement.className = 'max-w-full h-auto rounded-lg'
        newElement.setAttribute('src', 'https://via.placeholder.com/400x200')
        newElement.setAttribute('alt', 'Placeholder image')
        break
      case 'input':
        newElement.className = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
        newElement.setAttribute('type', 'text')
        newElement.setAttribute('placeholder', 'Enter text...')
        break
      default:
        newElement.textContent = `New ${elementType}`
    }

    // Append to parent element
    parentElement.appendChild(newElement)

    // Update layers
    updateLayersFromDOM()

    // Regenerate component code
    await regenerateComponent()
  }, [selectedElement, currentProject])

  const filteredLayers = layers.filter(layer =>
    layer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    layer.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 p-4">
        <div className="text-center">
          <div className="text-2xl mb-2">📋</div>
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
          <h4 className="font-semibold text-white">Layers</h4>
          <div className="flex gap-1">
            <button 
              onClick={() => handleAddElement('div')}
              className="btn-ghost p-1" 
              title="Add Div"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search layers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input-sm w-full pl-8"
          />
        </div>
      </div>

      {/* Add Element Buttons */}
      <div className="p-3 border-b border-gray-700">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleAddElement('div')}
            className="btn btn-secondary text-xs justify-start"
          >
            📦 Div
          </button>
          <button
            onClick={() => handleAddElement('button')}
            className="btn btn-secondary text-xs justify-start"
          >
            🔘 Button
          </button>
          <button
            onClick={() => handleAddElement('h1')}
            className="btn btn-secondary text-xs justify-start"
          >
            📝 Heading
          </button>
          <button
            onClick={() => handleAddElement('p')}
            className="btn btn-secondary text-xs justify-start"
          >
            📄 Text
          </button>
          <button
            onClick={() => handleAddElement('img')}
            className="btn btn-secondary text-xs justify-start"
          >
            🖼️ Image
          </button>
          <button
            onClick={() => handleAddElement('input')}
            className="btn btn-secondary text-xs justify-start"
          >
            📝 Input
          </button>
        </div>
      </div>

      {/* Layers List */}
      <div className="flex-1 overflow-y-auto">
        {filteredLayers.length === 0 ? (
          <div className="p-4 text-center text-gray-400">
            <p className="text-sm">No layers found</p>
            <p className="text-xs mt-1">Try selecting an element in the canvas</p>
          </div>
        ) : (
          <div className="p-2">
            {filteredLayers.map((layer) => (
              <div
                key={layer.id}
                className={`layer-item group ${
                  selectedElement?.dataAttribute === layer.dataAttribute ? 'active' : ''
                }`}
                style={{ paddingLeft: `${layer.depth * 16 + 8}px` }}
                onClick={() => handleLayerClick(layer)}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xs">{getLayerIcon(layer.type)}</span>
                  <span className="flex-1 truncate text-sm">{layer.name}</span>
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleToggleVisibility(layer, e)}
                    className="btn-ghost p-1"
                    title={layer.visible ? 'Hide' : 'Show'}
                  >
                    {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                  </button>
                  
                  <button
                    onClick={(e) => handleToggleLock(layer, e)}
                    className="btn-ghost p-1"
                    title={layer.locked ? 'Unlock' : 'Lock'}
                  >
                    {layer.locked ? <Lock size={12} /> : <Unlock size={12} />}
                  </button>
                  
                  <button
                    onClick={(e) => handleDuplicateLayer(layer, e)}
                    className="btn-ghost p-1"
                    title="Duplicate"
                  >
                    <Copy size={12} />
                  </button>
                  
                  <button
                    onClick={(e) => handleDeleteLayer(layer, e)}
                    className="btn-ghost p-1 text-red-400 hover:text-red-300"
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const getLayerIcon = (type: string): string => {
  switch (type) {
    case 'div': return '📦'
    case 'button': return '🔘'
    case 'h1':
    case 'h2':
    case 'h3': return '📝'
    case 'p': return '📄'
    case 'img': return '🖼️'
    case 'input': return '📝'
    case 'a': return '🔗'
    case 'span': return '📝'
    default: return '📋'
  }
}

export default LayersPanel
