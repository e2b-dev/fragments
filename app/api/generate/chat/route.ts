import { Duration } from '@/lib/duration'
import {
  getModelClient,
  LLMModel,
  LLMModelConfig,
} from '@/lib/models'
import { createLLMModelConfig } from '@/lib/model-loader'
import { toPrompt } from '@/lib/prompt'
import { fragmentSchema as schema } from '@/lib/schema'
import templates, { TemplateId } from '@/lib/templates'
import { publish } from '@/app/actions/publish'
import { generateObject, LanguageModel, CoreMessage } from 'ai'
import { Sandbox } from '@e2b/code-interpreter'
import { kv } from '@vercel/kv'
import { customAlphabet } from 'nanoid'

export const maxDuration = 300

const sandboxTimeout = 10 * 60 * 1000 // 10 minutes in ms
const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 10)

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
  timestamp?: number
}

type SessionData = {
  messages: ChatMessage[]
  fragments: any[]
  template: TemplateId
  model: string
  createdAt: number
  updatedAt: number
}

type GenerateChatRequest = {
  sessionId?: string
  message: string
  model?: string
  template?: TemplateId
}

export async function POST(req: Request) {
  try {
    const {
      sessionId: inputSessionId,
      message,
      model = 'gpt-4o',
      template = 'nextjs-developer',
    }: GenerateChatRequest = await req.json()

    if (!message) {
      return new Response('Message is required', { status: 400 })
    }

    // Get model configuration dynamically
    const modelData = createLLMModelConfig(model)
    if (!modelData) {
      return new Response(
        JSON.stringify({
          error: `Unknown model: ${model}`
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const { modelConfig, config } = modelData

    // Check if the required API key is available
    if (!config.apiKey) {
      return new Response(
        JSON.stringify({
          error: `API key not configured for ${modelConfig.provider}. Please set the appropriate API key environment variable.`
        }),
        { 
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    if (!process.env.E2B_API_KEY) {
      return new Response(
        JSON.stringify({
          error: 'E2B API key not configured. Please set E2B_API_KEY environment variable.'
        }),
        { 
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Generate or use existing session ID
    const sessionId = inputSessionId || `session_${nanoid()}`

    // Retrieve existing session data from KV storage
    let sessionData: SessionData | null = null
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN && inputSessionId) {
      try {
        sessionData = await kv.get(`chat_session:${sessionId}`)
      } catch (error) {
        console.log('KV not available, creating new session')
      }
    }

    // Initialize session data if not found
    if (!sessionData) {
      sessionData = {
        messages: [],
        fragments: [],
        template,
        model,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    }

    // Add user message to session
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: Date.now()
    }
    sessionData.messages.push(userMessage)
    sessionData.updatedAt = Date.now()

    // Prepare messages for LLM (convert to CoreMessage format)
    const coreMessages: CoreMessage[] = sessionData.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }))

    const modelClient = getModelClient(modelConfig, config)

    // Generate code using LLM with full conversation history
    const result = await generateObject({
      model: modelClient as LanguageModel,
      schema,
      system: toPrompt(templates),
      messages: coreMessages,
      maxRetries: 0,
    })

    const fragment = result.object

    // Add assistant response to session
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: `Generated: ${fragment.title || 'Project'} - ${fragment.description || 'Code generated successfully'}`,
      timestamp: Date.now()
    }
    sessionData.messages.push(assistantMessage)
    sessionData.fragments.push(fragment)

    // Create E2B sandbox
    const sbx = await Sandbox.create(fragment.template, {
      metadata: {
        template: fragment.template,
        sessionId: sessionId,
        userID: '',
        teamID: '',
      },
      timeoutMs: sandboxTimeout,
    })

    // Install packages if needed
    if (fragment.has_additional_dependencies) {
      await sbx.commands.run(fragment.install_dependencies_command)
      console.log(
        `Installed dependencies: ${fragment.additional_dependencies.join(', ')} in sandbox ${sbx.sandboxId}`,
      )
    }

    // Write code to sandbox
    if (fragment.code && Array.isArray(fragment.code)) {
      for (const file of fragment.code) {
        await sbx.files.write(file.file_path, file.file_content)
        console.log(`Copied file to ${file.file_path} in ${sbx.sandboxId}`)
      }
    } else {
      await sbx.files.write(fragment.file_path, fragment.code)
      console.log(`Copied file to ${fragment.file_path} in ${sbx.sandboxId}`)
    }

    // Get preview URL
    const previewUrl = `https://${sbx.getHost(fragment.port || 80)}`

    // Publish the project (create short URL if KV is available)
    let shortUrl: string | undefined
    try {
      const publishResult = await publish(
        previewUrl,
        sbx.sandboxId,
        '10m' as Duration,
        undefined, // teamID
        undefined, // accessToken
      )
      shortUrl = publishResult.url
    } catch (error) {
      console.log('Publishing failed, using direct URL:', error)
      shortUrl = previewUrl
    }

    // Save updated session data to KV storage
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      try {
        await kv.set(
          `chat_session:${sessionId}`, 
          sessionData,
          { ex: 24 * 60 * 60 } // 24 hours TTL
        )
      } catch (error) {
        console.log('Failed to save session to KV:', error)
      }
    }

    return new Response(
      JSON.stringify({
        sessionId,
        id: sbx.sandboxId,
        previewUrl,
        shortUrl,
        title: fragment.title,
        description: fragment.description,
        messageCount: sessionData.messages.length,
        fragmentCount: sessionData.fragments.length,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )

  } catch (error: any) {
    console.error('Error in generate chat API:', error)

    const isRateLimitError =
      error && (error.statusCode === 429 || error.message.includes('limit'))
    const isOverloadedError =
      error && (error.statusCode === 529 || error.statusCode === 503)
    const isAccessDeniedError =
      error && (error.statusCode === 403 || error.statusCode === 401)

    if (isRateLimitError) {
      return new Response(
        'The provider is currently unavailable due to request limit.',
        { status: 429 }
      )
    }

    if (isOverloadedError) {
      return new Response(
        'The provider is currently unavailable. Please try again later.',
        { status: 529 }
      )
    }

    if (isAccessDeniedError) {
      return new Response(
        'Access denied. Please check your API configuration.',
        { status: 403 }
      )
    }

    return new Response(
      'An unexpected error has occurred. Please try again later.',
      { status: 500 }
    )
  }
}