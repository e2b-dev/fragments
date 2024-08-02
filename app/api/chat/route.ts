import { z } from 'zod'
import {
  type CoreMessage,
  StreamingTextResponse,
  StreamData,
  streamText,
  StreamTextResult,
  tool,
  LanguageModel
} from 'ai'
import { createOpenAI as createGroq } from '@ai-sdk/openai'
import { createOpenAI as createFireworks } from '@ai-sdk/openai'
import { createOpenAI as createTogether } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'

import {
  runPython,
  writeToPage,
  writeToApp,
} from '@/lib/sandbox'
import { SandboxTemplate } from '@/lib/types'
import { Models } from '@/lib/models'
import { prompt as dataAnalystPrompt } from '@/lib/python-analyst-prompt'
import { prompt as nextjsPrompt } from '@/lib/nextjs-prompt'
import { OpenAIChatLanguageModel } from '@ai-sdk/openai/internal'
import { prompt as streamlitPrompt } from '@/lib/streamlit-prompt'

export interface ServerMessage {
  role: 'user' | 'assistant' | 'function';
  content: string;
}



function parseToolResponse(response: string) {
  const functionRegex = /<function=(\w+)>(.*?)<\/function>/;
  const match = response.match(functionRegex);

  if (match) {
    const [, functionName, argsString] = match;
    try {
      const args = JSON.parse(argsString);
      return {
        function: functionName,
        arguments: args,
      };
    } catch (error) {
      console.error(`Error parsing function arguments: ${error}`);
      return null;
    }
  }
  return null;
}

export async function POST(req: Request) {
  const { messages, userID, modelId, template }: { messages: CoreMessage[], userID: string, modelId: keyof typeof Models, template: SandboxTemplate } = await req.json()
  console.log('User ID', userID)
  console.log('Selected model', modelId)
  console.log('Template', template)

  let model: any
  if (modelId === 'claude-3-5-sonnet-20240620') {
    model = anthropic('claude-3-5-sonnet-20240620')
  } else {
    const groq = createGroq({
      baseURL: 'https://api.groq.com/openai/v1',
      apiKey: process.env.GROQ_API_KEY,
    })
    // const fireworks = createFireworks({
    //   baseURL: 'https://api.fireworks.ai/inference/v1',
    //   apiKey: process.env.FIREWORKS_API_KEY,
    // })
    // model = fireworks(modelId)
    model = groq(modelId)
  }


  let data: StreamData = new StreamData()
  let result: StreamTextResult<any>


    const fireworks = createFireworks({
      baseURL: 'https://api.fireworks.ai/inference/v1',
      apiKey: process.env.FIREWORKS_API_KEY,
    })
    const groq = createGroq({
      baseURL: 'https://api.groq.com/openai/v1',
      apiKey: process.env.GROQ_API_KEY,
    })
    const together = createTogether({
      baseURL: 'https://api.together.xyz/v1',
      apiKey: process.env.TOGETHER_AI_API_KEY,
    })
    result = await streamText({
      // model: groq('llama-3.1-70b-versatile'),
      // model: fireworks('accounts/fireworks/models/llama-v3p1-405b-instruct'),
      // model: together('meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo'),
      model: together('meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo'),
      temperature: 0,
      system: dataAnalystPrompt,
      messages,
    })

  if (template === SandboxTemplate.CodeInterpreterMultilang) {
    result = await streamText({
      // model: fireworks('accounts/fireworks/models/llama-v3p1-405b-instruct'),
      model: groq('llama-3.1-70b-versatile'),
      system: dataAnalystPrompt,
      messages,
      tools: {
        runCode: tool({
          description: 'Run python code in the sandbox.',
          parameters: z.object({
            title: z.string().describe('Short title (5 words max) of the code snippet.'),
            description: z.string().describe('Short description (10 words max) of the code snippet.'),
            code: z.string().describe('The code to run.'),
          }),
          async execute({ code }) {
            data.append({
              tool: 'runPython',
              state: 'running',
            })
            const execOutput = await runPython(userID, code, template)
            const stdout = execOutput.logs.stdout
            const stderr = execOutput.logs.stderr
            const runtimeError = execOutput.error
            const results = execOutput.results

            data.append({
              tool: 'runPython',
              state: 'complete',
            })

            return {
              stdout,
              stderr,
              runtimeError,
              cellResults: results,
            }
          },
        })
      },
    })
  } else if (template === SandboxTemplate.Streamlit) {
    console.log('WRITING A STREAMLIT APP')
    result = await streamText({
      model: anthropic('claude-3-5-sonnet-20240620'),
      system: streamlitPrompt,
      messages,
      tools: {
        writeCodeToAppPy: tool({
          description: 'Writes Streamlit code to the app.py file.',
          parameters: z.object({
            code: z.string().describe('The Streamlit code to write.'),
          }),
          async execute({ code }) {
            data.append({
              tool: 'writeCodeToAppPy',
              state: 'running',
            })
            console.log('WILL WRITE')
            const { url } = await writeToApp(userID, code, template)
            console.log('WROTE', { url })
            data.append({
              tool: 'writeCodeToAppPy',
              state: 'complete',
            })

            return {
              url,
            }
          },
        }),
      },
    })
  } else if (template === SandboxTemplate.NextJS) {
    result = await streamText({
      // model: anthropic('claude-3-5-sonnet-20240620'),
      // model: fireworks('accounts/fireworks/models/llama-v3p1-405b-instruct'),
      model: groq('llama-3.1-70b-versatile'),
      system: nextjsPrompt,
      messages,
      tools: {
        writeCodeToPageTsx: tool({
          description: 'Writes TSX code to the page.tsx file. You can use tailwind classes.',
          parameters: z.object({
            title: z.string().describe('Short title (5 words max) of the artifact.'),
            description: z.string().describe('Short description (10 words max) of the artifact.'),
            code: z.string().describe('The TSX code to write.'),
          }),
          async execute({ code }) {
            data.append({
              tool: 'writeCodeToPageTsx',
              state: 'running',
            })
            const { url } = await writeToPage(userID, code, template)

            data.append({
              tool: 'writeCodeToPageTsx',
              state: 'complete',
            })

            return {
              url,
            }
          },
        }),
      },
    })
  } else {
    throw new Error('Invalid sandbox template')
  }

  const stream = result.toAIStream({
    async onFinal() {
      await data.close()
    },
  })

  return new StreamingTextResponse(stream, {}, data);
}
