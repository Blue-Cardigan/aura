import React, { useRef, useEffect, useCallback, useState } from 'react'
import { Loader2 } from 'lucide-react'
import type { SelectedElement, Tool } from '../types'

interface CanvasProps {
  previewUrl: string | null
  zoomLevel: number
  isLoading: boolean
  loadingMessage: string
  onElementSelect: (element: SelectedElement) => void
  currentTool: Tool
}

const Canvas: React.FC<CanvasProps> = ({
  previewUrl,
  zoomLevel,
  isLoading,
  loadingMessage,
  onElementSelect,
  currentTool
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [visualEditingReady, setVisualEditingReady] = useState(false)
  const [editableElementsCount, setEditableElementsCount] = useState(0)

  const setupVisualEditing = useCallback(() => {
    const iframe = iframeRef.current
    if (!iframe || !iframe.contentDocument || !iframe.contentWindow) {
      console.log('Canvas: iframe not ready for visual editing setup')
      return
    }

    const iframeDoc = iframe.contentDocument
    const iframeWindow = iframe.contentWindow
    
    console.log('Canvas: Setting up visual editing...')
    
    // Add WebStudio styles to iframe
    let existingStyle = iframeDoc.getElementById('webstudio-styles')
    if (existingStyle) {
      existingStyle.remove()
    }

    const style = iframeDoc.createElement('style')
    style.id = 'webstudio-styles'
    style.textContent = `
      [data-webstudio-selected] {
        outline: 2px solid #6366f1 !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2) !important;
      }
      [data-webstudio-element]:hover {
        outline: 1px solid #6366f1 !important;
        outline-offset: 1px !important;
        cursor: pointer !important;
        background-color: rgba(99, 102, 241, 0.05) !important;
      }
      [data-webstudio-element] {
        position: relative;
        transition: all 0.15s ease;
      }
      .webstudio-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        z-index: 10000;
      }
    `
    iframeDoc.head.appendChild(style)

    // Wait a bit more for React app to fully render
    setTimeout(() => {
      // Find all elements with data-webstudio-element attributes
      const elements = iframeDoc.querySelectorAll('[data-webstudio-element]')
      console.log(`Canvas: Found ${elements.length} editable elements`)
      
      setEditableElementsCount(elements.length)
      
      if (elements.length === 0) {
        console.warn('Canvas: No elements with data-webstudio-element found. Make sure your app includes these attributes.')
        setVisualEditingReady(false)
        return
      }

      // Add click handlers for visual editing
      elements.forEach((element, index) => {
        const htmlElement = element as HTMLElement
        const dataAttr = htmlElement.getAttribute('data-webstudio-element')
        console.log(`Canvas: Setting up element ${index + 1}: ${htmlElement.tagName.toLowerCase()} [${dataAttr}]`)
        
        // Remove any existing webstudio event listeners
        const clonedElement = htmlElement.cloneNode(true) as HTMLElement
        htmlElement.parentNode?.replaceChild(clonedElement, htmlElement)
        
        // Add new event listeners
        clonedElement.addEventListener('click', (e) => {
          if (currentTool !== 'select') {
            console.log('Canvas: Click ignored - tool is not "select"')
            return
          }
          
          console.log(`Canvas: Element clicked: ${clonedElement.tagName.toLowerCase()} [${dataAttr}]`)
          
          e.preventDefault()
          e.stopPropagation()
          
          // Remove previous selections
          iframeDoc.querySelectorAll('[data-webstudio-selected]').forEach(el => {
            el.removeAttribute('data-webstudio-selected')
          })
          
          // Select current element
          clonedElement.setAttribute('data-webstudio-selected', 'true')
          
          // Get computed styles from the iframe's window context
          const computedStyle = iframeWindow.getComputedStyle(clonedElement)
          const selectedElement: SelectedElement = {
            id: clonedElement.id || '',
            className: clonedElement.className || '',
            tagName: clonedElement.tagName,
            textContent: clonedElement.textContent || '',
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
            element: clonedElement,
            dataAttribute: dataAttr || ''
          }
          
          console.log('Canvas: Element selected:', selectedElement)
          onElementSelect(selectedElement)
        })
        
        // Add hover effects
        clonedElement.addEventListener('mouseenter', () => {
          if (currentTool === 'select') {
            clonedElement.style.setProperty('--webstudio-hover', 'true')
          }
        })
        
        clonedElement.addEventListener('mouseleave', () => {
          clonedElement.style.removeProperty('--webstudio-hover')
        })
      })

      // Setup global WebStudio interface for the iframe
      if (iframeWindow) {
        ;(iframeWindow as any).webStudio = {
          selectElement: (element: HTMLElement) => {
            console.log('Canvas: External element selection requested')
            element.click()
          },
          updateElement: (element: HTMLElement, property: string, value: string) => {
            console.log(`Canvas: External element update: ${property} = ${value}`)
            if (property.startsWith('style.')) {
              const styleProp = property.replace('style.', '')
              if (styleProp in element.style) {
                ;(element.style as any)[styleProp] = value
              }
            }
          },
          getEditableElements: () => {
            return Array.from(iframeDoc.querySelectorAll('[data-webstudio-element]'))
          }
        }
        
        setVisualEditingReady(true)
        console.log('Canvas: Visual editing setup complete')
      }
    }, 1000) // Increased delay to ensure React app is fully rendered
  }, [onElementSelect, currentTool])

  useEffect(() => {
    // Reset visual editing state when preview URL changes
    setVisualEditingReady(false)
    setEditableElementsCount(0)
  }, [previewUrl])

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const handleLoad = () => {
      console.log('Canvas: iframe loaded, setting up visual editing...')
      // Initial setup with shorter delay
      setTimeout(setupVisualEditing, 1000)
      
      // Also set up a periodic check in case React app takes longer to render
      let attempts = 0
      const maxAttempts = 10
      const interval = setInterval(() => {
        attempts++
        if (attempts >= maxAttempts) {
          clearInterval(interval)
          console.warn('Canvas: Max attempts reached for visual editing setup')
          return
        }
        
        // Check if we have the required elements
        if (iframe.contentDocument) {
          const elements = iframe.contentDocument.querySelectorAll('[data-webstudio-element]')
          if (elements.length > 0) {
            console.log(`Canvas: Found ${elements.length} elements on attempt ${attempts}, setting up visual editing`)
            clearInterval(interval)
            setupVisualEditing()
          } else {
            console.log(`Canvas: Attempt ${attempts}: No elements found yet, retrying...`)
          }
        }
      }, 1000)
    }

    iframe.addEventListener('load', handleLoad)
    
    return () => {
      iframe.removeEventListener('load', handleLoad)
    }
  }, [setupVisualEditing])

  const canvasStyle = {
    transform: `scale(${zoomLevel / 100})`,
    transformOrigin: 'top left',
    width: `${10000 / zoomLevel}%`,
    height: `${10000 / zoomLevel}%`,
  }

  if (isLoading) {
    return (
      <div className="flex-1 bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-gray-400">{loadingMessage || 'Loading...'}</p>
        </div>
      </div>
    )
  }

  if (!previewUrl) {
    return (
      <div className="flex-1 bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg"></div>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Ready to Create</h3>
          <p className="text-gray-400">
            Create a new project or load an existing one to start designing with WebStudio.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-gray-900 p-6 overflow-hidden relative">
      {/* Visual Editing Status */}
      {previewUrl && (
        <div className="absolute top-4 right-4 z-10 bg-gray-800 rounded-lg px-3 py-2 text-sm">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              visualEditingReady ? 'bg-green-500' : 'bg-yellow-500'
            }`}></div>
            <span className="text-gray-300">
              {visualEditingReady 
                ? `Ready (${editableElementsCount} elements)` 
                : 'Setting up...'
              }
            </span>
          </div>
          {visualEditingReady && currentTool === 'select' && (
            <div className="text-xs text-gray-400 mt-1">
              Click elements to edit
            </div>
          )}
        </div>
      )}
      
      <div 
        ref={canvasRef}
        className="w-full h-full overflow-auto"
      >
        <div 
          className="bg-white rounded-lg shadow-2xl min-w-[320px] min-h-[568px] relative"
          style={canvasStyle}
        >
          <iframe
            ref={iframeRef}
            src={previewUrl}
            className="w-full h-full border-none rounded-lg webstudio-preview-frame"
            title="Project Preview"
          />
        </div>
      </div>
    </div>
  )
}

export default Canvas
