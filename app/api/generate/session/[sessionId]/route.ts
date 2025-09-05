import { kv } from '@vercel/kv'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
  timestamp?: number
}

type SessionData = {
  messages: ChatMessage[]
  fragments: any[]
  template: string
  model: string
  createdAt: number
  updatedAt: number
}

export async function GET(
  req: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params

    if (!sessionId) {
      return new Response('Session ID is required', { status: 400 })
    }

    // Check if KV storage is available
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      return new Response(
        JSON.stringify({
          error: 'Session storage not configured. KV storage required for session management.'
        }),
        { 
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Retrieve session data from KV storage
    let sessionData: SessionData | null = null
    try {
      sessionData = await kv.get(`chat_session:${sessionId}`)
    } catch (error) {
      console.error('Failed to retrieve session from KV:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to retrieve session data' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    if (!sessionData) {
      return new Response(
        JSON.stringify({ error: 'Session not found' }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Return session data
    return new Response(
      JSON.stringify({
        sessionId,
        messages: sessionData.messages,
        fragments: sessionData.fragments,
        template: sessionData.template,
        model: sessionData.model,
        messageCount: sessionData.messages.length,
        fragmentCount: sessionData.fragments.length,
        createdAt: sessionData.createdAt,
        updatedAt: sessionData.updatedAt,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )

  } catch (error: any) {
    console.error('Error in session retrieval API:', error)

    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params

    if (!sessionId) {
      return new Response('Session ID is required', { status: 400 })
    }

    // Check if KV storage is available
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      return new Response(
        JSON.stringify({
          error: 'Session storage not configured. KV storage required for session management.'
        }),
        { 
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Delete session from KV storage
    try {
      await kv.del(`chat_session:${sessionId}`)
    } catch (error) {
      console.error('Failed to delete session from KV:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to delete session data' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({ message: 'Session deleted successfully' }),
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )

  } catch (error: any) {
    console.error('Error in session deletion API:', error)

    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}