import React, { useState, useCallback, useEffect } from 'react'
import { 
  Palette, 
  Type, 
  Ruler, 
  Square, 
  Layers, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  Copy, 
  Check, 
  X,
  Search,
  Download,
  Upload,
  RefreshCw,
  Zap
} from 'lucide-react'
import type { 
  DesignSystemPanelProps, 
  DesignSystem, 
  ColorToken, 
  TypographyToken, 
  SpacingToken 
} from '../types'

const DesignSystemPanel: React.FC<DesignSystemPanelProps> = ({
  selectedElement,
  onElementSelect,
  currentProject,
  onCodeChange,
  onProjectUpdate
}) => {
  const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'spacing' | 'effects'>('colors')
  const [searchTerm, setSearchTerm] = useState('')
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [designSystem, setDesignSystem] = useState<DesignSystem | null>(null)
  
  // New token creation state
  const [isCreatingToken, setIsCreatingToken] = useState(false)
  const [newTokenName, setNewTokenName] = useState('')
  const [newTokenValue, setNewTokenValue] = useState('')
  const [newTokenDescription, setNewTokenDescription] = useState('')
  
  // Color picker state
  const [colorPickerOpen, setColorPickerOpen] = useState<string | null>(null)

  // Initialize design system from project
  useEffect(() => {
    if (currentProject?.designSystem) {
      setDesignSystem(currentProject.designSystem)
      console.log('DesignSystemPanel: Loaded design system from project')
    } else {
      // Initialize with default design system
      const defaultSystem = createDefaultDesignSystem()
      setDesignSystem(defaultSystem)
      updateProjectDesignSystem(defaultSystem)
    }
  }, [currentProject?.id])

  const createDefaultDesignSystem = (): DesignSystem => {
    return {
      colors: [
        { name: 'primary', value: '#3B82F6', description: 'Primary brand color' },
        { name: 'secondary', value: '#6B7280', description: 'Secondary color' },
        { name: 'success', value: '#10B981', description: 'Success state' },
        { name: 'warning', value: '#F59E0B', description: 'Warning state' },
        { name: 'error', value: '#EF4444', description: 'Error state' },
        { name: 'background', value: '#FFFFFF', description: 'Background color' },
        { name: 'foreground', value: '#1F2937', description: 'Text color' }
      ],
      typography: [
        { name: 'heading-xl', fontSize: '3rem', fontWeight: '800', lineHeight: '1.2', description: 'Extra large heading' },
        { name: 'heading-lg', fontSize: '2.25rem', fontWeight: '700', lineHeight: '1.25', description: 'Large heading' },
        { name: 'heading-md', fontSize: '1.875rem', fontWeight: '600', lineHeight: '1.3', description: 'Medium heading' },
        { name: 'heading-sm', fontSize: '1.5rem', fontWeight: '600', lineHeight: '1.375', description: 'Small heading' },
        { name: 'body-lg', fontSize: '1.125rem', fontWeight: '400', lineHeight: '1.75', description: 'Large body text' },
        { name: 'body-md', fontSize: '1rem', fontWeight: '400', lineHeight: '1.5', description: 'Regular body text' },
        { name: 'body-sm', fontSize: '0.875rem', fontWeight: '400', lineHeight: '1.25', description: 'Small body text' }
      ],
      spacing: [
        { name: 'xs', value: '0.25rem', description: 'Extra small spacing' },
        { name: 'sm', value: '0.5rem', description: 'Small spacing' },
        { name: 'md', value: '1rem', description: 'Medium spacing' },
        { name: 'lg', value: '1.5rem', description: 'Large spacing' },
        { name: 'xl', value: '2rem', description: 'Extra large spacing' },
        { name: '2xl', value: '3rem', description: 'Double extra large spacing' },
        { name: '3xl', value: '4rem', description: 'Triple extra large spacing' }
      ],
      borderRadius: [
        { name: 'none', value: '0' },
        { name: 'sm', value: '0.125rem' },
        { name: 'md', value: '0.375rem' },
        { name: 'lg', value: '0.5rem' },
        { name: 'xl', value: '0.75rem' },
        { name: 'full', value: '9999px' }
      ],
      shadows: [
        { name: 'sm', value: '0 1px 2px 0 rgb(0 0 0 / 0.05)' },
        { name: 'md', value: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' },
        { name: 'lg', value: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' },
        { name: 'xl', value: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }
      ],
      version: '1.0.0',
      updatedAt: new Date().toISOString()
    }
  }

  const updateProjectDesignSystem = useCallback(async (updatedSystem: DesignSystem) => {
    if (!currentProject) return

    const updatedProject = {
      ...currentProject,
      designSystem: updatedSystem,
      updatedAt: new Date().toISOString()
    }

    setDesignSystem(updatedSystem)
    onProjectUpdate(updatedProject)
    
    // Generate CSS variables for the design system
    await generateDesignSystemCSS(updatedSystem)
  }, [currentProject, onProjectUpdate])

  const generateDesignSystemCSS = async (system: DesignSystem) => {
    if (!currentProject) return

    const cssVariables = `/* Design System Variables */
:root {
  /* Colors */
${system.colors.map(color => `  --color-${color.name}: ${color.value};`).join('\n')}

  /* Typography */
${system.typography.map(type => `  --font-size-${type.name}: ${type.fontSize};
  --font-weight-${type.name}: ${type.fontWeight};
  --line-height-${type.name}: ${type.lineHeight};`).join('\n')}

  /* Spacing */
${system.spacing.map(space => `  --spacing-${space.name}: ${space.value};`).join('\n')}

  /* Border Radius */
${system.borderRadius.map(radius => `  --radius-${radius.name}: ${radius.value};`).join('\n')}

  /* Shadows */
${system.shadows.map(shadow => `  --shadow-${shadow.name}: ${shadow.value};`).join('\n')}
}

/* Utility Classes */
${system.colors.map(color => `
.text-${color.name} { color: var(--color-${color.name}); }
.bg-${color.name} { background-color: var(--color-${color.name}); }
.border-${color.name} { border-color: var(--color-${color.name}); }`).join('')}

${system.typography.map(type => `
.text-${type.name} { 
  font-size: var(--font-size-${type.name}); 
  font-weight: var(--font-weight-${type.name}); 
  line-height: var(--line-height-${type.name}); 
}`).join('')}

${system.spacing.map(space => `
.p-${space.name} { padding: var(--spacing-${space.name}); }
.m-${space.name} { margin: var(--spacing-${space.name}); }
.gap-${space.name} { gap: var(--spacing-${space.name}); }`).join('')}
`

    try {
      await onCodeChange('/src/design-system.css', cssVariables)
      console.log('DesignSystemPanel: Generated design system CSS')
    } catch (error) {
      console.error('DesignSystemPanel: Failed to generate CSS:', error)
    }
  }

  const handleAddToken = useCallback(async () => {
    if (!designSystem || !newTokenName.trim() || !newTokenValue.trim()) return

    const updatedSystem = { ...designSystem }

    switch (activeTab) {
      case 'colors':
        updatedSystem.colors = [
          ...updatedSystem.colors,
          {
            name: newTokenName.trim(),
            value: newTokenValue.trim(),
            description: newTokenDescription.trim() || undefined
          }
        ]
        break
      case 'typography':
        // For typography, we need more complex handling
        const [fontSize, fontWeight, lineHeight] = newTokenValue.split(',').map(v => v.trim())
        updatedSystem.typography = [
          ...updatedSystem.typography,
          {
            name: newTokenName.trim(),
            fontSize: fontSize || '1rem',
            fontWeight: fontWeight || '400',
            lineHeight: lineHeight || '1.5',
            description: newTokenDescription.trim() || undefined
          }
        ]
        break
      case 'spacing':
        updatedSystem.spacing = [
          ...updatedSystem.spacing,
          {
            name: newTokenName.trim(),
            value: newTokenValue.trim(),
            description: newTokenDescription.trim() || undefined
          }
        ]
        break
    }

    updatedSystem.updatedAt = new Date().toISOString()
    await updateProjectDesignSystem(updatedSystem)

    // Reset form
    setNewTokenName('')
    setNewTokenValue('')
    setNewTokenDescription('')
    setIsCreatingToken(false)
  }, [designSystem, activeTab, newTokenName, newTokenValue, newTokenDescription, updateProjectDesignSystem])

  const handleDeleteToken = useCallback(async (tokenName: string) => {
    if (!designSystem) return

    const updatedSystem = { ...designSystem }

    switch (activeTab) {
      case 'colors':
        updatedSystem.colors = updatedSystem.colors.filter(token => token.name !== tokenName)
        break
      case 'typography':
        updatedSystem.typography = updatedSystem.typography.filter(token => token.name !== tokenName)
        break
      case 'spacing':
        updatedSystem.spacing = updatedSystem.spacing.filter(token => token.name !== tokenName)
        break
    }

    updatedSystem.updatedAt = new Date().toISOString()
    await updateProjectDesignSystem(updatedSystem)
  }, [designSystem, activeTab, updateProjectDesignSystem])

  const handleApplyTokenToElement = useCallback(async (token: ColorToken | TypographyToken | SpacingToken) => {
    if (!selectedElement?.element) return

    const element = selectedElement.element
    const iframe = document.querySelector('.webstudio-preview-frame') as HTMLIFrameElement
    if (!iframe?.contentDocument) return

    try {
      switch (activeTab) {
        case 'colors':
          const colorToken = token as ColorToken
          element.style.color = colorToken.value
          break
        case 'typography':
          const typeToken = token as TypographyToken
          element.style.fontSize = typeToken.fontSize
          element.style.fontWeight = typeToken.fontWeight
          element.style.lineHeight = typeToken.lineHeight
          break
        case 'spacing':
          const spaceToken = token as SpacingToken
          element.style.padding = spaceToken.value
          break
      }

      // Regenerate component
      await regenerateComponent()
      console.log(`DesignSystemPanel: Applied ${token.name} to selected element`)
    } catch (error) {
      console.error('DesignSystemPanel: Failed to apply token:', error)
    }
  }, [selectedElement, activeTab])

  const regenerateComponent = async () => {
    if (!currentProject) return

    try {
      const iframe = document.querySelector('.webstudio-preview-frame') as HTMLIFrameElement
      if (!iframe?.contentDocument) return

      const rootElement = iframe.contentDocument.querySelector('[data-webstudio-element="root"]')
      if (!rootElement) return

      const newJSX = generateJSXFromDOM(rootElement as HTMLElement)
      
      const componentCode = `import React from 'react'
import './design-system.css'

function App() {
  return (
    ${newJSX}
  )
}

export default App`

      await onCodeChange('/src/App.tsx', componentCode)
      console.log('DesignSystemPanel: Component regenerated with design system')
    } catch (error) {
      console.error('DesignSystemPanel: Failed to regenerate component:', error)
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

  const exportDesignSystem = useCallback(() => {
    if (!designSystem) return

    const dataStr = JSON.stringify(designSystem, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `${currentProject?.name || 'project'}-design-system.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }, [designSystem, currentProject])

  const importDesignSystem = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const importedSystem = JSON.parse(e.target?.result as string) as DesignSystem
        importedSystem.updatedAt = new Date().toISOString()
        await updateProjectDesignSystem(importedSystem)
        console.log('DesignSystemPanel: Imported design system')
      } catch (error) {
        console.error('DesignSystemPanel: Failed to import design system:', error)
      }
    }
    reader.readAsText(file)
  }, [updateProjectDesignSystem])

  const getTokensByTab = () => {
    if (!designSystem) return []

    const tokens = {
      colors: designSystem.colors || [],
      typography: designSystem.typography || [], 
      spacing: designSystem.spacing || [],
      effects: []
    }

    const activeTokens = tokens[activeTab] || []

    return activeTokens.filter(token => 
      token.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const renderTokenList = () => {
    const tokens = getTokensByTab()

    if (tokens.length === 0) {
      return (
        <div className="p-4 text-center text-gray-400 text-sm">
          No {activeTab} tokens found
        </div>
      )
    }

    return (
      <div className="space-y-2 p-2">
        {tokens.map((token) => (
          <div
            key={token.name}
            className="bg-gray-700 rounded p-3 hover:bg-gray-600 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-white">{token.name}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleApplyTokenToElement(token)}
                  className="p-1 hover:bg-gray-500 rounded"
                  title="Apply to selected element"
                  disabled={!selectedElement}
                >
                  <Zap size={12} />
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText((token as ColorToken).value || '')}
                  className="p-1 hover:bg-gray-500 rounded"
                  title="Copy value"
                >
                  <Copy size={12} />
                </button>
                <button
                  onClick={() => handleDeleteToken(token.name)}
                  className="p-1 hover:bg-red-600 rounded"
                  title="Delete token"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
            
            {activeTab === 'colors' && (
              <div className="flex items-center gap-2">
                <div 
                  className="w-6 h-6 rounded border border-gray-500"
                  style={{ backgroundColor: (token as ColorToken).value }}
                />
                <span className="text-sm text-gray-300">{(token as ColorToken).value}</span>
              </div>
            )}
            
            {activeTab === 'typography' && (
              <div className="text-sm text-gray-300 space-y-1">
                <div>Size: {(token as TypographyToken).fontSize}</div>
                <div>Weight: {(token as TypographyToken).fontWeight}</div>
                <div>Line Height: {(token as TypographyToken).lineHeight}</div>
              </div>
            )}
            
            {activeTab === 'spacing' && (
              <div className="flex items-center gap-2">
                <div 
                  className="bg-blue-500 h-4"
                  style={{ width: (token as SpacingToken).value }}
                />
                <span className="text-sm text-gray-300">{(token as SpacingToken).value}</span>
              </div>
            )}
            
            {token.description && (
              <p className="text-xs text-gray-400 mt-2">{token.description}</p>
            )}
          </div>
        ))}
      </div>
    )
  }

  const tabs = [
    { id: 'colors', name: 'Colors', icon: Palette },
    { id: 'typography', name: 'Typography', icon: Type },
    { id: 'spacing', name: 'Spacing', icon: Ruler },
    { id: 'effects', name: 'Effects', icon: Layers }
  ]

  return (
    <div className="design-system-panel h-full flex flex-col bg-gray-800 text-white">
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <h3 className="text-sm font-medium">Design System</h3>
        <div className="flex items-center gap-1">
          <input
            type="file"
            accept=".json"
            onChange={importDesignSystem}
            className="hidden"
            id="import-design-system"
          />
          <label
            htmlFor="import-design-system"
            className="p-1 hover:bg-gray-700 rounded cursor-pointer"
            title="Import design system"
          >
            <Upload size={16} />
          </label>
          <button
            onClick={exportDesignSystem}
            className="p-1 hover:bg-gray-700 rounded"
            title="Export design system"
          >
            <Download size={16} />
          </button>
          <button
            onClick={() => setIsCreatingToken(true)}
            className="p-1 hover:bg-gray-700 rounded"
            title="Add token"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-1 p-2 text-xs ${
              activeTab === tab.id
                ? 'bg-gray-700 text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <tab.icon size={14} />
            {tab.name}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="p-2 border-b border-gray-700">
        <div className="relative">
          <Search size={16} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Add Token Form */}
      {isCreatingToken && (
        <div className="p-3 bg-gray-700 border-b border-gray-600">
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Token name"
              value={newTokenName}
              onChange={(e) => setNewTokenName(e.target.value)}
              className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-sm focus:outline-none focus:border-blue-500"
            />
            {activeTab === 'typography' ? (
              <input
                type="text"
                placeholder="fontSize, fontWeight, lineHeight (comma separated)"
                value={newTokenValue}
                onChange={(e) => setNewTokenValue(e.target.value)}
                className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-sm focus:outline-none focus:border-blue-500"
              />
            ) : (
              <input
                type="text"
                placeholder={activeTab === 'colors' ? 'Color value (#hex, rgb, hsl)' : 'Value (rem, px, %)'}
                value={newTokenValue}
                onChange={(e) => setNewTokenValue(e.target.value)}
                className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-sm focus:outline-none focus:border-blue-500"
              />
            )}
            <input
              type="text"
              placeholder="Description (optional)"
              value={newTokenDescription}
              onChange={(e) => setNewTokenDescription(e.target.value)}
              className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-sm focus:outline-none focus:border-blue-500"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddToken}
                className="flex-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                disabled={!newTokenName.trim() || !newTokenValue.trim()}
              >
                <Check size={12} className="inline mr-1" />
                Add Token
              </button>
              <button
                onClick={() => {
                  setIsCreatingToken(false)
                  setNewTokenName('')
                  setNewTokenValue('')
                  setNewTokenDescription('')
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

      {/* Token List */}
      <div className="flex-1 overflow-y-auto">
        {renderTokenList()}
      </div>

      {/* Stats */}
      {designSystem && (
        <div className="p-2 border-t border-gray-700 text-xs text-gray-400">
          <div className="flex justify-between">
            <span>Version: {designSystem.version}</span>
            <span>{getTokensByTab().length} tokens</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default DesignSystemPanel
