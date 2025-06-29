// Project types
export interface Project {
  id: string
  name: string
  template?: string
  files: FileSystemTree
  projectPath?: string  // Path to the generated project directory
  createdAt: string
  updatedAt: string
  savedAt?: string
  githubUrl?: string
  githubBranch?: string
  components?: SavedComponent[]  // User-saved components
  designSystem?: DesignSystem   // Project's design system
  layers?: LayerNode[]          // Project layer structure
  history?: ProjectHistoryEntry[] // Project edit history
}

// WebContainer file system types
export interface FileSystemTree {
  [name: string]: FileNode | DirectoryNode
}

export interface FileNode {
  file: {
    contents: string
  }
}

export interface DirectoryNode {
  directory: FileSystemTree
}

// UI types
export type Tool = 'select' | 'hand' | 'rectangle' | 'circle' | 'text'

export interface SelectedElement {
  id: string
  className: string
  tagName: string
  textContent: string
  styles: ElementStyles
  element: HTMLElement
  dataAttribute: string
}

export interface ElementStyles {
  display: string
  width: string
  height: string
  margin: string
  padding: string
  fontSize: string
  fontWeight: string
  color: string
  backgroundColor: string
  borderWidth: string
  borderStyle: string
  borderColor: string
  borderRadius: string
  [key: string]: string
}

// Component props types
export interface WebStudioProps {
  className?: string
}

export interface CanvasProps {
  previewUrl: string | null
  zoomLevel: number
  isLoading: boolean
  loadingMessage: string
  onElementSelect: (element: SelectedElement) => void
  currentTool: Tool
}

export interface SidebarProps {
  currentProject: Project | null
  onCreateProject: (name: string, template: string) => void
  onLoadProject: (project: Project) => void
  onLoadFromGithub: (url: string, branch?: string) => void
  onSaveProject: () => void
  onElementSelect: (element: SelectedElement) => void
  selectedElement: SelectedElement | null
}

export interface ToolbarProps {
  currentTool: Tool
  onToolChange: (tool: Tool) => void
  zoomLevel: number
  onZoomChange: (zoom: number) => void
}

export interface PropertiesPanelProps {
  selectedElement: SelectedElement | null
  onElementUpdate: (property: string, value: string) => void
}

export interface StatusBarProps {
  message: string
  selectedElement: SelectedElement | null
  projectName?: string
}

export interface FileExplorerProps {
  project: Project | null
}

export interface LayersPanelProps {
  selectedElement: SelectedElement | null
  onElementSelect: (element: SelectedElement) => void
}

// Modal props
export interface ProjectModalProps {
  onSubmit: (name: string, template: string) => void
  onClose: () => void
}

export interface LoadProjectModalProps {
  onSubmit: (project: Project) => void
  onClose: () => void
}

export interface GithubModalProps {
  onSubmit: (url: string, branch?: string) => void
  onClose: () => void
}

// Service types
export interface WebContainerService {
  initialize(): Promise<void>
  startProject(project: Project): Promise<string>
  updateProject(project: Project): Promise<void>
  readFile(path: string): Promise<string>
  writeFile(path: string, content: string): Promise<void>
  getServerUrl(): string | null
  syncToFilesystem(project: Project): Promise<void>
  syncFileToFilesystem(projectPath: string, filePath: string, content: string): Promise<void>
  getProjectFiles(): Promise<string[]>
  createFile(path: string, content?: string): Promise<void>
  deleteFile(path: string): Promise<void>
  createDirectory(path: string): Promise<void>
  copyFile(sourcePath: string, destinationPath: string): Promise<void>
  renameFile(oldPath: string, newPath: string): Promise<void>
}

export interface ProjectService {
  createProject(name: string, template: string): Promise<Project>
  loadFromGithub(url: string, branch?: string): Promise<Project>
  saveProject(project: Project): void
  getSavedProjects(): Project[]
  updateElement(
    project: Project, 
    selectedElement: SelectedElement, 
    property: string, 
    value: string
  ): Promise<Project>
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// Event types
export interface ElementSelectEvent {
  element: SelectedElement
  timestamp: number
}

export interface ElementUpdateEvent {
  element: SelectedElement
  property: string
  oldValue: string
  newValue: string
  timestamp: number
}

export interface ProjectEvent {
  type: 'create' | 'load' | 'save' | 'update'
  project: Project
  timestamp: number
}

// File system types for browser environment
export interface FileSystemAPI {
  readFile(path: string, options?: { encoding?: string }): Promise<string | Uint8Array>
  writeFile(path: string, data: string | Uint8Array): Promise<void>
  readdir(path: string, options?: { withFileTypes?: boolean }): Promise<string[]>
  mkdir(path: string, options?: { recursive?: boolean }): Promise<void>
  stat(path: string): Promise<{ isFile(): boolean; isDirectory(): boolean }>
  exists(path: string): Promise<boolean>
  copyFile(src: string, dest: string): Promise<void>
  unlink(path: string): Promise<void>
  rmdir(path: string, options?: { recursive?: boolean }): Promise<void>
}

declare global {
  interface Window {
    fs?: FileSystemAPI
    webStudio?: {
      selectElement: (element: HTMLElement) => void
      updateElement: (element: HTMLElement, property: string, value: string) => void
    }
  }
}

// Constants
export const SUPPORTED_TEMPLATES = [
  'vite-react',
  'vite-vanilla', 
  'next',
  'blank'
] as const

export const SUPPORTED_TOOLS = [
  'select',
  'hand',
  'rectangle',
  'circle',
  'text'
] as const

export const DEFAULT_ELEMENT_STYLES: ElementStyles = {
  display: 'block',
  width: 'auto',
  height: 'auto',
  margin: '0',
  padding: '0',
  fontSize: '16px',
  fontWeight: 'normal',
  color: '#000000',
  backgroundColor: 'transparent',
  borderWidth: '0',
  borderStyle: 'none',
  borderColor: '#000000',
  borderRadius: '0'
}

// Project template configurations
export interface TemplateConfig {
  id: string
  name: string
  description: string
  files: FileSystemTree
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
  scripts: Record<string, string>
}

export const TEMPLATE_CONFIGS: Record<string, TemplateConfig> = {
  'vite-react': {
    id: 'vite-react',
    name: 'Vite + React + TypeScript',
    description: 'Modern React app with TypeScript and Tailwind CSS',
    files: {}, // Will be populated by ProjectService
    dependencies: {
      'react': '^18.2.0',
      'react-dom': '^18.2.0'
    },
    devDependencies: {
      '@types/react': '^18.2.66',
      '@types/react-dom': '^18.2.22',
      '@vitejs/plugin-react': '^4.2.1',
      'autoprefixer': '^10.4.19',
      'postcss': '^8.4.38',
      'tailwindcss': '^3.4.4',
      'typescript': '^5.2.2',
      'vite': '^5.2.0'
    },
    scripts: {
      'dev': 'vite',
      'build': 'vite build',
      'preview': 'vite preview'
    }
  },
  'vite-vanilla': {
    id: 'vite-vanilla',
    name: 'Vite + Vanilla JS',
    description: 'Simple vanilla JavaScript with Vite bundler',
    files: {},
    dependencies: {},
    devDependencies: {
      'vite': '^5.2.0'
    },
    scripts: {
      'dev': 'vite',
      'build': 'vite build',
      'preview': 'vite preview'
    }
  },
  'next': {
    id: 'next',
    name: 'Next.js',
    description: 'Full-stack React framework',
    files: {},
    dependencies: {
      'next': '^14.0.0',
      'react': '^18.2.0',
      'react-dom': '^18.2.0'
    },
    devDependencies: {
      '@types/node': '^20.0.0',
      '@types/react': '^18.2.66',
      '@types/react-dom': '^18.2.22',
      'typescript': '^5.2.2'
    },
    scripts: {
      'dev': 'next dev',
      'build': 'next build',
      'start': 'next start'
    }
  },
  'blank': {
    id: 'blank',
    name: 'Blank HTML',
    description: 'Empty HTML page to start from scratch',
    files: {},
    dependencies: {},
    devDependencies: {},
    scripts: {}
  }
}

// Error types
export class WebStudioError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'WebStudioError'
  }
}

export class WebContainerError extends WebStudioError {
  constructor(message: string, details?: any) {
    super(message, 'WEBCONTAINER_ERROR', details)
  }
}

export class ProjectError extends WebStudioError {
  constructor(message: string, details?: any) {
    super(message, 'PROJECT_ERROR', details)
  }
}

export class ElementError extends WebStudioError {
  constructor(message: string, details?: any) {
    super(message, 'ELEMENT_ERROR', details)
  }
}

export class FileSystemError extends WebStudioError {
  constructor(message: string, details?: any) {
    super(message, 'FILESYSTEM_ERROR', details)
  }
}

// Project generation settings
export interface ProjectGenerationOptions {
  templatePath: string
  outputPath: string
  projectName: string
  template: string
  overwrite?: boolean
  copyViteTemplate?: boolean
}

// File watcher types for real-time sync
export interface FileWatcherEvent {
  type: 'add' | 'change' | 'unlink'
  path: string
  content?: string
  timestamp: number
}

export interface FileWatcher {
  start(): void
  stop(): void
  on(event: 'change', callback: (event: FileWatcherEvent) => void): void
  off(event: 'change', callback: (event: FileWatcherEvent) => void): void
}

// Advanced project features
export interface ProjectMetadata {
  version: string
  author?: string
  description?: string
  tags?: string[]
  lastOpened?: string
  favorites?: boolean
  thumbnail?: string
}

export interface ExtendedProject extends Project {
  metadata?: ProjectMetadata
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  scripts?: Record<string, string>
}

// Export everything for easy imports
export * from './index'

// Enhanced Project Features
export interface SavedComponent {
  id: string
  name: string
  category: string
  description: string
  code: string
  preview: string
  tags: string[]
  favorite: boolean
  createdAt: string
  updatedAt: string
}

export interface DesignSystem {
  colors: ColorToken[]
  typography: TypographyToken[]
  spacing: SpacingToken[]
  borderRadius: { name: string; value: string }[]
  shadows: { name: string; value: string }[]
  version: string
  updatedAt: string
}

export interface ColorToken {
  name: string
  value: string
  description?: string
}

export interface TypographyToken {
  name: string
  fontSize: string
  fontWeight: string
  lineHeight: string
  description?: string
}

export interface SpacingToken {
  name: string
  value: string
  description?: string
}

export interface LayerNode {
  id: string
  name: string
  type: string
  element?: HTMLElement
  children: LayerNode[]
  visible: boolean
  locked: boolean
  dataAttribute: string
  depth: number
  parentId?: string
  order: number
}

export interface ProjectHistoryEntry {
  id: string
  timestamp: string
  action: string
  description: string
  data: any
  canRevert: boolean
}

// Enhanced component props
export interface LayersPanelProps {
  selectedElement: SelectedElement | null
  onElementSelect: (element: SelectedElement) => void
  currentProject: Project | null
  onCodeChange: (filePath: string, content: string) => void
  onProjectUpdate: (project: Project) => void
}

export interface ComponentsPanelProps {
  currentProject: Project | null
  onAddComponent: (filePath: string, content: string) => void
  selectedElement: SelectedElement | null
  onProjectUpdate: (project: Project) => void
}

export interface DesignSystemPanelProps {
  currentProject: Project | null
  onUpdateDesignSystem: (filePath: string, content: string) => void
  onProjectUpdate: (project: Project) => void
}
