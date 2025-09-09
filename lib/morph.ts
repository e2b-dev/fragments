export async function applyPatch({
  targetFile,
  instructions,
  initialCode,
  codeEdit,
  apiKey,
}: {
  targetFile: string
  instructions: string
  initialCode: string
  codeEdit: string
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
        content: `<instruction>${instructions}</instruction>\n<code>${initialCode}</code>\n<update>${codeEdit}</update>`,
      },
    ],
    stream: true,
  }

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

    const decoder = new TextDecoder()
    let mergedCode = ''
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
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
      filePath: targetFile,
      code: mergedCode,
    }
  } catch (error: any) {
    if (error.message.includes('Invalid Morph API key')) {
      throw error
    }
    throw new Error(`Failed to apply morph: ${error.message}`)
  }
}
