import type { 
  GenerateRequest, 
  GenerateResponse, 
  ChatRequest, 
  SessionData, 
  ErrorResponse 
} from '../types'

const API_BASE_URL = '/api'

class ApiError extends Error {
  status: number
  
  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const errorText = await response.text()
    let errorMessage = errorText

    try {
      const errorJson = JSON.parse(errorText) as ErrorResponse
      errorMessage = errorJson.error || errorText
    } catch {
      // Keep original error text if JSON parsing fails
    }

    throw new ApiError(response.status, errorMessage)
  }

  const contentType = response.headers.get('Content-Type')
  if (contentType && contentType.includes('application/json')) {
    return response.json()
  } else {
    return response.text() as T
  }
}

// Generate a new project (single-shot)
export async function generateProject(request: GenerateRequest): Promise<GenerateResponse> {
  return fetchApi<GenerateResponse>('/generate', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

// Chat-based generation with sessions
export async function sendChatMessage(request: ChatRequest): Promise<GenerateResponse> {
  return fetchApi<GenerateResponse>('/generate/chat', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

// Get session history
export async function getSession(sessionId: string): Promise<SessionData> {
  return fetchApi<SessionData>(`/generate/session/${sessionId}`)
}

// Delete session
export async function deleteSession(sessionId: string): Promise<{ message: string }> {
  return fetchApi<{ message: string }>(`/generate/session/${sessionId}`, {
    method: 'DELETE',
  })
}

export { ApiError }