export async function applyPatch({
  target_file,
  instructions,
  initialCode,
  code_edit,
  apiKey,
}: {
  target_file: string
  instructions: string
  initialCode: string
  code_edit: string
  apiKey?: string
}) {
  // Use provided API key or fall back to env var
  const morphApiKey = apiKey || process.env.MORPH_API_KEY
  
  if (!morphApiKey) {
    throw new Error('Morph API key is required. Please add it in settings or set MORPH_API_KEY environment variable.')
  }

  const requestBody = {
    model: 'morph-v3-large',
    messages: [
      {
        role: 'user',
        content: `<instruction>${instructions}</instruction>\n<code>${initialCode}</code>\n<update>${code_edit}</update>`,
      },
    ],
    stream: true,
  }

  console.log('=== Morph API Request ===')
  console.log('URL:', 'https://api.morphllm.com/v1/chat/completions')
  console.log('Has API Key:', !!morphApiKey)
  console.log('Request Body:', JSON.stringify(requestBody, null, 2))
  console.log('Instruction:', instructions)
  console.log('Code Edit:', code_edit)
  console.log('Initial Code Length:', initialCode?.length || 0)

  try {
    const response = await fetch('https://api.morphllm.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${morphApiKey}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      if (response.status === 401) {
        throw new Error('Invalid Morph API key. Please check your settings.')
      }
      throw new Error(`Morph API error: ${response.status} ${errorText}`)
    }

    // Handle streaming response
    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body from Morph API')
    }

    console.log('=== Reading Morph Stream ===')
    const decoder = new TextDecoder()
    let mergedCode = ''
    let chunkCount = 0
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      chunkCount++
      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') continue
          
          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content
            if (content) {
              mergedCode += content
            }
          } catch (e) {
            // Skip invalid JSON lines
          }
        }
      }
    }

    if (!mergedCode) {
      throw new Error('Morph Apply returned empty content')
    }

    return {
      file_path: target_file,
      code: mergedCode,
    }
  } catch (error: any) {
    if (error.message.includes('Invalid Morph API key')) {
      throw error
    }
    throw new Error(`Failed to apply morph: ${error.message}`)
  }
}
