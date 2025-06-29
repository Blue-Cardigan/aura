import React from 'react'
import { Layers } from 'lucide-react'
import type { SelectedElement } from '../types'

interface LayersPanelProps {
  selectedElement: SelectedElement | null
  onElementSelect: (element: SelectedElement) => void
}

const LayersPanel: React.FC<LayersPanelProps> = ({
  selectedElement,
  onElementSelect
}) => {
  if (!selectedElement) {
    return (
      <div className="text-center text-gray-400 py-4">
        Select an element to view layers
      </div>
    )
  }

  const getElementHierarchy = () => {
    const elements: Array<{
      name: string
      element: HTMLElement
      level: number
      isSelected: boolean
    }> = []

    // Walk up the DOM tree from selected element
    let current = selectedElement.element
    let level = 0
    
    while (current && current.hasAttribute('data-webstudio-element')) {
      const dataAttr = current.getAttribute('data-webstudio-element') || 'element'
      elements.unshift({
        name: `${current.tagName.toLowerCase()} (${dataAttr})`,
        element: current,
        level: level,
        isSelected: current === selectedElement.element
      })
      
      current = current.parentElement
      level++
    }

    // Add children elements
    const children = selectedElement.element.querySelectorAll('[data-webstudio-element]')
    children.forEach((child) => {
      const childElement = child as HTMLElement
      if (childElement !== selectedElement.element) {
        const dataAttr = childElement.getAttribute('data-webstudio-element') || 'element'
        elements.push({
          name: `${childElement.tagName.toLowerCase()} (${dataAttr})`,
          element: childElement,
          level: 0,
          isSelected: false
        })
      }
    })

    return elements
  }

  const handleElementClick = (element: HTMLElement) => {
    // Simulate a click on the element to select it
    element.click()
  }

  const hierarchy = getElementHierarchy()

  return (
    <div className="max-h-48 overflow-y-auto bg-gray-800 rounded-lg p-2">
      {hierarchy.map((item, index) => (
        <div
          key={index}
          className={`file-item ${item.isSelected ? 'active' : ''}`}
          onClick={() => handleElementClick(item.element)}
          style={{ paddingLeft: `${item.level * 16 + 8}px` }}
        >
          <Layers size={14} />
          <span>{item.name}</span>
        </div>
      ))}
    </div>
  )
}

export default LayersPanel
