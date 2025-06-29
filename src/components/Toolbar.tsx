import React from 'react'
import { 
  MousePointer, 
  Hand, 
  Square, 
  Circle, 
  Type, 
  Component,
  Image,
  ZoomIn,
  ZoomOut,
  Maximize,
  Code
} from 'lucide-react'
import type { Tool } from '../types'

interface ToolbarProps {
  currentTool: Tool
  onToolChange: (tool: Tool) => void
  zoomLevel: number
  onZoomChange: (zoom: number) => void
  showCodeEditor: boolean
  onToggleCodeEditor: () => void
}

const Toolbar: React.FC<ToolbarProps> = ({
  currentTool,
  onToolChange,
  zoomLevel,
  onZoomChange,
  showCodeEditor,
  onToggleCodeEditor
}) => {
  const tools: Array<{ id: Tool; icon: React.ReactNode; title: string }> = [
    { id: 'select', icon: <MousePointer size={16} />, title: 'Select' },
    { id: 'hand', icon: <Hand size={16} />, title: 'Hand' },
    { id: 'rectangle', icon: <Square size={16} />, title: 'Rectangle' },
    { id: 'circle', icon: <Circle size={16} />, title: 'Circle' },
    { id: 'text', icon: <Type size={16} />, title: 'Text' },
  ]

  const handleZoomIn = () => {
    onZoomChange(zoomLevel + 10)
  }

  const handleZoomOut = () => {
    onZoomChange(zoomLevel - 10)
  }

  const handleFitToScreen = () => {
    onZoomChange(100)
  }

  return (
    <div className="h-14 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        {/* Selection Tools */}
        <div className="flex items-center gap-1 border-r border-gray-700 pr-4">
          {tools.slice(0, 2).map((tool) => (
            <button
              key={tool.id}
              onClick={() => onToolChange(tool.id)}
              className={`tool-btn ${currentTool === tool.id ? 'active' : ''}`}
              title={tool.title}
            >
              {tool.icon}
            </button>
          ))}
        </div>

        {/* Shape Tools */}
        <div className="flex items-center gap-1 border-r border-gray-700 pr-4">
          {tools.slice(2, 5).map((tool) => (
            <button
              key={tool.id}
              onClick={() => onToolChange(tool.id)}
              className={`tool-btn ${currentTool === tool.id ? 'active' : ''}`}
              title={tool.title}
            >
              {tool.icon}
            </button>
          ))}
        </div>

        {/* Component Tools */}
        <div className="flex items-center gap-1 border-r border-gray-700 pr-4">
          <button className="tool-btn" title="Components">
            <Component size={16} />
          </button>
          <button className="tool-btn" title="Assets">
            <Image size={16} />
          </button>
        </div>

        {/* Code Editor Toggle */}
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleCodeEditor}
            className={`tool-btn ${showCodeEditor ? 'active' : ''}`}
            title={`${showCodeEditor ? 'Hide' : 'Show'} Code Editor (Ctrl/Cmd + \`)`}
          >
            <Code size={16} />
          </button>
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center gap-2">
        <div className="zoom-control">
          <button onClick={handleZoomOut} className="zoom-btn" title="Zoom Out">
            <ZoomOut size={14} />
          </button>
          <span className="zoom-value">{zoomLevel}%</span>
          <button onClick={handleZoomIn} className="zoom-btn" title="Zoom In">
            <ZoomIn size={14} />
          </button>
        </div>
        <button onClick={handleFitToScreen} className="tool-btn" title="Fit to Screen">
          <Maximize size={16} />
        </button>
      </div>
    </div>
  )
}

export default Toolbar
