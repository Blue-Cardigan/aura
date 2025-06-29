import React from 'react'
import { Palette, Layout, Type, Square, Move } from 'lucide-react'
import type { SelectedElement } from '../types'

interface PropertiesPanelProps {
  selectedElement: SelectedElement | null
  onElementUpdate: (property: string, value: string) => void
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedElement,
  onElementUpdate
}) => {
  if (!selectedElement) {
    return (
      <div className="w-80 panel">
        <div className="panel-header">
          Properties
        </div>
        <div className="flex items-center justify-center h-32 text-gray-400">
          Select an element to edit properties
        </div>
      </div>
    )
  }

  const handleStyleChange = (property: string, value: string) => {
    onElementUpdate(`style.${property}`, value)
  }

  const handleAttributeChange = (attribute: string, value: string) => {
    onElementUpdate(attribute, value)
  }

  const handleContentChange = (value: string) => {
    onElementUpdate('textContent', value)
  }

  const rgbToHex = (rgb: string): string => {
    if (!rgb || rgb === 'rgba(0, 0, 0, 0)') return '#000000'
    
    const result = rgb.match(/\d+/g)
    if (!result) return '#000000'
    
    return '#' + result.slice(0, 3).map(x => {
      const hex = parseInt(x).toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }).join('')
  }

  return (
    <div className="w-80 panel">
      <div className="panel-header">
        Properties
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {/* Element Info */}
        <div className="panel-section">
          <h3 className="section-title flex items-center gap-2">
            <Layout size={14} />
            Element
          </h3>
          <div className="space-y-2">
            <div className="property-row">
              <label className="property-label">Tag</label>
              <input
                className="form-input-sm flex-1"
                value={selectedElement.tagName.toLowerCase()}
                readOnly
              />
            </div>
            <div className="property-row">
              <label className="property-label">ID</label>
              <input
                className="form-input-sm flex-1"
                value={selectedElement.id}
                onChange={(e) => handleAttributeChange('id', e.target.value)}
                placeholder="element-id"
              />
            </div>
            <div className="property-row">
              <label className="property-label">Class</label>
              <input
                className="form-input-sm flex-1"
                value={selectedElement.className}
                onChange={(e) => handleAttributeChange('className', e.target.value)}
                placeholder="css-classes"
              />
            </div>
          </div>
        </div>

        {/* Layout */}
        <div className="panel-section">
          <h3 className="section-title flex items-center gap-2">
            <Layout size={14} />
            Layout
          </h3>
          <div className="space-y-2">
            <div className="property-row">
              <label className="property-label">Display</label>
              <select
                className="form-input-sm flex-1"
                value={selectedElement.styles.display}
                onChange={(e) => handleStyleChange('display', e.target.value)}
              >
                <option value="block">Block</option>
                <option value="flex">Flex</option>
                <option value="inline">Inline</option>
                <option value="inline-block">Inline Block</option>
                <option value="grid">Grid</option>
                <option value="none">None</option>
              </select>
            </div>
            <div className="property-row">
              <label className="property-label">Width</label>
              <input
                className="form-input-sm flex-1"
                value={selectedElement.styles.width}
                onChange={(e) => handleStyleChange('width', e.target.value)}
                placeholder="auto"
              />
            </div>
            <div className="property-row">
              <label className="property-label">Height</label>
              <input
                className="form-input-sm flex-1"
                value={selectedElement.styles.height}
                onChange={(e) => handleStyleChange('height', e.target.value)}
                placeholder="auto"
              />
            </div>
          </div>
        </div>

        {/* Spacing */}
        <div className="panel-section">
          <h3 className="section-title flex items-center gap-2">
            <Move size={14} />
            Spacing
          </h3>
          <div className="space-y-2">
            <div className="property-row">
              <label className="property-label">Margin</label>
              <input
                className="form-input-sm flex-1"
                value={selectedElement.styles.margin}
                onChange={(e) => handleStyleChange('margin', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="property-row">
              <label className="property-label">Padding</label>
              <input
                className="form-input-sm flex-1"
                value={selectedElement.styles.padding}
                onChange={(e) => handleStyleChange('padding', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="panel-section">
          <h3 className="section-title flex items-center gap-2">
            <Type size={14} />
            Typography
          </h3>
          <div className="space-y-2">
            <div className="property-row">
              <label className="property-label">Size</label>
              <input
                className="form-input-sm flex-1"
                value={selectedElement.styles.fontSize}
                onChange={(e) => handleStyleChange('fontSize', e.target.value)}
                placeholder="16px"
              />
            </div>
            <div className="property-row">
              <label className="property-label">Weight</label>
              <select
                className="form-input-sm flex-1"
                value={selectedElement.styles.fontWeight}
                onChange={(e) => handleStyleChange('fontWeight', e.target.value)}
              >
                <option value="normal">Normal</option>
                <option value="bold">Bold</option>
                <option value="lighter">Lighter</option>
                <option value="100">100</option>
                <option value="200">200</option>
                <option value="300">300</option>
                <option value="400">400</option>
                <option value="500">500</option>
                <option value="600">600</option>
                <option value="700">700</option>
                <option value="800">800</option>
                <option value="900">900</option>
              </select>
            </div>
            <div className="property-row">
              <label className="property-label">Color</label>
              <input
                type="color"
                className="w-8 h-8 rounded border border-gray-600 cursor-pointer"
                value={rgbToHex(selectedElement.styles.color)}
                onChange={(e) => handleStyleChange('color', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Background */}
        <div className="panel-section">
          <h3 className="section-title flex items-center gap-2">
            <Palette size={14} />
            Background
          </h3>
          <div className="space-y-2">
            <div className="property-row">
              <label className="property-label">Color</label>
              <input
                type="color"
                className="w-8 h-8 rounded border border-gray-600 cursor-pointer"
                value={rgbToHex(selectedElement.styles.backgroundColor)}
                onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Border */}
        <div className="panel-section">
          <h3 className="section-title flex items-center gap-2">
            <Square size={14} />
            Border
          </h3>
          <div className="space-y-2">
            <div className="property-row">
              <label className="property-label">Width</label>
              <input
                className="form-input-sm flex-1"
                value={selectedElement.styles.borderWidth}
                onChange={(e) => handleStyleChange('borderWidth', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="property-row">
              <label className="property-label">Style</label>
              <select
                className="form-input-sm flex-1"
                value={selectedElement.styles.borderStyle}
                onChange={(e) => handleStyleChange('borderStyle', e.target.value)}
              >
                <option value="none">None</option>
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
                <option value="double">Double</option>
              </select>
            </div>
            <div className="property-row">
              <label className="property-label">Color</label>
              <input
                type="color"
                className="w-8 h-8 rounded border border-gray-600 cursor-pointer"
                value={rgbToHex(selectedElement.styles.borderColor)}
                onChange={(e) => handleStyleChange('borderColor', e.target.value)}
              />
            </div>
            <div className="property-row">
              <label className="property-label">Radius</label>
              <input
                className="form-input-sm flex-1"
                value={selectedElement.styles.borderRadius}
                onChange={(e) => handleStyleChange('borderRadius', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        {(selectedElement.tagName.toLowerCase() === 'button' || 
          selectedElement.tagName.toLowerCase() === 'a' ||
          selectedElement.tagName.toLowerCase() === 'h1' ||
          selectedElement.tagName.toLowerCase() === 'h2' ||
          selectedElement.tagName.toLowerCase() === 'h3' ||
          selectedElement.tagName.toLowerCase() === 'p' ||
          selectedElement.tagName.toLowerCase() === 'span') && (
          <div className="panel-section">
            <h3 className="section-title">Content</h3>
            <div className="space-y-2">
              <div>
                <label className="property-label block mb-1">Text</label>
                <textarea
                  className="form-input-sm w-full resize-none"
                  rows={3}
                  value={selectedElement.textContent}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Enter text content..."
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PropertiesPanel
