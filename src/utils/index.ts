import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function rgbToHex(rgb: string): string {
  if (!rgb || rgb === 'rgba(0, 0, 0, 0)' || rgb === 'transparent') return '#000000'
  
  const result = rgb.match(/\d+/g)
  if (!result || result.length < 3) return '#000000'
  
  return '#' + result.slice(0, 3).map(x => {
    const hex = parseInt(x).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

export function isValidUrl(string: string): boolean {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}

export function isGithubUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.hostname === 'github.com' && parsed.pathname.split('/').length >= 3
  } catch (_) {
    return false
  }
}

export function extractGithubInfo(url: string): { owner: string; repo: string } | null {
  try {
    const parsed = new URL(url)
    const pathParts = parsed.pathname.split('/').filter(Boolean)
    
    if (pathParts.length >= 2) {
      return {
        owner: pathParts[0],
        repo: pathParts[1]
      }
    }
  } catch (_) {
    // Invalid URL
  }
  
  return null
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T
  if (typeof obj === 'object') {
    const clonedObj: any = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
  return obj
}

export function getElementPath(element: HTMLElement): string {
  const path: string[] = []
  let current = element
  
  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase()
    
    if (current.id) {
      selector += `#${current.id}`
    } else if (current.className) {
      selector += `.${current.className.split(' ').join('.')}`
    }
    
    path.unshift(selector)
    current = current.parentElement!
  }
  
  return path.join(' > ')
}

export function getElementDepth(element: HTMLElement, root?: HTMLElement): number {
  let depth = 0
  let current = element.parentElement
  
  while (current && current !== (root || document.body)) {
    depth++
    current = current.parentElement
  }
  
  return depth
}

export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '')
}

export function getFileExtension(fileName: string): string {
  const ext = fileName.split('.').pop()
  return ext ? ext.toLowerCase() : ''
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text)
  } else {
    // Fallback for older browsers
    return new Promise((resolve, reject) => {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'absolute'
      textArea.style.left = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      try {
        document.execCommand('copy')
        textArea.remove()
        resolve()
      } catch (error) {
        textArea.remove()
        reject(error)
      }
    })
  }
}

export function downloadFile(content: string, fileName: string, mimeType: string = 'text/plain'): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function parseElementStyles(element: HTMLElement): Record<string, string> {
  const computedStyle = getComputedStyle(element)
  const styles: Record<string, string> = {}
  
  // Key CSS properties to extract
  const properties = [
    'display',
    'position',
    'width',
    'height',
    'margin',
    'padding',
    'fontSize',
    'fontWeight',
    'fontFamily',
    'color',
    'backgroundColor',
    'borderWidth',
    'borderStyle',
    'borderColor',
    'borderRadius',
    'textAlign',
    'lineHeight',
    'opacity',
    'transform',
    'transition'
  ]
  
  properties.forEach(property => {
    styles[property] = computedStyle.getPropertyValue(property)
  })
  
  return styles
}

export function validateCSSValue(property: string, value: string): boolean {
  // Create a temporary element to test the CSS property
  const testElement = document.createElement('div')
  const originalValue = testElement.style.getPropertyValue(property)
  
  try {
    testElement.style.setProperty(property, value)
    const newValue = testElement.style.getPropertyValue(property)
    
    // If the value was accepted, it should be different from the original
    return newValue !== originalValue || value === originalValue
  } catch (error) {
    return false
  }
}

export function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

export function unescapeHtml(html: string): string {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || div.innerText || ''
}

export function isMac(): boolean {
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0
}

export function getModifierKey(): string {
  return isMac() ? '⌘' : 'Ctrl'
}

export function createKeyboardShortcut(
  key: string,
  callback: () => void,
  modifiers: { ctrl?: boolean; alt?: boolean; shift?: boolean; meta?: boolean } = {}
): () => void {
  const handleKeyDown = (event: KeyboardEvent) => {
    const { ctrl = false, alt = false, shift = false, meta = false } = modifiers
    
    if (
      event.key.toLowerCase() === key.toLowerCase() &&
      event.ctrlKey === ctrl &&
      event.altKey === alt &&
      event.shiftKey === shift &&
      event.metaKey === meta
    ) {
      event.preventDefault()
      callback()
    }
  }
  
  document.addEventListener('keydown', handleKeyDown)
  
  // Return cleanup function
  return () => {
    document.removeEventListener('keydown', handleKeyDown)
  }
}
