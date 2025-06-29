import React, { useState, useCallback } from 'react'
import { 
  Upload, 
  Search, 
  Image, 
  FileText, 
  Download, 
  Trash2,
  Star,
  Grid,
  List,
  Filter,
  Copy,
  ExternalLink
} from 'lucide-react'
import type { Project } from '../types'

interface AssetsPanelProps {
  currentProject: Project | null
  onAddAsset: (filePath: string, content: string) => void
}

interface Asset {
  id: string
  name: string
  type: 'image' | 'icon' | 'font' | 'video' | 'document'
  url: string
  size: number
  format: string
  uploadedAt: Date
  favorite: boolean
  tags: string[]
  description?: string
}

const AssetsPanel: React.FC<AssetsPanelProps> = ({
  currentProject,
  onAddAsset
}) => {
  const [assets, setAssets] = useState<Asset[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  // Sample assets for demonstration
  const sampleAssets: Asset[] = [
    {
      id: 'hero-image-1',
      name: 'Hero Background',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800',
      size: 245000,
      format: 'JPG',
      uploadedAt: new Date('2024-01-15'),
      favorite: true,
      tags: ['hero', 'background', 'business'],
      description: 'Modern office space for hero sections'
    },
    {
      id: 'icon-check',
      name: 'Check Icon',
      type: 'icon',
      url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIwIDZMOSAxN0w0IDEyIiBzdHJva2U9IiMyMjIiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=',
      size: 856,
      format: 'SVG',
      uploadedAt: new Date('2024-01-10'),
      favorite: false,
      tags: ['icon', 'check', 'success'],
      description: 'Success checkmark icon'
    },
    {
      id: 'profile-pic-1',
      name: 'Profile Avatar',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1494790108755-2616b612b0bd?w=200',
      size: 45000,
      format: 'JPG',
      uploadedAt: new Date('2024-01-08'),
      favorite: true,
      tags: ['avatar', 'profile', 'person'],
      description: 'Professional headshot for testimonials'
    },
    {
      id: 'logo-icon',
      name: 'Brand Logo',
      type: 'icon',
      url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzY2NmVmYSIvPgo8dGV4dCB4PSIyMCIgeT0iMjYiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5XUzwvdGV4dD4KPC9zdmc+',
      size: 1200,
      format: 'SVG',
      uploadedAt: new Date('2024-01-12'),
      favorite: true,
      tags: ['logo', 'brand', 'identity'],
      description: 'Aura brand logo'
    }
  ]

  const [allAssets] = useState<Asset[]>(sampleAssets)

  const assetTypes = [
    { id: 'all', name: 'All', icon: '📎' },
    { id: 'image', name: 'Images', icon: '🖼️' },
    { id: 'icon', name: 'Icons', icon: '⭐' },
    { id: 'video', name: 'Videos', icon: '🎥' },
    { id: 'document', name: 'Documents', icon: '📄' }
  ]

  const filteredAssets = allAssets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesType = selectedType === 'all' || asset.type === selectedType
    const matchesFavorites = !showFavoritesOnly || asset.favorite
    
    return matchesSearch && matchesType && matchesFavorites
  })

  const handleUploadAsset = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*,video/*,.svg,.pdf,.doc,.docx'
    input.multiple = true
    
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files
      if (!files) return

      Array.from(files).forEach(file => {
        const reader = new FileReader()
        reader.onload = () => {
          const newAsset: Asset = {
            id: `asset-${Date.now()}-${Math.random()}`,
            name: file.name,
            type: getAssetType(file.type),
            url: reader.result as string,
            size: file.size,
            format: file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN',
            uploadedAt: new Date(),
            favorite: false,
            tags: [],
            description: `Uploaded ${file.name}`
          }
          
          setAssets(prev => [...prev, newAsset])
        }
        reader.readAsDataURL(file)
      })
    }
    
    input.click()
  }, [])

  const getAssetType = (mimeType: string): Asset['type'] => {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.includes('svg')) return 'icon'
    return 'document'
  }

  const handleInsertAsset = useCallback(async (asset: Asset) => {
    if (!currentProject) return

    try {
      // Generate the appropriate JSX based on asset type
      let assetCode = ''
      
      switch (asset.type) {
        case 'image':
          assetCode = `<img
  src="${asset.url}"
  alt="${asset.description || asset.name}"
  className="max-w-full h-auto rounded-lg"
  data-webstudio-element="image-${asset.id}"
/>`
          break
        case 'icon':
          if (asset.format === 'SVG') {
            assetCode = `<div
  className="w-6 h-6 inline-block"
  data-webstudio-element="icon-${asset.id}"
>
  <img src="${asset.url}" alt="${asset.name}" className="w-full h-full" />
</div>`
          } else {
            assetCode = `<img
  src="${asset.url}"
  alt="${asset.name}"
  className="w-6 h-6"
  data-webstudio-element="icon-${asset.id}"
/>`
          }
          break
        case 'video':
          assetCode = `<video
  src="${asset.url}"
  controls
  className="max-w-full h-auto rounded-lg"
  data-webstudio-element="video-${asset.id}"
>
  Your browser does not support the video tag.
</video>`
          break
        default:
          assetCode = `<a
  href="${asset.url}"
  download="${asset.name}"
  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
  data-webstudio-element="document-${asset.id}"
>
  📄 ${asset.name}
</a>`
      }

      // Get current App.tsx content and insert the asset
      const currentContent = await getCurrentAppContent()
      const updatedContent = insertAssetIntoComponent(currentContent, assetCode)
      
      await onAddAsset('/src/App.tsx', updatedContent)
      console.log(`Inserted asset: ${asset.name}`)
    } catch (error) {
      console.error('Failed to insert asset:', error)
    }
  }, [currentProject, onAddAsset])

  const getCurrentAppContent = async (): Promise<string> => {
    // In a real implementation, this would read from WebContainer
    return `import React from 'react'

function App() {
  return (
    <div className="min-h-screen bg-gray-50 p-8" data-webstudio-element="root">
      <div className="max-w-4xl mx-auto" data-webstudio-element="container">
        <h1 className="text-3xl font-bold text-gray-900 mb-8" data-webstudio-element="title">
          Welcome to Aura
        </h1>
        {/* Assets will be inserted here */}
      </div>
    </div>
  )
}

export default App`
  }

  const insertAssetIntoComponent = (content: string, assetCode: string): string => {
    // Find the container or root element and insert the asset
    const containerMatch = content.match(/data-webstudio-element="container"[^>]*>/)
    if (containerMatch) {
      const insertionPoint = content.indexOf('>', containerMatch.index! + containerMatch[0].length) + 1
      const before = content.substring(0, insertionPoint)
      const after = content.substring(insertionPoint)
      
      return `${before}
        ${assetCode}
      ${after}`
    }
    
    // Fallback: insert before closing div
    const lastClosingDiv = content.lastIndexOf('</div>')
    if (lastClosingDiv > 0) {
      const before = content.substring(0, lastClosingDiv)
      const after = content.substring(lastClosingDiv)
      
      return `${before}
        ${assetCode}
      ${after}`
    }
    
    return content
  }

  const toggleFavorite = useCallback((assetId: string) => {
    setAssets(prev => 
      prev.map(asset => 
        asset.id === assetId 
          ? { ...asset, favorite: !asset.favorite }
          : asset
      )
    )
  }, [])

  const deleteAsset = useCallback((assetId: string) => {
    if (confirm('Are you sure you want to delete this asset?')) {
      setAssets(prev => prev.filter(asset => asset.id !== assetId))
    }
  }, [])

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const copyAssetUrl = useCallback((url: string) => {
    navigator.clipboard.writeText(url)
    console.log('Asset URL copied to clipboard')
  }, [])

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 p-4">
        <div className="text-center">
          <div className="text-2xl mb-2">🖼️</div>
          <p className="text-sm">No project loaded</p>
        </div>
      </div>
    )
  }

  const displayAssets = [...allAssets, ...assets]

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-white">Assets</h4>
          <div className="flex gap-1">
            <button
              onClick={handleUploadAsset}
              className="btn-ghost p-1"
              title="Upload Assets"
            >
              <Upload size={14} />
            </button>
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`btn-ghost p-1 ${showFavoritesOnly ? 'text-yellow-400' : ''}`}
              title="Show Favorites Only"
            >
              <Star size={14} />
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="btn-ghost p-1"
              title={`Switch to ${viewMode === 'grid' ? 'List' : 'Grid'} View`}
            >
              {viewMode === 'grid' ? <List size={14} /> : <Grid size={14} />}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={14} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search assets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input-sm w-full pl-8"
          />
        </div>

        {/* Asset Types Filter */}
        <div className="flex flex-wrap gap-1">
          {assetTypes.map(type => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                selectedType === type.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {type.icon} {type.name}
            </button>
          ))}
        </div>
      </div>

      {/* Assets Grid/List */}
      <div className="flex-1 overflow-y-auto p-3">
        {filteredAssets.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <Upload size={48} className="mx-auto mb-4" />
            <p className="text-sm mb-2">No assets found</p>
            <button
              onClick={handleUploadAsset}
              className="btn btn-primary text-sm"
            >
              Upload your first asset
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-3">
            {filteredAssets.map(asset => (
              <div
                key={asset.id}
                className="bg-gray-800 rounded-lg p-3 border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer group"
                onClick={() => handleInsertAsset(asset)}
              >
                {/* Asset Preview */}
                <div className="aspect-square mb-2 bg-gray-900 rounded overflow-hidden flex items-center justify-center">
                  {asset.type === 'image' || asset.type === 'icon' ? (
                    <img
                      src={asset.url}
                      alt={asset.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-2xl">
                      {asset.type === 'video' ? '🎥' : '📄'}
                    </div>
                  )}
                </div>

                {/* Asset Info */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-white text-xs truncate flex-1">
                      {asset.name}
                    </h5>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(asset.id)
                      }}
                      className={`btn-ghost p-0.5 ${asset.favorite ? 'text-yellow-400' : 'text-gray-400'}`}
                    >
                      <Star size={10} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{asset.format}</span>
                    <span>{formatFileSize(asset.size)}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        copyAssetUrl(asset.url)
                      }}
                      className="btn-ghost p-1"
                      title="Copy URL"
                    >
                      <Copy size={10} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(asset.url, '_blank')
                      }}
                      className="btn-ghost p-1"
                      title="Open in New Tab"
                    >
                      <ExternalLink size={10} />
                    </button>
                    {assets.find(a => a.id === asset.id) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteAsset(asset.id)
                        }}
                        className="btn-ghost p-1 text-red-400"
                        title="Delete"
                      >
                        <Trash2 size={10} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAssets.map(asset => (
              <div
                key={asset.id}
                className="bg-gray-800 rounded-lg p-3 border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer group flex items-center gap-3"
                onClick={() => handleInsertAsset(asset)}
              >
                {/* Asset Thumbnail */}
                <div className="w-12 h-12 bg-gray-900 rounded overflow-hidden flex items-center justify-center flex-shrink-0">
                  {asset.type === 'image' || asset.type === 'icon' ? (
                    <img
                      src={asset.url}
                      alt={asset.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-lg">
                      {asset.type === 'video' ? '🎥' : '📄'}
                    </div>
                  )}
                </div>

                {/* Asset Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h5 className="font-medium text-white text-sm truncate">
                      {asset.name}
                    </h5>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(asset.id)
                      }}
                      className={`btn-ghost p-1 ${asset.favorite ? 'text-yellow-400' : 'text-gray-400'}`}
                    >
                      <Star size={12} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{asset.format} • {formatFileSize(asset.size)}</span>
                    <span>{asset.uploadedAt.toLocaleDateString()}</span>
                  </div>

                  {asset.description && (
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {asset.description}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      copyAssetUrl(asset.url)
                    }}
                    className="btn-ghost p-1"
                    title="Copy URL"
                  >
                    <Copy size={12} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open(asset.url, '_blank')
                    }}
                    className="btn-ghost p-1"
                    title="Open"
                  >
                    <ExternalLink size={12} />
                  </button>
                  {assets.find(a => a.id === asset.id) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteAsset(asset.id)
                      }}
                      className="btn-ghost p-1 text-red-400"
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Zone */}
      <div className="border-t border-gray-700 p-3">
        <button
          onClick={handleUploadAsset}
          className="w-full border-2 border-dashed border-gray-600 rounded-lg p-4 text-center hover:border-gray-500 transition-colors group"
        >
          <Upload size={20} className="mx-auto mb-2 text-gray-400 group-hover:text-gray-300" />
          <p className="text-sm text-gray-400 group-hover:text-gray-300">
            Drop files here or click to upload
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Images, videos, icons, documents
          </p>
        </button>
      </div>
    </div>
  )
}

export default AssetsPanel
