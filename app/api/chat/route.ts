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
// import { createOpenAI as createFireworks } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'

import {
  runPython,
  writeToPage,
} from '@/lib/sandbox'
import { SandboxTemplate } from '@/lib/types'
import { Models } from '@/lib/models'
import { prompt as dataAnalystPrompt } from '@/lib/python-analyst-prompt'
import { prompt as nextjsPrompt } from '@/lib/nextjs-prompt'
import { OpenAIChatLanguageModel } from '@ai-sdk/openai/internal'

export interface ServerMessage {
  role: 'user' | 'assistant' | 'function';
  content: string;
}

export async function POST(req: Request) {
  const { messages, userID, modelId, template }: { messages: CoreMessage[], userID: string, modelId: keyof typeof Models, template: SandboxTemplate } = await req.json()
  console.log('userID', userID)
  console.log('Selected model', modelId)

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


    const groq = createGroq({
      baseURL: 'https://api.groq.com/openai/v1',
      apiKey: process.env.GROQ_API_KEY,

    })
    // const fireworks = createFireworks({
    //   baseURL: 'https://api.fireworks.ai/inference/v1',
    //   apiKey: process.env.FIREWORKS_API_KEY,
    // })
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
  } else if (template === SandboxTemplate.NextJS) {
    result = await streamText({
      // model: anthropic('claude-3-5-sonnet-20240620'),
      // model: fireworks('accounts/fireworks/models/llama-v3p1-405b-instruct'),
      model: groq('llama-3.1-70b-versatile'),
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
      system: nextjsPrompt,
      messages,
    })
  } else {
    throw new Error('Invalid sandbox template')
  }

  // const codeBlocks: string[] = []

  const stream = result.toAIStream({
    async onFinal(text) {
      await data.close()
      // const codeBlockRegex = /```python\s*([\s\S]*?)\s*```/g;
      // let match;
      // while ((match = codeBlockRegex.exec(text)) !== null) {
      //   codeBlocks.push(match[1]);
      // }
      // console.log('Extracted Python code blocks:', codeBlocks);
    },
  })

  return new StreamingTextResponse(stream, {}, data);
}
