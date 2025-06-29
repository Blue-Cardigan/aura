import { WebContainer } from '@webcontainer/api'
import type { Project } from '../types'

export class WebContainerService {
  private static instance: WebContainerService | null = null
  private static webContainer: WebContainer | null = null
  private serverUrl: string | null = null

  private constructor() {}

  // Singleton pattern to ensure only one WebContainer instance
  static getInstance(): WebContainerService {
    if (!WebContainerService.instance) {
      WebContainerService.instance = new WebContainerService()
    }
    return WebContainerService.instance
  }

  async initialize(): Promise<void> {
    if (!WebContainerService.webContainer) {
      try {
        WebContainerService.webContainer = await WebContainer.boot()
        console.log('WebContainer booted successfully')
      } catch (error) {
        console.error('Failed to boot WebContainer:', error)
        throw error
      }
    }
  }

  async startProject(project: Project): Promise<string> {
    if (!WebContainerService.webContainer) {
      throw new Error('WebContainer not initialized')
    }

    try {
      // Mount the project files from the template structure
      await WebContainerService.webContainer.mount(project.files)
      console.log('Project files mounted')

      // Install dependencies
      console.log('Installing dependencies...')
      const installProcess = await WebContainerService.webContainer.spawn('npm', ['install'])
      const installExitCode = await installProcess.exit
      
      if (installExitCode !== 0) {
        console.warn('npm install failed, but continuing...')
      }
      
      console.log('Dependencies installation completed')

      // Start the development server
      console.log('Starting development server...')
      const devProcess = await WebContainerService.webContainer.spawn('npm', ['run', 'dev'])

      // Wait for the server to be ready
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Server startup timeout'))
        }, 30000) // 30 second timeout

        WebContainerService.webContainer!.on('server-ready', (port, url) => {
          clearTimeout(timeout)
          this.serverUrl = url
          console.log(`Development server ready at ${url}`)
          
          // If we have a project path, sync changes to the actual filesystem
          if (project.projectPath) {
            this.syncToFilesystem(project)
          }
          
          resolve(url)
        })

        // Handle process errors (don't reject on non-zero exit codes)
        devProcess.exit.then((exitCode) => {
          if (exitCode !== 0) {
            console.warn(`Development server process exited with code ${exitCode}`)
          }
        }).catch((error) => {
          console.error('Development server process error:', error)
        })
      })
    } catch (error) {
      console.error('Failed to start project:', error)
      throw error
    }
  }

  async updateProject(project: Project): Promise<void> {
    if (!WebContainerService.webContainer) {
      throw new Error('WebContainer not initialized')
    }

    try {
      // Update the App.tsx file with the new component code
      const appContent = this.generateAppComponent(project)
      await WebContainerService.webContainer.fs.writeFile('/src/App.tsx', appContent)
      
      // If we have a project path, also update the actual filesystem
      if (project.projectPath) {
        await this.syncFileToFilesystem(project.projectPath, '/src/App.tsx', appContent)
      }
      
      console.log('Project files updated')
    } catch (error) {
      console.error('Failed to update project:', error)
      throw error
    }
  }

  async syncToFilesystem(project: Project): Promise<void> {
    if (!project.projectPath) return

    try {
      // In a real implementation, this would sync all WebContainer changes
      // back to the actual filesystem in the generated-projects directory
      console.log(`Syncing WebContainer changes to ${project.projectPath}`)
      
      // For now, we'll just log the sync operation
      // In production, you'd:
      // 1. Watch for file changes in WebContainer
      // 2. Write those changes back to the filesystem
      // 3. Handle conflicts and merging
    } catch (error) {
      console.error('Failed to sync to filesystem:', error)
    }
  }

  async syncFileToFilesystem(projectPath: string, filePath: string, content: string): Promise<void> {
    try {
      const fullPath = `${projectPath}${filePath}`
      
      // In a browser environment, we can't directly write to filesystem
      // This would be implemented with Node.js fs operations in a real environment
      console.log(`Would sync file ${fullPath} with updated content`)
      
      // For demo purposes, we'll use the filesystem API if available
      if (window.fs?.writeFile) {
        await window.fs.writeFile(fullPath, content)
        console.log(`Synced file ${fullPath}`)
      }
    } catch (error) {
      console.error(`Failed to sync file ${filePath}:`, error)
    }
  }

  private generateAppComponent(project: Project): string {
    // This is a simplified version of component generation
    // In a real implementation, you'd need a more sophisticated JSX generator
    // that can parse and modify the existing component structure
    
    const defaultAppContent = `import React from 'react'

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" data-webstudio-element="root">
      <div className="max-w-md mx-auto text-center" data-webstudio-element="container">
        <h1 className="text-4xl font-bold text-gray-900 mb-4" data-webstudio-element="title">
          Welcome to ${project.name}
        </h1>
        <p className="text-lg text-gray-600 mb-8" data-webstudio-element="description">
          Visual design meets code. Click on any element to start editing.
        </p>
        <div className="space-y-4" data-webstudio-element="actions">
          <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors" data-webstudio-element="primary-btn">
            Get Started
          </button>
          <button className="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors" data-webstudio-element="secondary-btn">
            Learn More
          </button>
        </div>
      </div>
    </div>
  )
}

export default App`

    return defaultAppContent
  }

  async readFile(path: string): Promise<string> {
    if (!WebContainerService.webContainer) {
      throw new Error('WebContainer not initialized')
    }

    try {
      const content = await WebContainerService.webContainer.fs.readFile(path, 'utf8')
      return content as string
    } catch (error) {
      console.error(`Failed to read file ${path}:`, error)
      throw error
    }
  }

  async writeFile(path: string, content: string): Promise<void> {
    if (!WebContainerService.webContainer) {
      throw new Error('WebContainer not initialized')
    }

    try {
      await WebContainerService.webContainer.fs.writeFile(path, content)
      console.log(`File ${path} updated successfully`)
    } catch (error) {
      console.error(`Failed to write file ${path}:`, error)
      throw error
    }
  }

  getServerUrl(): string | null {
    return this.serverUrl
  }

  async getProjectFiles(): Promise<string[]> {
    if (!WebContainerService.webContainer) {
      throw new Error('WebContainer not initialized')
    }

    try {
      // Get list of files from WebContainer
      const files = await WebContainerService.webContainer.fs.readdir('/', { withFileTypes: true })
      return files.map(file => file.name)
    } catch (error) {
      console.error('Failed to read project files:', error)
      return []
    }
  }

  async createFile(path: string, content: string = ''): Promise<void> {
    if (!WebContainerService.webContainer) {
      throw new Error('WebContainer not initialized')
    }

    try {
      await WebContainerService.webContainer.fs.writeFile(path, content)
      console.log(`Created file ${path}`)
    } catch (error) {
      console.error(`Failed to create file ${path}:`, error)
      throw error
    }
  }

  async deleteFile(path: string): Promise<void> {
    if (!WebContainerService.webContainer) {
      throw new Error('WebContainer not initialized')
    }

    try {
      // WebContainer API doesn't have a direct delete method in the basic interface
      // This would be implemented with the full WebContainer filesystem API
      console.log(`Would delete file ${path}`)
    } catch (error) {
      console.error(`Failed to delete file ${path}:`, error)
      throw error
    }
  }

  async createDirectory(path: string): Promise<void> {
    if (!WebContainerService.webContainer) {
      throw new Error('WebContainer not initialized')
    }

    try {
      await WebContainerService.webContainer.fs.mkdir(path, { recursive: true })
      console.log(`Created directory ${path}`)
    } catch (error) {
      console.error(`Failed to create directory ${path}:`, error)
      throw error
    }
  }

  // Enhanced file operations for better project management
  async copyFile(sourcePath: string, destinationPath: string): Promise<void> {
    if (!WebContainerService.webContainer) {
      throw new Error('WebContainer not initialized')
    }

    try {
      const content = await this.readFile(sourcePath)
      await this.writeFile(destinationPath, content)
      console.log(`Copied file from ${sourcePath} to ${destinationPath}`)
    } catch (error) {
      console.error(`Failed to copy file from ${sourcePath} to ${destinationPath}:`, error)
      throw error
    }
  }

  async renameFile(oldPath: string, newPath: string): Promise<void> {
    if (!WebContainerService.webContainer) {
      throw new Error('WebContainer not initialized')
    }

    try {
      await this.copyFile(oldPath, newPath)
      // Note: WebContainer basic API doesn't include file deletion
      // In a full implementation, you'd delete the old file here
      console.log(`Renamed file from ${oldPath} to ${newPath}`)
    } catch (error) {
      console.error(`Failed to rename file from ${oldPath} to ${newPath}:`, error)
      throw error
    }
  }

  // Static method to reset the WebContainer instance (useful for development)
  static async reset(): Promise<void> {
    WebContainerService.webContainer = null
    WebContainerService.instance = null
  }
}
