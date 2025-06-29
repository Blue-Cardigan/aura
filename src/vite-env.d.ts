/// <reference types="vite/client" />

declare module '@webcontainer/api' {
  export interface WebContainer {
    mount(tree: FileSystemTree): Promise<void>;
    spawn(command: string, args?: string[], options?: SpawnOptions): Promise<WebContainerProcess>;
    fs: {
      readFile(path: string, encoding?: string): Promise<string | Uint8Array>;
      writeFile(path: string, data: string | Uint8Array): Promise<void>;
      readdir(path: string): Promise<string[]>;
      mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
    };
    on(event: 'server-ready', callback: (port: number, url: string) => void): void;
    on(event: 'preview', callback: (previewInfo: { port: number; url: string }) => void): void;
  }

  export interface WebContainerProcess {
    exit: Promise<number>;
    output: ReadableStream;
    input: WritableStream;
  }

  export interface SpawnOptions {
    cwd?: string;
    env?: Record<string, string>;
  }

  export interface FileSystemTree {
    [name: string]: FileNode | DirectoryNode;
  }

  export interface FileNode {
    file: {
      contents: string;
    };
  }

  export interface DirectoryNode {
    directory: FileSystemTree;
  }

  export class WebContainer {
    static boot(): Promise<WebContainer>;
  }
}

// Global type extensions
declare global {
  interface Window {
    webStudio?: {
      selectElement: (element: HTMLElement) => void;
      updateElement: (element: HTMLElement, property: string, value: string) => void;
    };
  }
}

export {};
