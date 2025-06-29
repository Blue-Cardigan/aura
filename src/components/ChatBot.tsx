import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, MessageCircle } from 'lucide-react'
import { GoogleGenAI } from '@google/genai'
import type { Project, ComponentDefinition, SelectedElement } from '../types'

interface ChatBotProps {
  currentProject: Project | null
  onCodeChange: (filePath: string, content: string) => void
  onProjectUpdate: (project: Project) => void
  onElementSelect: (element: SelectedElement) => void
  selectedElement: SelectedElement | null
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  actionTaken?: string
}

const ChatBot: React.FC<ChatBotProps> = ({
  currentProject,
  onCodeChange,
  onProjectUpdate,
  onElementSelect,
  selectedElement
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I\'m your AI assistant. I can help you add components, modify styles, and make changes to your project. Just tell me what you\'d like to do!',
      timestamp: new Date()
    }
  ])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [showApiKeyInput, setShowApiKeyInput] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize Gemini AI
  const [ai, setAi] = useState<any>(null)

  useEffect(() => {
    // Check for stored API key
    const storedApiKey = localStorage.getItem('gemini_api_key')
    if (storedApiKey) {
      setApiKey(storedApiKey)
      initializeAI(storedApiKey)
    } else {
      setShowApiKeyInput(true)
    }
  }, [])

  const initializeAI = (key: string) => {
    try {
      const genAI = new GoogleGenAI({ apiKey: key })
      setAi(genAI)
      setShowApiKeyInput(false)
      localStorage.setItem('gemini_api_key', key)
    } catch (error) {
      console.error('Failed to initialize Gemini AI:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const getProjectContext = () => {
    const context = {
      hasProject: !!currentProject,
      projectName: currentProject?.name,
      selectedElement: selectedElement ? {
        tagName: selectedElement.tagName,
        id: selectedElement.id,
        className: selectedElement.className,
        dataAttribute: selectedElement.dataAttribute
      } : null,
      availableComponents: [
        'Container', 'Flex Container', 'Grid Container',
        'Heading 1', 'Heading 2', 'Paragraph',
        'Primary Button', 'Secondary Button',
        'Image', 'Text Input'
      ]
    }
    return context
  }

  const interpretUserRequest = async (userInput: string): Promise<{action: string, params: any, explanation: string}> => {
    if (!ai) throw new Error('AI not initialized')

    const context = getProjectContext()
    const systemPrompt = `You are an AI assistant helping users build web interfaces. 

Current context:
- Project: ${context.projectName || 'No project loaded'}
- Selected element: ${context.selectedElement ? `${context.selectedElement.tagName} (${context.selectedElement.dataAttribute})` : 'None'}
- Available components: ${context.availableComponents.join(', ')}

Your task is to interpret user requests and return a JSON response with the action to take.

Possible actions:
1. "add_component" - Add a new component
2. "modify_style" - Modify element styles
3. "modify_content" - Change element text content
4. "remove_component" - Remove an element
5. "select_element" - Help user select an element
6. "create_project" - Create a new project
7. "general_help" - Provide general assistance

For "add_component", include: {componentType: string, insertLocation?: string}
For "modify_style", include: {property: string, value: string, target?: string}
For "modify_content", include: {content: string, target?: string}
For "remove_component", include: {target: string}

Always include an "explanation" field describing what you'll do.

Examples:
- "Add a blue button" → {"action": "add_component", "params": {"componentType": "Primary Button"}, "explanation": "I'll add a blue primary button to your project"}
- "Make the text bigger" → {"action": "modify_style", "params": {"property": "fontSize", "value": "24px"}, "explanation": "I'll increase the font size of the selected element"}
- "Change the heading to say Welcome" → {"action": "modify_content", "params": {"content": "Welcome"}, "explanation": "I'll change the heading text to 'Welcome'"}

Return only valid JSON.`

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `${systemPrompt}\n\nUser request: "${userInput}"`,
        config: {
          thinkingConfig: {
            thinkingBudget: 0
          }
        }
      })

      const responseText = response.text.trim()
      // Extract JSON from response (sometimes wrapped in markdown)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      } else {
        return JSON.parse(responseText)
      }
    } catch (error) {
      console.error('Error interpreting request:', error)
      return {
        action: 'general_help',
        params: {},
        explanation: "I couldn't understand that request. Could you please rephrase it?"
      }
    }
  }

  const executeAction = async (action: string, params: any): Promise<string> => {
    try {
      switch (action) {
        case 'add_component':
          await addComponent(params.componentType)
          return `Added ${params.componentType} to your project!`

        case 'modify_style':
          if (!selectedElement) {
            return 'Please select an element first, then ask me to modify its style.'
          }
          await modifyElementStyle(params.property, params.value)
          return `Updated ${params.property} to ${params.value}!`

        case 'modify_content':
          if (!selectedElement) {
            return 'Please select an element first, then ask me to change its content.'
          }
          await modifyElementContent(params.content)
          return `Changed element content to "${params.content}"!`

        case 'remove_component':
          if (!selectedElement) {
            return 'Please select an element first, then ask me to remove it.'
          }
          await removeSelectedComponent()
          return 'Removed the selected component!'

        case 'create_project':
          return 'To create a new project, please use the "New Project" button in the sidebar.'

        default:
          return 'I can help you add components, modify styles, change content, or remove elements. What would you like to do?'
      }
    } catch (error) {
      console.error('Error executing action:', error)
      return 'Sorry, I encountered an error while trying to do that. Please try again.'
    }
  }

  const addComponent = async (componentType: string) => {
    // Map user-friendly names to component IDs
    const componentMap: Record<string, string> = {
      'Container': 'div-container',
      'Flex Container': 'flex-container',
      'Grid Container': 'grid-container',
      'Heading 1': 'heading-h1',
      'Heading 2': 'heading-h2',
      'Paragraph': 'paragraph',
      'Primary Button': 'button-primary',
      'Secondary Button': 'button-secondary',
      'Image': 'image-placeholder',
      'Text Input': 'text-input'
    }

    const componentId = componentMap[componentType] || 'div-container'

    // Trigger component addition through global ComponentsPanel interface
    const componentsPanelAction = (window as any).webStudioComponentsPanel
    if (componentsPanelAction?.addComponent) {
      await componentsPanelAction.addComponent(componentId)
    } else {
      // Fallback: directly trigger component addition
      const webContainerService = (window as any).webContainerService
      if (webContainerService && currentProject) {
        // This is a simplified approach - in a real implementation,
        // you'd want to integrate more tightly with ComponentsPanel
        console.log('ChatBot: Adding component via direct integration')
      }
    }
  }

  const modifyElementStyle = async (property: string, value: string) => {
    // Trigger style update through global interface
    const webStudioInterface = (window as any).webStudioInterface
    if (webStudioInterface?.updateElement && selectedElement) {
      await webStudioInterface.updateElement(`style.${property}`, value)
    }
  }

  const modifyElementContent = async (content: string) => {
    const webStudioInterface = (window as any).webStudioInterface
    if (webStudioInterface?.updateElement && selectedElement) {
      await webStudioInterface.updateElement('textContent', content)
    }
  }

  const removeSelectedComponent = async () => {
    if (selectedElement?.dataAttribute) {
      const componentsPanelAction = (window as any).webStudioComponentsPanel
      if (componentsPanelAction?.removeComponent) {
        await componentsPanelAction.removeComponent(selectedElement.dataAttribute)
      }
    }
  }

  const handleSendMessage = async () => {
    if (!inputText.trim() || !ai) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsLoading(true)

    try {
      const interpretation = await interpretUserRequest(inputText)
      const result = await executeAction(interpretation.action, interpretation.params)

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: interpretation.explanation + '\n\n' + result,
        timestamp: new Date(),
        actionTaken: interpretation.action
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please check your API key and try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    }

    setIsLoading(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (showApiKeyInput) {
    return (
      <div className="w-80 panel">
        <div className="panel-header">
          AI Assistant Setup
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="text-blue-400" size={20} />
            <h3 className="text-white font-medium">Setup Required</h3>
          </div>
          <p className="text-gray-300 text-sm mb-3">
            Enter your Gemini API key to enable the AI assistant.
          </p>
          <input
            type="password"
            placeholder="Gemini API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="form-input-sm w-full mb-3"
          />
          <div className="flex gap-2">
            <button
              onClick={() => initializeAI(apiKey)}
              disabled={!apiKey.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 px-3 rounded text-sm"
            >
              Setup
            </button>
            <button
              onClick={() => setShowApiKeyInput(false)}
              className="px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-80 panel">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <Bot className="text-blue-400" size={18} />
          AI Assistant
        </div>
      </div>
      
      <div className="flex-1 flex flex-col h-full">
        {/* Context Info */}
        {currentProject && (
          <div className="panel-section border-b border-blue-600 bg-blue-900/20">
            <h3 className="section-title text-blue-400">Context</h3>
            <div className="text-xs text-blue-300 space-y-1">
              <div>Project: {currentProject.name}</div>
              {selectedElement && (
                <div>Selected: {selectedElement.tagName.toLowerCase()} ({selectedElement.dataAttribute})</div>
              )}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0" style={{ maxHeight: '300px' }}>
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`p-2 rounded text-xs ${
                message.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-200'
              } max-w-[85%]`}>
                <div className="flex items-center gap-1 mb-1 opacity-70">
                  {message.role === 'user' ? <User size={10} /> : <Bot size={10} />}
                  <span className="text-[10px]">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-xs whitespace-pre-wrap">{message.content}</p>
                {message.actionTaken && (
                  <div className="text-[10px] opacity-70 mt-1">
                    Action: {message.actionTaken}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-gray-400">
              <Loader2 size={12} className="animate-spin" />
              <span className="text-xs">Thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-gray-700 ">
          <div className="flex gap-2 ">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe what you want to do..."
              className="form-input-sm flex-1 text-xs"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
              className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded"
            >
              <Send size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatBot 