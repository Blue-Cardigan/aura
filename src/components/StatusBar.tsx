import React from 'react'
import type { SelectedElement } from '../types'

interface StatusBarProps {
  message: string
  selectedElement: SelectedElement | null
  projectName?: string
  showCodeEditor?: boolean
}

const StatusBar: React.FC<StatusBarProps> = ({
  message,
  selectedElement,
  projectName,
  showCodeEditor = false
}) => {
  return (
    <div className="status-bar">
      <span className="flex-1">{message}</span>
      
      {selectedElement && (
        <span className="border-l border-gray-600 pl-4 ml-4">
          Selected: {selectedElement.tagName.toLowerCase()}
          {selectedElement.dataAttribute && ` (${selectedElement.dataAttribute})`}
        </span>
      )}
      
      {projectName && (
        <span className="border-l border-gray-600 pl-4 ml-4">
          Project: {projectName}
        </span>
      )}
      
      <span className="border-l border-gray-600 pl-4 ml-4">
        View: {showCodeEditor ? 'Code Editor' : 'Design Canvas'}
      </span>
      
      <span className="border-l border-gray-600 pl-4 ml-4 text-xs">
        Ctrl/⌘+` Toggle Code • Ctrl/⌘+S Save
      </span>
    </div>
  )
}

export default StatusBar
