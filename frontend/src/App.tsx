import { useState } from 'react'
import { useChat } from './hooks/useChat'
import { ChatHistory } from './components/ChatHistory'
import { ChatInput } from './components/ChatInput'
import { PreviewPanel } from './components/PreviewPanel'
import type { ModelId, TemplateId } from './types'

const MODELS: { id: ModelId; name: string }[] = [
  { id: 'qwen-3-coder-480b', name: 'Qwen 3 Coder 480B (Cerebras)' },
  { id: 'qwen-3-coder-120b', name: 'Qwen 3 Coder 120B (Cerebras)' },
  { id: 'qwen-3-coder-35b', name: 'Qwen 3 Coder 35B (Cerebras)' },
  { id: 'gpt-5', name: 'GPT-5' },
  { id: 'gpt-4o', name: 'GPT-4o' },
  { id: 'gpt-4', name: 'GPT-4' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
]

const TEMPLATES: { id: TemplateId; name: string }[] = [
  { id: 'nextjs-developer', name: 'Next.js App' },
  { id: 'vue-developer', name: 'Vue.js App' },
  { id: 'code-interpreter-v1', name: 'Python Analysis' },
  { id: 'streamlit-developer', name: 'Streamlit App' },
  { id: 'gradio-developer', name: 'Gradio Interface' },
]

function App() {
  const chat = useChat()
  const [selectedModel, setSelectedModel] = useState<ModelId>('qwen-3-coder-480b')
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('nextjs-developer')

  const handleSendMessage = async (message: string) => {
    try {
      await chat.sendMessage(message, selectedModel, selectedTemplate)
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Fragments</h1>
            <p className="text-sm text-gray-600">AI-powered code generation</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Model Selector */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Model:</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as ModelId)}
                className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={chat.isLoading}
              >
                {MODELS.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Template Selector */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Template:</label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value as TemplateId)}
                className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={chat.isLoading}
              >
                {TEMPLATES.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Session Info */}
            {chat.sessionId && (
              <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Session: {chat.sessionId.slice(-6)}
              </div>
            )}

            {/* Clear Button */}
            <button
              onClick={chat.clearChat}
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              disabled={chat.isLoading}
            >
              Clear
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Chat */}
        <div className="w-1/2 flex flex-col border-r border-gray-200 bg-white">
          <ChatHistory
            messages={chat.messages}
            fragments={chat.fragments}
            onFragmentClick={(fragment) => {
              // For now, we'll just set the current fragment
              // In a real app, we'd need to track results for each fragment
              chat.setCurrentFragment(fragment, chat.currentResult ?? undefined)
            }}
            isLoading={chat.isLoading}
          />
          <ChatInput
            onSubmit={handleSendMessage}
            disabled={chat.isLoading}
          />
        </div>

        {/* Right Panel - Preview */}
        <div className="w-1/2 bg-white">
          <PreviewPanel
            fragment={chat.currentFragment}
            result={chat.currentResult}
          />
        </div>
      </div>

      {/* Error Display */}
      {chat.error && (
        <div className="bg-red-50 border-t border-red-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm text-red-800">{chat.error}</span>
            </div>
            <button
              onClick={() => chat.clearChat()}
              className="text-sm text-red-600 hover:text-red-800 underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App