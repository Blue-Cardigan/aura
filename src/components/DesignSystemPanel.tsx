import React, { useState, useCallback } from 'react'
import { 
  Palette, 
  Type, 
  LayoutGrid, 
  Download, 
  Upload,
  Copy,
  Plus,
  Edit3,
  Save,
  Sparkles
} from 'lucide-react'
import type { Project } from '../types'

interface DesignSystemPanelProps {
  currentProject: Project | null
  onUpdateDesignSystem: (filePath: string, content: string) => void
}

interface ColorToken {
  name: string
  value: string
  description?: string
}

interface TypographyToken {
  name: string
  fontSize: string
  fontWeight: string
  lineHeight: string
  description?: string
}

interface SpacingToken {
  name: string
  value: string
  description?: string
}

interface DesignSystem {
  colors: ColorToken[]
  typography: TypographyToken[]
  spacing: SpacingToken[]
  borderRadius: { name: string; value: string }[]
  shadows: { name: string; value: string }[]
}

const DesignSystemPanel: React.FC<DesignSystemPanelProps> = ({
  currentProject,
  onUpdateDesignSystem
}) => {
  const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'spacing' | 'effects'>('colors')
  const [editingToken, setEditingToken] = useState<string | null>(null)

  // Default design system
  const [designSystem, setDesignSystem] = useState<DesignSystem>({
    colors: [
      { name: 'primary-50', value: '#eff6ff', description: 'Lightest primary' },
      { name: 'primary-100', value: '#dbeafe', description: 'Very light primary' },
      { name: 'primary-500', value: '#3b82f6', description: 'Primary brand color' },
      { name: 'primary-600', value: '#2563eb', description: 'Primary hover' },
      { name: 'primary-900', value: '#1e3a8a', description: 'Darkest primary' },
      { name: 'gray-50', value: '#f9fafb', description: 'Lightest gray' },
      { name: 'gray-100', value: '#f3f4f6', description: 'Very light gray' },
      { name: 'gray-500', value: '#6b7280', description: 'Medium gray' },
      { name: 'gray-900', value: '#111827', description: 'Darkest gray' },
      { name: 'success', value: '#10b981', description: 'Success color' },
      { name: 'warning', value: '#f59e0b', description: 'Warning color' },
      { name: 'error', value: '#ef4444', description: 'Error color' }
    ],
    typography: [
      { name: 'heading-1', fontSize: '3rem', fontWeight: '700', lineHeight: '1.2', description: 'Main page heading' },
      { name: 'heading-2', fontSize: '2.25rem', fontWeight: '600', lineHeight: '1.3', description: 'Section heading' },
      { name: 'heading-3', fontSize: '1.875rem', fontWeight: '600', lineHeight: '1.4', description: 'Subsection heading' },
      { name: 'body-large', fontSize: '1.125rem', fontWeight: '400', lineHeight: '1.6', description: 'Large body text' },
      { name: 'body', fontSize: '1rem', fontWeight: '400', lineHeight: '1.5', description: 'Default body text' },
      { name: 'body-small', fontSize: '0.875rem', fontWeight: '400', lineHeight: '1.4', description: 'Small body text' },
      { name: 'caption', fontSize: '0.75rem', fontWeight: '400', lineHeight: '1.3', description: 'Caption text' }
    ],
    spacing: [
      { name: 'xs', value: '0.25rem', description: '4px' },
      { name: 'sm', value: '0.5rem', description: '8px' },
      { name: 'md', value: '1rem', description: '16px' },
      { name: 'lg', value: '1.5rem', description: '24px' },
      { name: 'xl', value: '2rem', description: '32px' },
      { name: '2xl', value: '3rem', description: '48px' },
      { name: '3xl', value: '4rem', description: '64px' },
      { name: '4xl', value: '6rem', description: '96px' }
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
      { name: 'md', value: '0 4px 6px -1px rgb(0 0 0 / 0.1)' },
      { name: 'lg', value: '0 10px 15px -3px rgb(0 0 0 / 0.1)' },
      { name: 'xl', value: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }
    ]
  })

  const handleAddToken = useCallback((type: keyof DesignSystem) => {
    const tokenName = prompt(`Enter ${type} token name:`)
    if (!tokenName) return

    if (type === 'colors') {
      const color = prompt('Enter color value (hex):')
      if (color) {
        setDesignSystem(prev => ({
          ...prev,
          colors: [...prev.colors, { name: tokenName, value: color }]
        }))
      }
    } else if (type === 'typography') {
      setDesignSystem(prev => ({
        ...prev,
        typography: [...prev.typography, {
          name: tokenName,
          fontSize: '1rem',
          fontWeight: '400',
          lineHeight: '1.5'
        }]
      }))
    } else if (type === 'spacing') {
      const value = prompt('Enter spacing value (rem):')
      if (value) {
        setDesignSystem(prev => ({
          ...prev,
          spacing: [...prev.spacing, { name: tokenName, value }]
        }))
      }
    }
  }, [])

  const handleUpdateTailwindConfig = useCallback(async () => {
    if (!currentProject) return

    try {
      // Generate Tailwind config based on design system
      const tailwindConfig = generateTailwindConfig(designSystem)
      await onUpdateDesignSystem('/tailwind.config.js', tailwindConfig)
      
      // Generate CSS custom properties
      const cssVariables = generateCSSVariables(designSystem)
      await onUpdateDesignSystem('/src/design-system.css', cssVariables)
      
      console.log('Design system updated in code')
    } catch (error) {
      console.error('Failed to update design system:', error)
    }
  }, [designSystem, currentProject, onUpdateDesignSystem])

  const generateTailwindConfig = (system: DesignSystem): string => {
    const colors = system.colors.reduce((acc, color) => {
      const [name, shade] = color.name.includes('-') 
        ? color.name.split('-') 
        : [color.name, 'DEFAULT']
      
      if (!acc[name]) acc[name] = {}
      acc[name][shade] = color.value
      return acc
    }, {} as any)

    const spacing = system.spacing.reduce((acc, space) => {
      acc[space.name] = space.value
      return acc
    }, {} as any)

    const borderRadius = system.borderRadius.reduce((acc, radius) => {
      acc[radius.name] = radius.value
      return acc
    }, {} as any)

    const boxShadow = system.shadows.reduce((acc, shadow) => {
      acc[shadow.name] = shadow.value
      return acc
    }, {} as any)

    return `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: ${JSON.stringify(colors, null, 6)},
      spacing: ${JSON.stringify(spacing, null, 6)},
      borderRadius: ${JSON.stringify(borderRadius, null, 6)},
      boxShadow: ${JSON.stringify(boxShadow, null, 6)},
      fontSize: {
        ${system.typography.map(typo => 
          `'${typo.name}': ['${typo.fontSize}', { lineHeight: '${typo.lineHeight}', fontWeight: '${typo.fontWeight}' }]`
        ).join(',\n        ')}
      }
    },
  },
  plugins: [],
}`
  }

  const generateCSSVariables = (system: DesignSystem): string => {
    const colorVars = system.colors.map(color => 
      `  --color-${color.name}: ${color.value};`
    ).join('\n')

    const spacingVars = system.spacing.map(space => 
      `  --spacing-${space.name}: ${space.value};`
    ).join('\n')

    return `:root {
${colorVars}
${spacingVars}
}

/* Design System Classes */
${system.typography.map(typo => `
.text-${typo.name} {
  font-size: ${typo.fontSize};
  font-weight: ${typo.fontWeight};
  line-height: ${typo.lineHeight};
}`).join('')}

/* Utility classes for design system colors */
${system.colors.map(color => `
.bg-${color.name} { background-color: ${color.value}; }
.text-${color.name} { color: ${color.value}; }
.border-${color.name} { border-color: ${color.value}; }`).join('')}
`
  }

  const copyTokenValue = useCallback((value: string) => {
    navigator.clipboard.writeText(value)
    console.log('Token value copied to clipboard')
  }, [])

  const exportDesignSystem = useCallback(() => {
    const dataStr = JSON.stringify(designSystem, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'design-system.json'
    link.click()
    URL.revokeObjectURL(url)
  }, [designSystem])

  const importDesignSystem = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = () => {
          try {
            const imported = JSON.parse(reader.result as string)
            setDesignSystem(imported)
          } catch (error) {
            alert('Invalid design system file')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }, [])

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 p-4">
        <div className="text-center">
          <div className="text-2xl mb-2">🎨</div>
          <p className="text-sm">No project loaded</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'colors', label: 'Colors', icon: <Palette size={14} /> },
    { id: 'typography', label: 'Typography', icon: <Type size={14} /> },
    { id: 'spacing', label: 'Spacing', icon: <LayoutGrid size={14} /> },
    { id: 'effects', label: 'Effects', icon: <Sparkles size={14} /> },
  ] as const

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-white">Design System</h4>
          <div className="flex gap-1">
            <button
              onClick={handleUpdateTailwindConfig}
              className="btn-ghost p-1"
              title="Apply to Code"
            >
              <Save size={14} />
            </button>
            <button
              onClick={importDesignSystem}
              className="btn-ghost p-1"
              title="Import Design System"
            >
              <Upload size={14} />
            </button>
            <button
              onClick={exportDesignSystem}
              className="btn-ghost p-1"
              title="Export Design System"
            >
              <Download size={14} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-xs px-2 py-1 rounded transition-colors flex items-center gap-1 ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'colors' && (
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-medium text-white">Color Tokens</h5>
              <button
                onClick={() => handleAddToken('colors')}
                className="btn-ghost p-1"
                title="Add Color"
              >
                <Plus size={14} />
              </button>
            </div>
            
            <div className="space-y-2">
              {designSystem.colors.map((color, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-2 bg-gray-800 rounded-lg group hover:bg-gray-750"
                >
                  <div
                    className="w-8 h-8 rounded border border-gray-600 flex-shrink-0"
                    style={{ backgroundColor: color.value }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white text-sm">{color.name}</div>
                    <div className="text-xs text-gray-400 font-mono">{color.value}</div>
                    {color.description && (
                      <div className="text-xs text-gray-500">{color.description}</div>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => copyTokenValue(color.value)}
                      className="btn-ghost p-1"
                      title="Copy Value"
                    >
                      <Copy size={12} />
                    </button>
                    <button
                      onClick={() => setEditingToken(`color-${index}`)}
                      className="btn-ghost p-1"
                      title="Edit"
                    >
                      <Edit3 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'typography' && (
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-medium text-white">Typography Tokens</h5>
              <button
                onClick={() => handleAddToken('typography')}
                className="btn-ghost p-1"
                title="Add Typography Style"
              >
                <Plus size={14} />
              </button>
            </div>
            
            <div className="space-y-2">
              {designSystem.typography.map((typo, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-800 rounded-lg group hover:bg-gray-750"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-white text-sm">{typo.name}</div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => copyTokenValue(`${typo.fontSize} / ${typo.lineHeight} / ${typo.fontWeight}`)}
                        className="btn-ghost p-1"
                        title="Copy Values"
                      >
                        <Copy size={12} />
                      </button>
                      <button
                        onClick={() => setEditingToken(`typo-${index}`)}
                        className="btn-ghost p-1"
                        title="Edit"
                      >
                        <Edit3 size={12} />
                      </button>
                    </div>
                  </div>
                  
                  <div
                    className="text-white mb-2"
                    style={{
                      fontSize: typo.fontSize,
                      fontWeight: typo.fontWeight,
                      lineHeight: typo.lineHeight
                    }}
                  >
                    The quick brown fox jumps
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
                    <div>Size: {typo.fontSize}</div>
                    <div>Weight: {typo.fontWeight}</div>
                    <div>Height: {typo.lineHeight}</div>
                  </div>
                  
                  {typo.description && (
                    <div className="text-xs text-gray-500 mt-1">{typo.description}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'spacing' && (
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-medium text-white">Spacing Tokens</h5>
              <button
                onClick={() => handleAddToken('spacing')}
                className="btn-ghost p-1"
                title="Add Spacing"
              >
                <Plus size={14} />
              </button>
            </div>
            
            <div className="space-y-2">
              {designSystem.spacing.map((space, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-2 bg-gray-800 rounded-lg group hover:bg-gray-750"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className="bg-primary-500 h-4"
                      style={{ width: space.value }}
                    />
                    <div>
                      <div className="font-medium text-white text-sm">{space.name}</div>
                      <div className="text-xs text-gray-400">{space.value} {space.description && `(${space.description})`}</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => copyTokenValue(space.value)}
                      className="btn-ghost p-1"
                      title="Copy Value"
                    >
                      <Copy size={12} />
                    </button>
                    <button
                      onClick={() => setEditingToken(`space-${index}`)}
                      className="btn-ghost p-1"
                      title="Edit"
                    >
                      <Edit3 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'effects' && (
          <div className="p-3">
            {/* Border Radius */}
            <div className="mb-6">
              <h5 className="font-medium text-white mb-3">Border Radius</h5>
              <div className="space-y-2">
                {designSystem.borderRadius.map((radius, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-2 bg-gray-800 rounded-lg group hover:bg-gray-750"
                  >
                    <div
                      className="w-8 h-8 bg-primary-500 border border-gray-600"
                      style={{ borderRadius: radius.value }}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-white text-sm">{radius.name}</div>
                      <div className="text-xs text-gray-400">{radius.value}</div>
                    </div>
                    <button
                      onClick={() => copyTokenValue(radius.value)}
                      className="btn-ghost p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Shadows */}
            <div>
              <h5 className="font-medium text-white mb-3">Shadows</h5>
              <div className="space-y-2">
                {designSystem.shadows.map((shadow, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-2 bg-gray-800 rounded-lg group hover:bg-gray-750"
                  >
                    <div
                      className="w-8 h-8 bg-white rounded"
                      style={{ boxShadow: shadow.value }}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-white text-sm">{shadow.name}</div>
                      <div className="text-xs text-gray-400 font-mono">{shadow.value}</div>
                    </div>
                    <button
                      onClick={() => copyTokenValue(shadow.value)}
                      className="btn-ghost p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Apply Button */}
      <div className="border-t border-gray-700 p-3">
        <button
          onClick={handleUpdateTailwindConfig}
          className="btn btn-primary w-full"
          disabled={!currentProject}
        >
          <Save size={16} />
          Apply Design System to Code
        </button>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Updates Tailwind config and generates CSS variables
        </p>
      </div>
    </div>
  )
}

export default DesignSystemPanel
