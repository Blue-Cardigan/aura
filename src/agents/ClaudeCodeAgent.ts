import { useAppStore } from '../store';
import type { CanvasElement, ProjectFile } from '../store';
import { mountFiles, getWebContainerInstance } from '../webcontainer';

export interface ClaudeCodeAgentConfig {
  cliPath?: string;
  workingDirectory?: string;
}

export interface AgentTask {
  id: string;
  type: 'code-generation' | 'code-improvement' | 'design-suggestion' | 'bug-fix' | 'refactor' | 'component-generation' | 'performance-optimization' | 'test-generation' | 'code-explanation';
  description: string;
  context: {
    files?: ProjectFile[];
    selectedElement?: CanvasElement;
    userPrompt: string;
    currentCode?: string;
    componentName?: string;
    props?: any;
  };
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: {
    code?: string;
    suggestions?: string[];
    files?: ProjectFile[];
    explanation?: string;
    tests?: string;
    performance?: string;
    projectId?: string;
  };
  createdAt: Date;
  completedAt?: Date;
}

export class ClaudeCodeAgent {
  private static instance: ClaudeCodeAgent;
  private config: ClaudeCodeAgentConfig;
  private tasks: Map<string, AgentTask> = new Map();

  constructor(config: ClaudeCodeAgentConfig = {}) {
    this.config = {
      cliPath: 'claude',
      workingDirectory: '.',
      ...config
    };
  }

  public static getInstance(config?: ClaudeCodeAgentConfig): ClaudeCodeAgent {
    if (!ClaudeCodeAgent.instance) {
      ClaudeCodeAgent.instance = new ClaudeCodeAgent(config);
    }
    return ClaudeCodeAgent.instance;
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async executeClaudeCodeCLI(
    prompt: string, 
    projectFiles?: ProjectFile[], 
    projectPath?: string,
    onStreamMessage?: (message: { type: string; text?: string; data?: any }) => void
  ): Promise<any> {
    console.log('🤖 Executing Claude Code CLI with prompt:', prompt);

    // Use streaming if callback is provided
    if (onStreamMessage) {
      return this.executeStreamingCLI(prompt, projectFiles, projectPath, onStreamMessage);
    }

    try {
      const response = await fetch('/api/claude-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          workingDirectory: projectPath || this.config.workingDirectory,
          cliPath: this.config.cliPath,
          projectFiles: projectFiles || []
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Claude Code CLI API error: ${response.status} - ${errorText || 'Unknown error'}`);
      }

      const result = await response.json();
      
      // Update WebContainer files with the generated project
      if (result?.files && result.files.length > 0) {
        await this.updateWebContainerFiles(result.files);
      }

      return result;
    } catch (error) {
      console.error('Failed to execute Claude Code CLI:', error);
      throw error;
    }
  }

  private async executeStreamingCLI(
    prompt: string,
    projectFiles?: ProjectFile[],
    projectPath?: string,
    onStreamMessage?: (message: { type: string; text?: string; data?: any }) => void
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await fetch('/api/claude-code/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            workingDirectory: projectPath || this.config.workingDirectory,
            cliPath: this.config.cliPath,
            projectFiles: projectFiles || []
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Failed to get response reader');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.trim() === '') continue;
              
              if (line.startsWith('event: ')) {
                // Skip event type lines
                continue;
              }
              
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.substring(6));
                  
                  // Handle different message types from server
                  if (data.type === 'usage_limit' || data.type === 'auth_error' || 
                      data.type === 'install_error' || data.type === 'progress') {
                    if (onStreamMessage) {
                      onStreamMessage({ type: data.type, text: data.text, data });
                    }
                  } else if (data.message && !data.text) {
                    if (onStreamMessage) {
                      onStreamMessage({ type: 'status', text: data.message, data });
                    }
                  } else if (data.text) {
                    if (onStreamMessage) {
                      onStreamMessage({ type: 'output', text: data.text, data });
                    }
                  } else if (data.success !== undefined) {
                    // Final result
                    if (data.files && data.files.length > 0) {
                      await this.updateWebContainerFiles(data.files);
                    }
                    
                    if (onStreamMessage) {
                      onStreamMessage({ type: 'complete', data });
                    }
                    
                    resolve(data);
                    return;
                  } else if (data.error) {
                    if (onStreamMessage) {
                      onStreamMessage({ type: 'error', data });
                    }
                    reject(new Error(data.error));
                    return;
                  }
                } catch (parseError) {
                  console.error('Failed to parse SSE data:', parseError);
                }
              }
            }
          }

          // If we get here without a complete event, it might be an incomplete response
          if (onStreamMessage) {
            onStreamMessage({ type: 'error', data: { error: 'Stream ended unexpectedly' } });
          }
          reject(new Error('Stream ended unexpectedly'));

        } finally {
          reader.releaseLock();
        }

      } catch (error) {
        console.error('Streaming error:', error);
        reject(error);
      }
    });
  }

  private async updateWebContainerFiles(files: ProjectFile[]): Promise<void> {
    try {
      const webContainer = getWebContainerInstance();
      if (webContainer) {
        console.log('📁 Updating WebContainer with', files.length, 'files from Claude Code CLI');
        await mountFiles(webContainer, files);
        
        // Update the store with the new files
        const { updateProject } = useAppStore.getState();
        updateProject({ files });
        
        console.log('✅ WebContainer updated successfully');
      } else {
        console.warn('⚠️ WebContainer not available, files not mounted');
      }
    } catch (error) {
      console.error('❌ Failed to update WebContainer:', error);
    }
  }



  private parseClaudeResponse(response: any, taskType: AgentTask['type']): any {
    // If we have a structured response from the API
    if (response.success !== undefined) {
      const result: any = {
        explanation: response.output || response.message || 'Claude Code CLI executed successfully'
      };

      if (response.files && response.files.length > 0) {
        result.files = response.files;
        
        // Extract code from the main App file for display
        const appFile = response.files.find((f: ProjectFile) => 
          f.path.includes('App.tsx') || f.path.includes('App.jsx')
        );
        if (appFile && appFile.content) {
          result.code = appFile.content;
        }
      }

      if (response.projectId) {
        result.projectId = response.projectId;
      }

      return result;
    }

    // Fallback parsing for text responses
    const responseText = typeof response === 'string' ? response : response.output || '';
    const codeBlocks = responseText.match(/```(?:typescript|javascript|tsx|jsx)?\n([\s\S]*?)\n```/g);
    const code = codeBlocks ? codeBlocks[0].replace(/```(?:typescript|javascript|tsx|jsx)?\n|\n```/g, '') : null;
    
    const suggestionMatches = responseText.match(/(?:\d+\.|[-*])\s+(.+)/g);
    const suggestions = suggestionMatches ? suggestionMatches.map((s: string) => s.replace(/^\d+\.|^[-*]\s+/, '').trim()) : [];
    
    const explanation = responseText.replace(/```[\s\S]*?```/g, '').trim();

    const result: any = { explanation };

    if (code) {
      result.code = code;
    }

    if (suggestions.length > 0) {
      result.suggestions = suggestions;
    }

    if (taskType === 'test-generation') {
      result.tests = code || result.explanation;
    }

    if (taskType === 'performance-optimization') {
      result.performance = result.explanation;
    }

    return result;
  }

  async generateCode(
    userPrompt: string, 
    context: any, 
    onStreamMessage?: (message: { type: string; text?: string; data?: any }) => void
  ): Promise<AgentTask> {
    const taskId = this.generateTaskId();
    const task: AgentTask = {
      id: taskId,
      type: 'code-generation',
      description: userPrompt,
      context: { ...context, userPrompt },
      status: 'running',
      createdAt: new Date()
    };

    this.tasks.set(taskId, task);

    try {
      // Send the initial project files to Claude Code CLI with streaming support
      const projectFiles = context.files || [];
      const response = await this.executeClaudeCodeCLI(
        userPrompt, 
        projectFiles, 
        context.projectPath, 
        onStreamMessage
      );
      const result = this.parseClaudeResponse(response, 'code-generation');
      
      task.status = 'completed';
      task.result = result;
      task.completedAt = new Date();
    } catch (error) {
      console.error('Claude Code CLI execution failed:', error);
      task.status = 'failed';
      task.result = {
        explanation: 'Failed to execute Claude Code CLI. Please ensure Claude Code is installed and authenticated.',
        suggestions: [
          'Install Claude Code CLI: npm install -g @anthropic-ai/claude-code',
          'Authenticate with: claude',
          'Check your internet connection',
          'Verify your Claude subscription is active',
          'Ensure the backend API is running',
          'Try running "claude" manually to test authentication'
        ]
      };
      task.completedAt = new Date();
    }

    this.tasks.set(taskId, task);
    return task;
  }

  async generateComponent(
    componentName: string, 
    requirements: string, 
    props?: any, 
    onStreamMessage?: (message: { type: string; text?: string; data?: any }) => void
  ): Promise<AgentTask> {
    const taskId = this.generateTaskId();
    const prompt = `Create a React component named ${componentName} with the following requirements: ${requirements}`;
    
    const task: AgentTask = {
      id: taskId,
      type: 'component-generation',
      description: prompt,
      context: { 
        userPrompt: prompt, 
        componentName, 
        props 
      },
      status: 'running',
      createdAt: new Date()
    };

    this.tasks.set(taskId, task);

    try {
      const response = await this.executeClaudeCodeCLI(
        prompt, 
        undefined, 
        undefined, 
        onStreamMessage
      );
      const result = this.parseClaudeResponse(response, 'component-generation');
      
      task.status = 'completed';
      task.result = result;
      task.completedAt = new Date();
    } catch (error) {
      console.error('Claude Code CLI execution failed:', error);
      task.status = 'failed';
      task.result = {
        explanation: 'Failed to generate component. Please check Claude Code CLI setup.',
        suggestions: [
          'Ensure Claude Code CLI is installed and authenticated',
          'Check your project directory permissions',
          'Verify your Claude subscription status',
          'Make sure the backend API server is running'
        ]
      };
      task.completedAt = new Date();
    }

    this.tasks.set(taskId, task);
    return task;
  }

  getTask(taskId: string): AgentTask | undefined {
    return this.tasks.get(taskId);
  }

  getAllTasks(): AgentTask[] {
    return Array.from(this.tasks.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getActiveTasks(): AgentTask[] {
    return this.getAllTasks().filter(task => task.status === 'running' || task.status === 'pending');
  }

  clearCompletedTasks(): void {
    const activeTasks = new Map();
    this.tasks.forEach((task, id) => {
      if (task.status === 'running' || task.status === 'pending') {
        activeTasks.set(id, task);
      }
    });
    this.tasks = activeTasks;
  }
}

export const claudeCodeAgent = ClaudeCodeAgent.getInstance();
