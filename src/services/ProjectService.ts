import type { Project, SelectedElement, FileSystemTree } from '../types'
import { generateId, sanitizeFileName } from '../utils'
import FileSystemService from './filesystem/FileSystemService'

export class ProjectService {
  private readonly STORAGE_KEY = 'webstudio-projects'
  private readonly PROJECT_REFERENCES_KEY = 'webstudio-project-references'
  private fileSystemService: FileSystemService

  constructor() {
    this.fileSystemService = new FileSystemService()
  }

  async createProject(name: string, template: string): Promise<Project> {
    const projectId = generateId()
    const sanitizedName = sanitizeFileName(name)
    
    try {
      // Copy the vite-template to generate a real project
      const projectPath = await this.fileSystemService.copyViteTemplate(sanitizedName)
      
      // Get the file structure for WebContainer
      const files = this.getTemplateFiles(template)
      
      const project: Project = {
        id: projectId,
        name: sanitizedName,
        template,
        files,
        projectPath,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // Save project reference
      this.saveProjectReference(project)

      console.log(`Created project "${sanitizedName}" at: ${projectPath}`)
      return project

    } catch (error) {
      console.error('Failed to create project:', error)
      
      // Fallback to in-memory project if file system fails
      const files = this.getTemplateFiles(template)
      const project: Project = {
        id: projectId,
        name: sanitizedName,
        template,
        files,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      return project
    }
  }

  async loadFromGithub(url: string, branch?: string): Promise<Project> {
    const projectName = url.split('/').pop() || 'GitHub Project'
    const projectId = generateId()
    const sanitizedName = sanitizeFileName(projectName)
    
    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    try {
      // Copy the vite-template as a starting point for GitHub projects
      const projectPath = await this.fileSystemService.copyViteTemplate(sanitizedName)
      
      // In a real implementation, you would:
      // 1. Clone the GitHub repository
      // 2. Extract the files
      // 3. Set up the project structure
      
      const files = this.getTemplateFiles('vite-react')
      
      const project: Project = {
        id: projectId,
        name: sanitizedName,
        template: 'vite-react',
        files,
        projectPath,
        githubUrl: url,
        githubBranch: branch,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      this.saveProjectReference(project)
      console.log(`Loaded GitHub project "${sanitizedName}" at: ${projectPath}`)
      return project

    } catch (error) {
      console.error('Failed to load from GitHub:', error)
      
      // Fallback to in-memory project
      const files = this.getTemplateFiles('vite-react')
      const project: Project = {
        id: projectId,
        name: sanitizedName,
        template: 'vite-react',
        files,
        githubUrl: url,
        githubBranch: branch,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      return project
    }
  }

  saveProject(project: Project): void {
    const savedProjects = this.getSavedProjects()
    
    // Update existing project or add new one
    const existingIndex = savedProjects.findIndex(p => p.id === project.id)
    const updatedProject = {
      ...project,
      updatedAt: new Date().toISOString(),
      savedAt: new Date().toISOString()
    }
    
    if (existingIndex >= 0) {
      savedProjects[existingIndex] = updatedProject
    } else {
      savedProjects.push(updatedProject)
    }
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(savedProjects))
    console.log(`Saved project "${project.name}"`)
  }

  private saveProjectReference(project: Project): void {
    // Save a reference to the generated project for future loading
    const references = this.getProjectReferences()
    const reference = {
      id: project.id,
      name: project.name,
      projectPath: project.projectPath,
      template: project.template,
      createdAt: project.createdAt
    }
    
    references.push(reference)
    localStorage.setItem(this.PROJECT_REFERENCES_KEY, JSON.stringify(references))
  }

  private getProjectReferences(): Array<{
    id: string
    name: string
    projectPath?: string
    template?: string
    createdAt: string
  }> {
    try {
      const references = localStorage.getItem(this.PROJECT_REFERENCES_KEY)
      return references ? JSON.parse(references) : []
    } catch (error) {
      console.error('Failed to load project references:', error)
      return []
    }
  }

  getSavedProjects(): Project[] {
    try {
      const projects = localStorage.getItem(this.STORAGE_KEY)
      return projects ? JSON.parse(projects) : []
    } catch (error) {
      console.error('Failed to load saved projects:', error)
      return []
    }
  }

  async getGeneratedProjects(): Promise<Project[]> {
    try {
      const references = this.getProjectReferences()
      const projects: Project[] = []

      for (const ref of references) {
        if (ref.projectPath) {
          // Check if the project still exists
          const exists = await this.fileSystemService.fileExists(`${ref.projectPath}/package.json`)
          if (exists) {
            const files = this.getTemplateFiles(ref.template || 'vite-react')
            const project: Project = {
              id: ref.id,
              name: ref.name,
              template: ref.template,
              files,
              projectPath: ref.projectPath,
              createdAt: ref.createdAt,
              updatedAt: ref.createdAt
            }
            projects.push(project)
          }
        }
      }

      return projects
    } catch (error) {
      console.error('Failed to get generated projects:', error)
      return []
    }
  }

  async deleteProject(projectId: string): Promise<void> {
    try {
      // Remove from saved projects
      const savedProjects = this.getSavedProjects()
      const filteredProjects = savedProjects.filter(p => p.id !== projectId)
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredProjects))

      // Remove from project references and delete files
      const references = this.getProjectReferences()
      const projectRef = references.find(ref => ref.id === projectId)
      
      if (projectRef?.projectPath) {
        await this.fileSystemService.deleteDirectory(projectRef.projectPath)
        console.log(`Deleted project files at: ${projectRef.projectPath}`)
      }

      const filteredReferences = references.filter(ref => ref.id !== projectId)
      localStorage.setItem(this.PROJECT_REFERENCES_KEY, JSON.stringify(filteredReferences))

      console.log(`Deleted project ${projectId}`)
    } catch (error) {
      console.error('Failed to delete project:', error)
      throw error
    }
  }

  async updateElement(
    project: Project, 
    selectedElement: SelectedElement, 
    property: string, 
    value: string
  ): Promise<Project> {
    try {
      // Update the actual project files on disk if we have a project path
      if (project.projectPath) {
        await this.updateProjectFile(project.projectPath, selectedElement, property, value)
      }
      
      // Update the project object
      const updatedProject = {
        ...project,
        updatedAt: new Date().toISOString()
      }
      
      console.log(`Updated element ${selectedElement.tagName} property ${property} to ${value}`)
      
      return updatedProject
    } catch (error) {
      console.error('Failed to update element:', error)
      throw error
    }
  }

  private async updateProjectFile(
    projectPath: string,
    selectedElement: SelectedElement,
    property: string,
    value: string
  ): Promise<void> {
    try {
      // In a real implementation, this would:
      // 1. Parse the React component files (using @babel/parser or similar)
      // 2. Find the specific element by its data-webstudio-element attribute
      // 3. Update the element's properties in the AST
      // 4. Generate new code using @babel/generator
      // 5. Write the updated code back to the file

      const appFilePath = `${projectPath}/src/App.tsx`
      
      // For now, we'll demonstrate with a simple string replacement approach
      // This is not production-ready but shows the concept
      if (await this.fileSystemService.fileExists(appFilePath)) {
        const content = await this.fileSystemService.readFile(appFilePath)
        
        // Simple demonstration - in practice you'd use proper AST manipulation
        let updatedContent = content
        
        if (property.startsWith('style.')) {
          const styleProperty = property.replace('style.', '')
          console.log(`Would update ${styleProperty} to ${value} for element ${selectedElement.dataAttribute}`)
          
          // Here you would implement proper JSX/TSX parsing and modification
          // For example, using @babel/parser, @babel/traverse, and @babel/generator
        } else if (property === 'textContent') {
          console.log(`Would update text content to "${value}" for element ${selectedElement.dataAttribute}`)
        } else {
          console.log(`Would update attribute ${property} to ${value} for element ${selectedElement.dataAttribute}`)
        }
        
        // Write the updated content back (commented out for safety in demo)
        // await this.fileSystemService.writeFile(appFilePath, updatedContent)
      }
    } catch (error) {
      console.error('Failed to update project file:', error)
      // Don't throw here as it shouldn't break the visual editing experience
    }
  }

  async exportProject(project: Project, format: 'zip' | 'tar' = 'zip'): Promise<void> {
    if (project.projectPath) {
      await this.fileSystemService.exportProject(project.projectPath, format)
    } else {
      console.warn('Cannot export project without projectPath')
    }
  }

  async cleanupOldProjects(): Promise<void> {
    await this.fileSystemService.cleanupOldProjects()
  }

  private getTemplateFiles(template: string): FileSystemTree {
    switch (template) {
      case 'vite-react':
        return this.getViteReactTemplate()
      case 'vite-vanilla':
        return this.getViteVanillaTemplate()
      case 'next':
        return this.getNextTemplate()
      case 'blank':
        return this.getBlankTemplate()
      default:
        return this.getViteReactTemplate()
    }
  }

  private getViteReactTemplate(): FileSystemTree {
    return {
      'package.json': {
        file: {
          contents: JSON.stringify({
            name: 'aura-project',
            private: true,
            version: '0.0.0',
            type: 'module',
            scripts: {
              dev: 'vite',
              build: 'vite build',
              preview: 'vite preview'
            },
            dependencies: {
              react: '^18.2.0',
              'react-dom': '^18.2.0'
            },
            devDependencies: {
              '@types/react': '^18.2.66',
              '@types/react-dom': '^18.2.22',
              '@vitejs/plugin-react': '^4.2.1',
              autoprefixer: '^10.4.19',
              postcss: '^8.4.38',
              tailwindcss: '^3.4.4',
              typescript: '^5.2.2',
              vite: '^5.2.0'
            }
          }, null, 2)
        }
      },
      'index.html': {
        file: {
          contents: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Aura Project</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
        }
      },
      'vite.config.ts': {
        file: {
          contents: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`
        }
      },
      'tailwind.config.js': {
        file: {
          contents: `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`
        }
      },
      'postcss.config.js': {
        file: {
          contents: `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`
        }
      },
      'tsconfig.json': {
        file: {
          contents: JSON.stringify({
            compilerOptions: {
              target: 'ES2020',
              useDefineForClassFields: true,
              lib: ['ES2020', 'DOM', 'DOM.Iterable'],
              module: 'ESNext',
              skipLibCheck: true,
              moduleResolution: 'bundler',
              allowImportingTsExtensions: true,
              resolveJsonModule: true,
              isolatedModules: true,
              noEmit: true,
              jsx: 'react-jsx',
              strict: true,
              noUnusedLocals: true,
              noUnusedParameters: true,
              noFallthroughCasesInSwitch: true
            },
            include: ['src'],
            references: [{ path: './tsconfig.node.json' }]
          }, null, 2)
        }
      },
      'tsconfig.node.json': {
        file: {
          contents: JSON.stringify({
            compilerOptions: {
              composite: true,
              skipLibCheck: true,
              module: 'ESNext',
              moduleResolution: 'bundler',
              allowSyntheticDefaultImports: true
            },
            include: ['vite.config.ts']
          }, null, 2)
        }
      },
      src: {
        directory: {
          'main.tsx': {
            file: {
              contents: `import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)`
            }
          },
          'App.tsx': {
            file: {
              contents: `import React from 'react'

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" data-webstudio-element="root">
      <div className="max-w-md mx-auto text-center" data-webstudio-element="container">
        <h1 className="text-4xl font-bold text-gray-900 mb-4" data-webstudio-element="title">
          Welcome to Aura
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
            }
          },
          'index.css': {
            file: {
              contents: `@tailwind base;
@tailwind components;
@tailwind utilities;

/* WebStudio selection styles */
[data-webstudio-selected] {
  outline: 2px solid #6366f1 !important;
  outline-offset: 2px;
}

[data-webstudio-element]:hover {
  outline: 1px solid #6366f1;
  outline-offset: 1px;
}

[data-webstudio-element] {
  position: relative;
}`
            }
          },
          'vite-env.d.ts': {
            file: {
              contents: `/// <reference types="vite/client" />`
            }
          }
        }
      }
    }
  }

  private getViteVanillaTemplate(): FileSystemTree {
    return {
      'package.json': {
        file: {
          contents: JSON.stringify({
            name: 'aura-vanilla-project',
            private: true,
            version: '0.0.0',
            type: 'module',
            scripts: {
              dev: 'vite',
              build: 'vite build',
              preview: 'vite preview'
            },
            devDependencies: {
              vite: '^5.2.0'
            }
          }, null, 2)
        }
      },
      'index.html': {
        file: {
          contents: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Aura Vanilla Project</title>
    <link rel="stylesheet" href="/style.css">
  </head>
  <body>
    <div id="app" data-webstudio-element="root">
      <h1 data-webstudio-element="title">Hello WebStudio!</h1>
      <p data-webstudio-element="description">Start editing to see changes.</p>
    </div>
    <script type="module" src="/main.js"></script>
  </body>
</html>`
        }
      },
      'style.css': {
        file: {
          contents: `body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f5f5f5;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

[data-webstudio-selected] {
  outline: 2px solid #6366f1 !important;
  outline-offset: 2px;
}

[data-webstudio-element]:hover {
  outline: 1px solid #6366f1;
  outline-offset: 1px;
}

[data-webstudio-element] {
  position: relative;
}`
        }
      },
      'main.js': {
        file: {
          contents: `console.log('WebStudio Vanilla Project loaded!')`
        }
      }
    }
  }

  private getNextTemplate(): FileSystemTree {
    // Simplified Next.js template - would be more complex in production
    return this.getViteReactTemplate()
  }

  private getBlankTemplate(): FileSystemTree {
    return {
      'index.html': {
        file: {
          contents: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Aura Blank Project</title>
    <style>
      [data-webstudio-selected] {
        outline: 2px solid #6366f1 !important;
        outline-offset: 2px;
      }
      [data-webstudio-element]:hover {
        outline: 1px solid #6366f1;
        outline-offset: 1px;
      }
      [data-webstudio-element] {
        position: relative;
      }
    </style>
  </head>
  <body>
    <div data-webstudio-element="root">
      <h1 data-webstudio-element="title">Blank Project</h1>
      <p data-webstudio-element="description">Start building your project here.</p>
    </div>
  </body>
</html>`
        }
      }
    }
  }
}
