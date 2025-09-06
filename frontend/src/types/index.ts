// Chat message types
export type MessageRole = 'user' | 'assistant'

export interface ChatMessage {
  role: MessageRole
  content: string
  timestamp?: number
}

// Fragment/code generation types
export interface Fragment {
  commentary: string
  template: string
  title: string
  description: string
  additional_dependencies: string[]
  has_additional_dependencies: boolean
  install_dependencies_command: string
  port: number | null
  file_path: string
  code: string
}

// Session types
export interface SessionData {
  sessionId: string
  messages: ChatMessage[]
  fragments: Fragment[]
  template: string
  model: string
  messageCount: number
  fragmentCount: number
  createdAt: number
  updatedAt: number
}

// API response types
export interface GenerateResponse {
  sessionId?: string
  id: string
  previewUrl: string
  shortUrl?: string
  title: string
  description: string
  messageCount?: number
  fragmentCount?: number
}

export interface ErrorResponse {
  error: string
}

// Template types
export type TemplateId = 
  | 'code-interpreter-v1'
  | 'nextjs-developer'
  | 'vue-developer'
  | 'streamlit-developer'
  | 'gradio-developer'

export interface Template {
  id: TemplateId
  name: string
  description: string
}

// Model types
export type ModelId = 'qwen-3-coder-480b' | 'qwen-3-coder-120b' | 'qwen-3-coder-35b' | 'gpt-5' | 'gpt-4o' | 'gpt-4' | 'gpt-3.5-turbo'

export interface Model {
  id: ModelId
  name: string
  provider: string
}

// Chat API request types
export interface GenerateRequest {
  prompt: string
  model?: ModelId
  template?: TemplateId
  sessionId?: string
}

export interface ChatRequest {
  sessionId?: string
  message: string
  model?: ModelId
  template?: TemplateId
}