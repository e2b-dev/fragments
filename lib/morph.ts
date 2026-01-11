import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { generateText, LanguageModel } from 'ai'

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
    throw new Error(
      'Morph API key is required. Please add it in settings or set MORPH_API_KEY environment variable.',
    )
  }

  const morph = createOpenAICompatible({
    name: 'morph',
    apiKey: morphApiKey,
    baseURL: 'https://api.morphllm.com/v1',
  })

  try {
    console.log('[Morph] Starting applyPatch', {
      targetFile,
      instructionsLength: instructions.length,
      initialCodeLength: initialCode.length,
      codeEditLength: codeEdit.length,
      hasApiKey: !!morphApiKey
    })

    const { text: mergedCode } = await generateText({
      model: morph('morph-v3-large') as LanguageModel,
      prompt: `<instruction>${instructions}</instruction>\n<code>${initialCode}</code>\n<update>${codeEdit}</update>`,
      maxRetries: 0,
    })

    console.log('[Morph] Success', { mergedCodeLength: mergedCode?.length })

    if (!mergedCode) {
      throw new Error('Morph Apply returned empty content')
    }

    return {
      filePath: targetFile,
      code: mergedCode,
    }
  } catch (error: any) {
    console.error('[Morph] Error', {
      message: error.message,
      status: error.status,
      cause: error.cause,
      name: error.name,
      stack: error.stack?.substring(0, 500),
    })
    if (error.message.includes('Invalid API key') || error.status === 401) {
      throw new Error('Invalid Morph API key. Please check your settings.')
    }
    throw new Error(`Failed to apply morph: ${error.message}`)
  }
}
