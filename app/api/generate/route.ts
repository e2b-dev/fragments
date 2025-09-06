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
import { ExecutionResultWeb } from '@/lib/types'
import { publish } from '@/app/actions/publish'
import { streamObject, LanguageModel, generateObject } from 'ai'
import { Sandbox } from '@e2b/code-interpreter'

export const maxDuration = 300

const sandboxTimeout = 10 * 60 * 1000 // 10 minutes in ms

type GenerateRequest = {
  prompt: string
  model?: string
  template?: TemplateId
  sessionId?: string
}

export async function POST(req: Request) {
  try {
    const {
      prompt,
      model = 'gpt-4o',
      template = 'nextjs-developer',
      sessionId,
    }: GenerateRequest = await req.json()

    if (!prompt) {
      return new Response('Prompt is required', { status: 400 })
    }

    // If sessionId is provided, redirect to chat API for session-based generation
    if (sessionId) {
      const chatApiUrl = new URL('/api/generate/chat', req.url)
      
      const chatResponse = await fetch(chatApiUrl.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          message: prompt,
          model,
          template,
        }),
      })

      // Return the chat API response
      const responseBody = await chatResponse.text()
      return new Response(responseBody, {
        status: chatResponse.status,
        headers: {
          'Content-Type': 'application/json',
        },
      })
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

    // Check if E2B API key is available
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

    const modelClient = getModelClient(modelConfig, config)

    // Generate code using LLM
    const result = await generateObject({
      model: modelClient as LanguageModel,
      schema,
      system: toPrompt(templates),
      messages: [
        {
          role: 'user',
          content: `Use template: ${template}. ${prompt}`,
        },
      ],
      maxRetries: 0,
    })

    const fragment = result.object

    // Create E2B sandbox
    const sbx = await Sandbox.create(fragment.template, {
      metadata: {
        template: fragment.template,
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

    return new Response(
      JSON.stringify({
        id: sbx.sandboxId,
        previewUrl,
        shortUrl,
        title: fragment.title,
        description: fragment.description,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )

  } catch (error: any) {
    console.error('Error in generate API:', error)

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