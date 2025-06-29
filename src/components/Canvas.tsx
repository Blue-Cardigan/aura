import React, { useRef, useEffect, useCallback } from 'react'
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

  const setupVisualEditing = useCallback(() => {
    const iframe = iframeRef.current
    if (!iframe || !iframe.contentDocument) return

    const iframeDoc = iframe.contentDocument
    
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
      }
      [data-webstudio-element]:hover {
        outline: 1px solid #6366f1 !important;
        outline-offset: 1px !important;
        cursor: pointer !important;
      }
      [data-webstudio-element] {
        position: relative;
      }
    `
    iframeDoc.head.appendChild(style)

    // Add click handlers for visual editing
    const elements = iframeDoc.querySelectorAll('[data-webstudio-element]')
    elements.forEach((element) => {
      const htmlElement = element as HTMLElement
      
      // Remove existing listeners
      const newElement = htmlElement.cloneNode(true) as HTMLElement
      htmlElement.parentNode?.replaceChild(newElement, htmlElement)

      newElement.addEventListener('click', (e) => {
        if (currentTool !== 'select') return
        
        e.preventDefault()
        e.stopPropagation()
        
        // Remove previous selections
        iframeDoc.querySelectorAll('[data-webstudio-selected]').forEach(el => {
          el.removeAttribute('data-webstudio-selected')
        })
        
        // Select current element
        newElement.setAttribute('data-webstudio-selected', 'true')
        
        // Create SelectedElement object
        const computedStyle = getComputedStyle(newElement)
        const selectedElement: SelectedElement = {
          id: newElement.id || '',
          className: newElement.className || '',
          tagName: newElement.tagName,
          textContent: newElement.textContent || '',
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
          element: newElement,
          dataAttribute: newElement.getAttribute('data-webstudio-element') || ''
        }
        
        onElementSelect(selectedElement)
      })
    })

    // Setup global WebStudio interface for the iframe
    const iframeWindow = iframe.contentWindow
    if (iframeWindow) {
      iframeWindow.webStudio = {
        selectElement: (element: HTMLElement) => {
          // This would be called from external scripts if needed
          element.click()
        },
        updateElement: (element: HTMLElement, property: string, value: string) => {
          if (property in element.style) {
            ;(element.style as any)[property] = value
          }
        }
      }
    }
  }, [onElementSelect, currentTool])

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const handleLoad = () => {
      // Wait a bit for the content to fully render
      setTimeout(setupVisualEditing, 500)
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
    <div className="flex-1 bg-gray-900 p-6 overflow-hidden">
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
