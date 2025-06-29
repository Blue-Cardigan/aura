# WebStudio Aura

A professional web design tool that combines visual editing with direct code manipulation using WebContainers. Built with React, TypeScript, and Tailwind CSS.

## Features

🎨 **Visual Design Interface**
- Figma-like interface with professional tools
- Real-time element selection and editing
- Comprehensive properties panel
- Zoom controls and canvas manipulation

🚀 **WebContainer Integration**
- Run full development servers in the browser
- Real-time code generation and updates
- Support for multiple project templates
- Hot reload and live preview

📁 **Project Management**
- Create projects from templates (Vite + React, Vanilla JS, Next.js, Blank HTML)
- **NEW**: Generate real project files by copying vite-template
- Save and load projects locally
- Import projects from GitHub repositories
- File explorer with syntax highlighting

⚡ **Real-time Code Editing**
- Visual changes directly update underlying code
- Edit CSS properties through intuitive controls
- Live preview with instant feedback
- Element hierarchy and layers panel

🏗️ **Project Generation**
- Creates actual project directories in `generated-projects/`
- Copies and customizes the vite-template for each new project
- Maintains real file structure for editing outside WebStudio
- Automatic cleanup of old projects

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd aura
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
aura/
├── src/
│   ├── components/           # React components
│   │   ├── modals/          # Modal components
│   │   ├── Canvas.tsx       # Main canvas with iframe preview
│   │   ├── Sidebar.tsx      # Left sidebar with project management
│   │   ├── Toolbar.tsx      # Top toolbar with tools
│   │   ├── PropertiesPanel.tsx  # Right panel for element properties
│   │   └── WebStudio.tsx    # Main application component
│   ├── services/            # Business logic services
│   │   ├── filesystem/      # File system operations
│   │   ├── WebContainerService.ts  # WebContainer integration
│   │   └── ProjectService.ts       # Project management
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   └── index.css           # Global styles
├── generated-projects/      # Created project directories
└── ../vite-template/       # Template source for new projects
```

## Usage

### Creating a New Project

1. Click "New Project" in the sidebar
2. Choose a template (Vite + React recommended)
3. Enter a project name
4. Click "Create Project"

The tool will automatically:
- Copy the vite-template to `generated-projects/[project-name]-[timestamp]/`
- Update the package.json with the new project name
- Set up the project structure in WebContainer
- Install dependencies via WebContainer
- Start a development server
- Display the live preview

### Project Types

**Saved Projects**: Stored in browser localStorage for quick access
**Generated Projects**: Real directories in `generated-projects/` that you can edit with any code editor

### Visual Editing

1. Click on any element in the preview to select it
2. Use the Properties Panel to edit:
   - Layout properties (display, width, height)
   - Spacing (margin, padding)
   - Typography (font size, weight, color)
   - Background and border styles
   - Content (for text elements)

3. Changes are applied in real-time to both the preview and underlying code

### File System Integration

Generated projects create actual files that can be:
- Opened in VS Code or any editor
- Committed to Git repositories
- Deployed to hosting platforms
- Shared with other developers

**Project Location**: `/Users/cardigan/Desktop/aura/generated-projects/[project-name]/`

### Project Management

- **Save Project**: Saves the current project state to localStorage
- **Load Project**: Browse saved projects and generated projects
- **From GitHub**: Import public repositories (simulated in demo)
- **Delete Project**: Remove both saved references and generated files
- **Open Folder**: View generated project location

### Keyboard Shortcuts

- `Ctrl/Cmd + S`: Save project
- `Ctrl/Cmd + N`: New project
- `Ctrl/Cmd + O`: Open project

## Technical Details

### Project Generation Process

1. **Template Copying**: Copies all files from `vite-template/` to `generated-projects/[project-name]/`
2. **Customization**: Updates `package.json` with the project name
3. **WebContainer Mounting**: Loads the project structure into WebContainer
4. **Dependency Installation**: Runs `npm install` in the WebContainer
5. **Development Server**: Starts `npm run dev` for live preview

### File System Service

```typescript
// Copy vite-template to create a new project
const projectPath = await fileSystemService.copyViteTemplate(projectName)

// Update package.json
await fileSystemService.updatePackageJson(projectPath, projectName)

// Project is now available at:
// /Users/cardigan/Desktop/aura/generated-projects/[project-name]/
```

### WebContainer Integration

WebStudio uses WebContainers to run real development environments:

```typescript
// Initialize WebContainer
const webContainer = await WebContainer.boot()

// Mount project files (from generated project)
await webContainer.mount(project.files)

// Install dependencies
const installProcess = await webContainer.spawn('npm', ['install'])
await installProcess.exit

// Start dev server
const devProcess = await webContainer.spawn('npm', ['run', 'dev'])
```

### Visual Element Selection

Elements are marked with `data-webstudio-element` attributes:

```jsx
<div data-webstudio-element="container">
  <h1 data-webstudio-element="title">Hello World</h1>
</div>
```

### Real File Synchronization

When you make visual changes:
1. WebContainer files are updated immediately (for live preview)
2. Generated project files are synchronized (for persistence)
3. Both versions stay in sync for seamless development

## File Management

### Generated Project Structure

Each generated project contains:
```
project-name-timestamp/
├── package.json          # Customized with project name
├── index.html           # Entry point
├── vite.config.ts       # Vite configuration
├── tailwind.config.js   # Tailwind CSS config
├── tsconfig.json        # TypeScript config
└── src/
    ├── App.tsx          # Main React component
    ├── main.tsx         # React entry point
    ├── index.css        # Styles with WebStudio selection CSS
    └── vite-env.d.ts    # Type definitions
```

### Project Lifecycle

1. **Creation**: Copy template → Customize → Mount in WebContainer
2. **Editing**: Visual changes → WebContainer update → File sync
3. **Saving**: Persist state to localStorage
4. **Loading**: Read from generated-projects → Mount in WebContainer
5. **Deletion**: Remove localStorage reference + delete files

### Cleanup and Maintenance

- Automatic cleanup of projects older than 7 days
- Manual cleanup via `projectService.cleanupOldProjects()`
- Export projects as ZIP files
- File system validation and error handling

## Browser Requirements

- **Modern browsers** with WebContainer support
- **HTTPS or localhost** required for WebContainer API
- **Cross-Origin headers** configured for iframe communication
- **File System Access** (optional) for enhanced file operations

## Development

### Building

```bash
npm run build
```

### Type Checking

```bash
npm run type-check
```

### Production Deployment

The application requires specific headers for WebContainer to work:

```javascript
// vite.config.ts
export default defineConfig({
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
})
```

## Architecture

### Component Hierarchy

```
WebStudio (main app)
├── Sidebar (project management)
│   ├── ProjectModal
│   ├── LoadProjectModal (with tabs for saved/generated)
│   ├── GithubModal
│   ├── FileExplorer (shows project path)
│   └── LayersPanel
├── Toolbar (design tools)
├── Canvas (preview iframe)
├── PropertiesPanel (element editing)
└── StatusBar (status messages)
```

### Service Layer

- **WebContainerService**: Manages WebContainer lifecycle, file operations
- **ProjectService**: Handles project CRUD operations, templates, file generation
- **FileSystemService**: Real file system operations for project generation

### State Management

Uses React hooks for state management:
- `currentProject`: Active project data (includes projectPath)
- `selectedElement`: Currently selected DOM element
- `currentTool`: Active design tool
- `zoomLevel`: Canvas zoom state

## Limitations & Notes

- **File System Access**: Limited in browser environment (uses simulation for demo)
- **GitHub Integration**: Currently simulated (would require GitHub API in production)
- **Code Parsing**: Simplified JSX generation (would need full AST parsing for production)
- **Browser Support**: Requires modern browsers with WebContainer support
- **Performance**: Large projects may have slower load times

## Future Enhancements

- 🔧 Advanced code editor with Monaco Editor
- 🎨 Component library and design system integration
- 📱 Responsive design tools
- 🔄 Real-time collaboration
- 📊 Performance monitoring
- 🎯 Advanced layout tools (CSS Grid, Flexbox visualizer)
- 🔍 Element inspector with computed styles
- 📋 Copy/paste and undo/redo functionality
- 🚀 Production build and deployment integration
- 🔄 Git integration for version control
- 🌐 Cloud project storage and sharing

## Advanced Features

### Project Export

Export generated projects as ZIP files:
```typescript
await projectService.exportProject(project, 'zip')
```

### Project Cleanup

Automatically clean up old projects:
```typescript
await projectService.cleanupOldProjects() // Removes projects older than 7 days
```

### File System Operations

```typescript
// Check if project exists
const exists = await fileSystemService.fileExists(projectPath)

// Copy files
await fileSystemService.copyFile(source, destination)

// Read/write project files
const content = await fileSystemService.readFile(filePath)
await fileSystemService.writeFile(filePath, newContent)
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- [WebContainer](https://webcontainer.dev/) for in-browser development environments
- [Vite](https://vitejs.dev/) for fast build tooling
- [React](https://reactjs.org/) for the UI framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Lucide React](https://lucide.dev/) for icons
