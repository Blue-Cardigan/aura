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
  Search,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import type { SelectedElement, Project, LayerNode, LayersPanelProps } from '../types'

const LayersPanel: React.FC<LayersPanelProps> = ({
  selectedElement,
  onElementSelect,
  currentProject,
  onCodeChange,
  onProjectUpdate
}) => {
  const [layers, setLayers] = useState<LayerNode[]>([])
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']))
  const [searchTerm, setSearchTerm] = useState('')
  const [draggedNode, setDraggedNode] = useState<LayerNode | null>(null)
  const [dragOverNode, setDragOverNode] = useState<LayerNode | null>(null)

  // Initialize layers from project or scan DOM
  useEffect(() => {
    if (currentProject?.layers && currentProject.layers.length > 0) {
      setLayers(currentProject.layers)
      console.log('LayersPanel: Loaded layers from project state')
    } else {
      updateLayersFromDOM()
    }
  }, [currentProject?.id])

  // Re-scan when selectedElement changes
  useEffect(() => {
    if (selectedElement) {
      updateLayersFromDOM()
    }
  }, [selectedElement?.element])

  const updateLayersFromDOM = useCallback(() => {
    console.log('LayersPanel: Scanning DOM for editable elements...')
    
    const iframe = document.querySelector('.webstudio-preview-frame') as HTMLIFrameElement
    if (!iframe?.contentDocument) {
      console.warn('LayersPanel: Could not access iframe content')
      return
    }

    const iframeDoc = iframe.contentDocument
    const elements = iframeDoc.querySelectorAll('[data-webstudio-element]')
    console.log(`LayersPanel: Found ${elements.length} editable elements`)
    
    if (elements.length === 0) {
      console.warn('LayersPanel: No elements with data-webstudio-element found')
      return
    }

    const layerNodes: LayerNode[] = []
    
    elements.forEach((element, index) => {
      const htmlElement = element as HTMLElement
      const dataAttr = htmlElement.getAttribute('data-webstudio-element') || `element-${index}`
      const parentDataAttr = htmlElement.parentElement?.getAttribute('data-webstudio-element')
      
      const node: LayerNode = {
        id: `layer-${dataAttr}-${index}`,
        name: getElementDisplayName(htmlElement, dataAttr),
        type: htmlElement.tagName.toLowerCase(),
        element: htmlElement,
        children: [],
        visible: !htmlElement.style.display || htmlElement.style.display !== 'none',
        locked: htmlElement.hasAttribute('data-locked'),
        dataAttribute: dataAttr,
        depth: getElementDepth(htmlElement),
        parentId: parentDataAttr ? `layer-${parentDataAttr}` : undefined,
        order: index
      }

      layerNodes.push(node)
    })

    // Build hierarchy
    const hierarchicalLayers = buildLayerHierarchy(layerNodes)
    setLayers(hierarchicalLayers)
    
    // Update project with new layer structure
    if (currentProject && hierarchicalLayers.length > 0) {
      const updatedProject = {
        ...currentProject,
        layers: hierarchicalLayers,
        updatedAt: new Date().toISOString()
      }
      onProjectUpdate(updatedProject)
    }
    
    console.log(`LayersPanel: Updated layer hierarchy with ${hierarchicalLayers.length} layers`)
  }, [currentProject, onProjectUpdate])

  const getElementDisplayName = (element: HTMLElement, dataAttr: string): string => {
    if (dataAttr && dataAttr !== element.tagName.toLowerCase()) {
      return dataAttr
    }
    
    const id = element.id
    if (id) return `#${id}`

    const className = element.className
    if (className) {
      const firstClass = className.split(' ')[0]
      return `.${firstClass}`
    }

    if (['h1', 'h2', 'h3', 'p', 'span', 'button', 'a'].includes(element.tagName.toLowerCase())) {
      const text = element.textContent?.trim()
      if (text && text.length > 0) {
        return `${element.tagName.toLowerCase()}: "${text.substring(0, 20)}${text.length > 20 ? '...' : ''}"`
      }
    }

    return element.tagName.toLowerCase()
  }

  const getElementDepth = (element: HTMLElement): number => {
    let depth = 0
    let parent = element.parentElement
    const rootElement = element.ownerDocument.querySelector('[data-webstudio-element="root"]')
    
    while (parent && parent !== rootElement && parent.hasAttribute?.('data-webstudio-element')) {
      depth++
      parent = parent.parentElement
    }
    return depth
  }

  const buildLayerHierarchy = (nodes: LayerNode[]): LayerNode[] => {
    const nodeMap = new Map<string, LayerNode>()
    const rootNodes: LayerNode[] = []
    
    nodes.forEach(node => {
      nodeMap.set(node.dataAttribute, node)
    })

    nodes.forEach(node => {
      if (node.parentId) {
        const parentDataAttr = node.parentId.replace('layer-', '')
        const parent = nodeMap.get(parentDataAttr)
        if (parent) {
          parent.children.push(node)
        } else {
          rootNodes.push(node)
        }
      } else {
        rootNodes.push(node)
      }
    })

    const sortByOrder = (a: LayerNode, b: LayerNode) => a.order - b.order
    rootNodes.sort(sortByOrder)
    
    const sortChildren = (node: LayerNode) => {
      node.children.sort(sortByOrder)
      node.children.forEach(sortChildren)
    }
    
    rootNodes.forEach(sortChildren)
    return rootNodes
  }

  const handleLayerClick = useCallback((node: LayerNode) => {
    if (!node.element || node.locked) return

    console.log(`LayersPanel: Layer clicked: ${node.name}`)
    
    const iframe = document.querySelector('.webstudio-preview-frame') as HTMLIFrameElement
    if (!iframe?.contentWindow) return

    const computedStyle = iframe.contentWindow.getComputedStyle(node.element)
    const selectedElement: SelectedElement = {
      id: node.element.id || '',
      className: node.element.className || '',
      tagName: node.element.tagName,
      textContent: node.element.textContent || '',
      styles: {
        display: computedStyle.display || 'block',
        width: computedStyle.width || 'auto',
        height: computedStyle.height || 'auto',
        margin: computedStyle.margin || '0px',
        padding: computedStyle.padding || '0px',
        fontSize: computedStyle.fontSize || '16px',
        fontWeight: computedStyle.fontWeight || 'normal',
        color: computedStyle.color || 'rgb(0, 0, 0)',
        backgroundColor: computedStyle.backgroundColor || 'rgba(0, 0, 0, 0)',
        borderWidth: computedStyle.borderWidth || '0px',
        borderStyle: computedStyle.borderStyle || 'none',
        borderColor: computedStyle.borderColor || 'rgb(0, 0, 0)',
        borderRadius: computedStyle.borderRadius || '0px',
      },
      element: node.element,
      dataAttribute: node.dataAttribute
    }

    // Highlight element in iframe
    const iframeDoc = iframe.contentDocument
    if (iframeDoc) {
      iframeDoc.querySelectorAll('[data-webstudio-selected]').forEach(el => {
        el.removeAttribute('data-webstudio-selected')
      })
      
      node.element.setAttribute('data-webstudio-selected', 'true')
    }

    onElementSelect(selectedElement)
  }, [onElementSelect])

  const handleToggleVisibility = useCallback(async (node: LayerNode, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!node.element || node.locked) return

    const newVisibility = !node.visible
    node.element.style.display = newVisibility ? '' : 'none'
    
    const updateLayers = (layers: LayerNode[]): LayerNode[] => {
      return layers.map(layer => {
        if (layer.id === node.id) {
          return { ...layer, visible: newVisibility }
        }
        if (layer.children.length > 0) {
          return { ...layer, children: updateLayers(layer.children) }
        }
        return layer
      })
    }
    
    const updatedLayers = updateLayers(layers)
    setLayers(updatedLayers)
    
    if (currentProject) {
      const updatedProject = {
        ...currentProject,
        layers: updatedLayers,
        updatedAt: new Date().toISOString()
      }
      onProjectUpdate(updatedProject)
    }

    await regenerateComponent()
  }, [layers, currentProject, onProjectUpdate])

  const handleDeleteLayer = useCallback(async (node: LayerNode, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!node.element || node.locked) return

    if (!confirm(`Are you sure you want to delete "${node.name}"?`)) return

    node.element.remove()

    const removeLayers = (layers: LayerNode[]): LayerNode[] => {
      return layers.filter(layer => {
        if (layer.id === node.id) {
          return false
        }
        if (layer.children.length > 0) {
          layer.children = removeLayers(layer.children)
        }
        return true
      })
    }
    
    const updatedLayers = removeLayers(layers)
    setLayers(updatedLayers)
    
    if (currentProject) {
      const updatedProject = {
        ...currentProject,
        layers: updatedLayers,
        updatedAt: new Date().toISOString()
      }
      onProjectUpdate(updatedProject)
    }

    await regenerateComponent()
  }, [layers, currentProject, onProjectUpdate])

  const regenerateComponent = async () => {
    if (!currentProject) return

    try {
      const iframe = document.querySelector('.webstudio-preview-frame') as HTMLIFrameElement
      if (!iframe?.contentDocument) return

      const rootElement = iframe.contentDocument.querySelector('[data-webstudio-element="root"]')
      if (!rootElement) return

      const newJSX = generateJSXFromDOM(rootElement as HTMLElement)
      
      const componentCode = `import React from 'react'

function App() {
  return (
    ${newJSX}
  )
}

export default App`

      await onCodeChange('/src/App.tsx', componentCode)
      console.log('LayersPanel: Component regenerated successfully')
    } catch (error) {
      console.error('LayersPanel: Failed to regenerate component:', error)
    }
  }

  const generateJSXFromDOM = (element: HTMLElement, indent: number = 4): string => {
    const tag = element.tagName.toLowerCase()
    const indentStr = ' '.repeat(indent)
    
    const attributes: string[] = []
    Array.from(element.attributes).forEach(attr => {
      if (attr.name === 'class') {
        attributes.push(`className="${attr.value}"`)
      } else if (attr.name.startsWith('data-webstudio-')) {
        attributes.push(`${attr.name}="${attr.value}"`)
      } else if (['src', 'alt', 'href', 'type', 'placeholder', 'id'].includes(attr.name)) {
        attributes.push(`${attr.name}="${attr.value}"`)
      }
    })

    const attrString = attributes.length > 0 ? ' ' + attributes.join(' ') : ''
    
    const childElements = Array.from(element.children)
      .filter(child => child.hasAttribute('data-webstudio-element'))
      .map(child => generateJSXFromDOM(child as HTMLElement, indent + 2))

    const textContent = element.childNodes.length > 0 && 
      Array.from(element.childNodes).some(node => node.nodeType === Node.TEXT_NODE) 
      ? element.textContent?.trim() 
      : ''

    if (childElements.length === 0 && !textContent) {
      return `<${tag}${attrString} />`
    }

    if (childElements.length === 0 && textContent) {
      return `<${tag}${attrString}>${textContent}</${tag}>`
    }

    return `<${tag}${attrString}>
${childElements.map(child => indentStr + '  ' + child).join('\n')}
${indentStr}</${tag}>`
  }

  const toggleExpanded = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId)
    } else {
      newExpanded.add(nodeId)
    }
    setExpandedNodes(newExpanded)
  }

  const renderLayerNode = (node: LayerNode, depth: number = 0): React.ReactNode => {
    const isExpanded = expandedNodes.has(node.id)
    const hasChildren = node.children.length > 0
    const isSelected = selectedElement?.dataAttribute === node.dataAttribute

    return (
      <div key={node.id} className="layer-node">
        <div 
          className={`layer-item flex items-center gap-1 px-2 py-1 text-xs hover:bg-gray-700 cursor-pointer ${
            isSelected ? 'bg-blue-600' : ''
          }`}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => handleLayerClick(node)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleExpanded(node.id)
              }}
              className="p-0.5 hover:bg-gray-600 rounded"
            >
              {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
          )}
          {!hasChildren && <div className="w-5" />}
          
          <span className="flex-1 truncate" title={node.name}>
            {node.name}
          </span>
          
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => handleToggleVisibility(node, e)}
              className="p-0.5 hover:bg-gray-600 rounded"
              title={node.visible ? 'Hide' : 'Show'}
            >
              {node.visible ? <Eye size={12} /> : <EyeOff size={12} />}
            </button>
            
            <button
              onClick={(e) => handleDeleteLayer(node, e)}
              className="p-0.5 hover:bg-red-600 rounded"
              title="Delete"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {node.children.map(child => renderLayerNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  const filteredLayers = searchTerm
    ? layers.filter(layer => 
        layer.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : layers

  return (
    <div className="layers-panel h-full flex flex-col bg-gray-800 text-white">
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <h3 className="text-sm font-medium">Layers</h3>
        <button
          onClick={updateLayersFromDOM}
          className="p-1 hover:bg-gray-700 rounded"
          title="Refresh layers"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="p-2 border-b border-gray-700">
        <div className="relative">
          <Search size={16} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search layers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredLayers.length === 0 ? (
          <div className="p-4 text-center text-gray-400 text-sm">
            No layers found. Try refreshing or add some elements.
          </div>
        ) : (
          <div>
            {filteredLayers.map(layer => renderLayerNode(layer))}
          </div>
        )}
      </div>
    </div>
  )
}

export default LayersPanel
