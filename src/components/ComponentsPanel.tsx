import React, { useState, useCallback } from 'react'
import { 
  Plus, 
  Search, 
  Copy, 
  Edit3,
  Star,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react'
import type { Project, SelectedElement } from '../types'

interface ComponentsPanelProps {
  currentProject: Project | null
  onAddComponent: (filePath: string, content: string) => void
  selectedElement: SelectedElement | null
}

interface Component {
  id: string
  name: string
  category: string
  description: string
  code: string
  preview: string
  tags: string[]
  favorite: boolean
}

const ComponentsPanel: React.FC<ComponentsPanelProps> = ({
  currentProject,
  onAddComponent,
  selectedElement
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [customComponents, setCustomComponents] = useState<Component[]>([])
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  // Built-in component library
  const builtInComponents: Component[] = [
    {
      id: 'button-primary',
      name: 'Primary Button',
      category: 'buttons',
      description: 'A primary action button with hover effects',
      code: `<button className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors" data-webstudio-element="primary-button">
  Click me
</button>`,
      preview: '🔵 Primary Button',
      tags: ['button', 'primary', 'cta'],
      favorite: false
    },
    {
      id: 'button-secondary',
      name: 'Secondary Button',
      category: 'buttons',
      description: 'A secondary button with outline style',
      code: `<button className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors" data-webstudio-element="secondary-button">
  Cancel
</button>`,
      preview: '⚪ Secondary Button',
      tags: ['button', 'secondary', 'outline'],
      favorite: false
    },
    {
      id: 'card-basic',
      name: 'Basic Card',
      category: 'layout',
      description: 'A simple card with shadow and padding',
      code: `<div className="bg-white rounded-lg shadow-md p-6 border border-gray-200" data-webstudio-element="basic-card">
  <h3 className="text-lg font-semibold text-gray-900 mb-2" data-webstudio-element="card-title">Card Title</h3>
  <p className="text-gray-600" data-webstudio-element="card-content">This is a basic card component with some sample content.</p>
</div>`,
      preview: '📄 Basic Card',
      tags: ['card', 'container', 'shadow'],
      favorite: true
    },
    {
      id: 'hero-section',
      name: 'Hero Section',
      category: 'sections',
      description: 'A hero section with title, subtitle, and CTA',
      code: `<section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20" data-webstudio-element="hero-section">
  <div className="max-w-4xl mx-auto text-center px-4" data-webstudio-element="hero-container">
    <h1 className="text-5xl font-bold mb-6" data-webstudio-element="hero-title">Welcome to Our Product</h1>
    <p className="text-xl mb-8 opacity-90" data-webstudio-element="hero-subtitle">Build amazing things with our powerful platform</p>
    <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors" data-webstudio-element="hero-cta">
      Get Started
    </button>
  </div>
</section>`,
      preview: '🦸 Hero Section',
      tags: ['hero', 'section', 'cta', 'gradient'],
      favorite: true
    },
    {
      id: 'navbar',
      name: 'Navigation Bar',
      category: 'navigation',
      description: 'A responsive navigation bar with logo and links',
      code: `<nav className="bg-white shadow-lg border-b border-gray-200" data-webstudio-element="navbar">
  <div className="max-w-7xl mx-auto px-4" data-webstudio-element="nav-container">
    <div className="flex justify-between items-center h-16" data-webstudio-element="nav-content">
      <div className="flex items-center" data-webstudio-element="nav-brand">
        <span className="text-xl font-bold text-gray-900" data-webstudio-element="logo">Logo</span>
      </div>
      <div className="hidden md:flex space-x-8" data-webstudio-element="nav-links">
        <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors" data-webstudio-element="nav-link">Home</a>
        <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors" data-webstudio-element="nav-link">About</a>
        <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors" data-webstudio-element="nav-link">Services</a>
        <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors" data-webstudio-element="nav-link">Contact</a>
      </div>
    </div>
  </div>
</nav>`,
      preview: '🧭 Navigation Bar',
      tags: ['nav', 'menu', 'header', 'responsive'],
      favorite: false
    },
    {
      id: 'form-contact',
      name: 'Contact Form',
      category: 'forms',
      description: 'A contact form with validation styling',
      code: `<form className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto" data-webstudio-element="contact-form">
  <h2 className="text-2xl font-bold text-gray-900 mb-6" data-webstudio-element="form-title">Contact Us</h2>
  <div className="mb-4" data-webstudio-element="form-group">
    <label className="block text-gray-700 text-sm font-medium mb-2" data-webstudio-element="form-label">Name</label>
    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" data-webstudio-element="form-input" />
  </div>
  <div className="mb-4" data-webstudio-element="form-group">
    <label className="block text-gray-700 text-sm font-medium mb-2" data-webstudio-element="form-label">Email</label>
    <input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" data-webstudio-element="form-input" />
  </div>
  <div className="mb-6" data-webstudio-element="form-group">
    <label className="block text-gray-700 text-sm font-medium mb-2" data-webstudio-element="form-label">Message</label>
    <textarea rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" data-webstudio-element="form-textarea"></textarea>
  </div>
  <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors" data-webstudio-element="form-submit">
    Send Message
  </button>
</form>`,
      preview: '📝 Contact Form',
      tags: ['form', 'contact', 'input', 'validation'],
      favorite: false
    },
    {
      id: 'grid-features',
      name: 'Feature Grid',
      category: 'layout',
      description: 'A 3-column grid showcasing features',
      code: `<section className="py-16 bg-gray-50" data-webstudio-element="features-section">
  <div className="max-w-6xl mx-auto px-4" data-webstudio-element="features-container">
    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12" data-webstudio-element="features-title">Our Features</h2>
    <div className="grid md:grid-cols-3 gap-8" data-webstudio-element="features-grid">
      <div className="text-center" data-webstudio-element="feature-item">
        <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" data-webstudio-element="feature-icon">
          <span className="text-2xl">⚡</span>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2" data-webstudio-element="feature-title">Fast</h3>
        <p className="text-gray-600" data-webstudio-element="feature-description">Lightning fast performance for your users</p>
      </div>
      <div className="text-center" data-webstudio-element="feature-item">
        <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" data-webstudio-element="feature-icon">
          <span className="text-2xl">🔒</span>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2" data-webstudio-element="feature-title">Secure</h3>
        <p className="text-gray-600" data-webstudio-element="feature-description">Enterprise-grade security for your data</p>
      </div>
      <div className="text-center" data-webstudio-element="feature-item">
        <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" data-webstudio-element="feature-icon">
          <span className="text-2xl">📱</span>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2" data-webstudio-element="feature-title">Responsive</h3>
        <p className="text-gray-600" data-webstudio-element="feature-description">Works perfectly on all devices</p>
      </div>
    </div>
  </div>
</section>`,
      preview: '🏗️ Feature Grid',
      tags: ['grid', 'features', 'responsive', 'icons'],
      favorite: true
    },
    {
      id: 'testimonial',
      name: 'Testimonial Card',
      category: 'content',
      description: 'A testimonial card with avatar and quote',
      code: `<div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto" data-webstudio-element="testimonial-card">
  <div className="flex items-center mb-4" data-webstudio-element="testimonial-header">
    <img className="w-12 h-12 rounded-full mr-4" src="https://via.placeholder.com/48" alt="Avatar" data-webstudio-element="testimonial-avatar" />
    <div data-webstudio-element="testimonial-info">
      <h4 className="font-semibold text-gray-900" data-webstudio-element="testimonial-name">John Doe</h4>
      <p className="text-gray-600 text-sm" data-webstudio-element="testimonial-role">CEO, Company</p>
    </div>
  </div>
  <blockquote className="text-gray-700 italic" data-webstudio-element="testimonial-quote">
    "This product has completely transformed how we work. Highly recommended!"
  </blockquote>
</div>`,
      preview: '💬 Testimonial',
      tags: ['testimonial', 'quote', 'avatar', 'social-proof'],
      favorite: false
    }
  ]

  const categories = [
    { id: 'all', name: 'All', icon: '📋' },
    { id: 'buttons', name: 'Buttons', icon: '🔘' },
    { id: 'layout', name: 'Layout', icon: '📐' },
    { id: 'sections', name: 'Sections', icon: '📄' },
    { id: 'navigation', name: 'Navigation', icon: '🧭' },
    { id: 'forms', name: 'Forms', icon: '📝' },
    { id: 'content', name: 'Content', icon: '📖' }
  ]

  const allComponents = [...builtInComponents, ...customComponents]

  const filteredComponents = allComponents.filter(component => {
    const matchesSearch = component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         component.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         component.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || component.category === selectedCategory
    const matchesFavorites = !showFavoritesOnly || component.favorite
    
    return matchesSearch && matchesCategory && matchesFavorites
  })

  const handleAddComponent = useCallback(async (component: Component) => {
    if (!currentProject) return

    try {
      // Get current App.tsx content
      const currentContent = await getCurrentAppContent()
      
      // Insert the component code properly
      const updatedContent = insertComponentSafely(currentContent, component.code)
      
      // Update the file
      await onAddComponent('/src/App.tsx', updatedContent)
      
      console.log(`Added component: ${component.name}`)
    } catch (error) {
      console.error('Failed to add component:', error)
    }
  }, [currentProject, onAddComponent])

  const getCurrentAppContent = async (): Promise<string> => {
    // Default safe template
    return `import React from 'react'

function App() {
  return (
    <div className="min-h-screen bg-gray-50" data-webstudio-element="root">
      <div className="container mx-auto p-8" data-webstudio-element="container">
        <h1 className="text-3xl font-bold text-gray-900 mb-8" data-webstudio-element="title">
          Welcome to Aura
        </h1>
        {/* Components will be inserted here */}
      </div>
    </div>
  )
}

export default App`
  }

  const insertComponentSafely = (content: string, componentCode: string): string => {
    // Find the container div and insert inside it
    const containerRegex = /(<div[^>]*data-webstudio-element="container"[^>]*>)([\s\S]*?)(<\/div>)/
    const containerMatch = content.match(containerRegex)
    
    if (containerMatch) {
      const [fullMatch, openTag, innerContent, closeTag] = containerMatch
      
      // Insert component before the closing tag of the container, with proper indentation
      const newInnerContent = innerContent + `
        ${componentCode}
      `
      
      return content.replace(fullMatch, `${openTag}${newInnerContent}${closeTag}`)
    }
    
    // Fallback: find the root div and insert inside it
    const rootRegex = /(<div[^>]*data-webstudio-element="root"[^>]*>)([\s\S]*?)(<\/div>\s*\)\s*}\s*export default App)/
    const rootMatch = content.match(rootRegex)
    
    if (rootMatch) {
      const [fullMatch, openTag, innerContent, endPart] = rootMatch
      
      // Create a safe container if one doesn't exist
      const hasContainer = innerContent.includes('data-webstudio-element="container"')
      
      if (!hasContainer) {
        // Wrap component in a container
        const newInnerContent = `
      <div className="container mx-auto p-8" data-webstudio-element="container">
        ${componentCode}
      </div>
    `
        return content.replace(fullMatch, `${openTag}${newInnerContent}${endPart}`)
      } else {
        // Insert before the existing container
        const newInnerContent = `
      ${componentCode}
      ${innerContent.trim()}
    `
        return content.replace(fullMatch, `${openTag}${newInnerContent}${endPart}`)
      }
    }
    
    // Final fallback: wrap everything safely
    return `import React from 'react'

function App() {
  return (
    <div className="min-h-screen bg-gray-50" data-webstudio-element="root">
      <div className="container mx-auto p-8" data-webstudio-element="container">
        ${componentCode}
      </div>
    </div>
  )
}

export default App`
  }

  const handleCreateComponent = useCallback(() => {
    if (!selectedElement) {
      alert('Please select an element to create a component from')
      return
    }

    const componentName = prompt('Enter component name:')
    if (!componentName) return

    const newComponent: Component = {
      id: `custom-${Date.now()}`,
      name: componentName,
      category: 'custom',
      description: 'Custom component created from selection',
      code: generateComponentCode(selectedElement.element),
      preview: `🔧 ${componentName}`,
      tags: ['custom', selectedElement.tagName.toLowerCase()],
      favorite: false
    }

    setCustomComponents(prev => [...prev, newComponent])
  }, [selectedElement])

  const toggleFavorite = useCallback((componentId: string) => {
    setCustomComponents(prev => 
      prev.map(comp => 
        comp.id === componentId 
          ? { ...comp, favorite: !comp.favorite }
          : comp
      )
    )
  }, [])

  const generateComponentCode = (element: HTMLElement): string => {
    const tag = element.tagName.toLowerCase()
    const className = element.className
    const textContent = element.textContent
    
    return `<${tag}${className ? ` className="${className}"` : ''} data-webstudio-element="custom-${Date.now()}">
  ${textContent || 'Component content'}
</${tag}>`
  }

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 p-4">
        <div className="text-center">
          <div className="text-2xl mb-2">🧩</div>
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
          <h4 className="font-semibold text-white">Components</h4>
          <div className="flex gap-1">
            <button
              onClick={handleCreateComponent}
              className="btn-ghost p-1"
              title="Create Component from Selection"
              disabled={!selectedElement}
            >
              <Plus size={14} />
            </button>
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`btn-ghost p-1 ${showFavoritesOnly ? 'text-yellow-400' : ''}`}
              title="Show Favorites Only"
            >
              <Star size={14} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={14} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search components..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input-sm w-full pl-8"
          />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-1">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                selectedCategory === category.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {category.icon} {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Components Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {filteredComponents.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p className="text-sm">No components found</p>
            <p className="text-xs mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredComponents.map(component => (
              <div
                key={component.id}
                className="bg-gray-800 rounded-lg p-3 border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer group"
                onClick={() => handleAddComponent(component)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-white text-sm truncate">{component.name}</h5>
                    <p className="text-xs text-gray-400 mt-1">{component.description}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavorite(component.id)
                    }}
                    className={`btn-ghost p-1 ${component.favorite ? 'text-yellow-400' : 'text-gray-400'}`}
                    title="Toggle Favorite"
                  >
                    <Star size={12} />
                  </button>
                </div>
                
                <div className="bg-gray-900 rounded p-2 mb-2 text-xs font-mono text-gray-300">
                  {component.preview}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {component.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 bg-gray-700 text-gray-300 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigator.clipboard.writeText(component.code)
                      }}
                      className="btn-ghost p-1"
                      title="Copy Code"
                    >
                      <Copy size={12} />
                    </button>
                    {component.category === 'custom' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          // Edit component
                        }}
                        className="btn-ghost p-1"
                        title="Edit Component"
                      >
                        <Edit3 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Device Preview Buttons */}
      <div className="border-t border-gray-700 p-3">
        <div className="text-xs text-gray-400 mb-2">Preview Size</div>
        <div className="flex gap-2">
          <button className="btn-ghost p-2" title="Mobile">
            <Smartphone size={14} />
          </button>
          <button className="btn-ghost p-2" title="Tablet">
            <Tablet size={14} />
          </button>
          <button className="btn-ghost p-2" title="Desktop">
            <Monitor size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ComponentsPanel
