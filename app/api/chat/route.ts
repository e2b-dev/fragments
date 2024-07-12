import { z } from 'zod'
import {
  type CoreMessage,
  StreamingTextResponse,
  StreamData,
  streamText,
  StreamTextResult,
  tool,
} from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

import {
  runPython,
  writeToPage,
} from '@/lib/sandbox'
import { SandboxTemplate } from '@/lib/types'
import { prompt as dataAnalystPrompt } from '@/lib/python-analyst-prompt'
import { prompt as nextjsPrompt } from '@/lib/nextjs-prompt'

export interface ServerMessage {
  role: 'user' | 'assistant' | 'function';
  content: string;
}

export async function POST(req: Request) {
  const { messages, userID, template }: { messages: CoreMessage[], userID: string, template: SandboxTemplate } = await req.json()
  console.log('userID', userID)

  let data: StreamData = new StreamData()
  let result: StreamTextResult<any>


  if (template === SandboxTemplate.CodeInterpreterMultilang) {
    result = await streamText({
      model: anthropic('claude-3-5-sonnet-20240620'),
      tools: {
        runPython: tool({
          description: 'Runs Python code.',
          parameters: z.object({
            title: z.string().describe('Short title (5 words max) of the artifact.'),
            description: z.string().describe('Short description (10 words max) of the artifact.'),
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
        }),
      },
      toolChoice: 'auto',
      system: dataAnalystPrompt,
      messages,
    })
  } else if (template === SandboxTemplate.NextJS) {
    result = await streamText({
      model: anthropic('claude-3-5-sonnet-20240620'),
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
            console.log('WILL WRITE')
            const { url } = await writeToPage(userID, code, template)
            console.log('WROTE', { url })

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
      toolChoice: 'auto',
      system: nextjsPrompt,
      messages,
    })
  } else {
    throw new Error('Invalid sandbox template')
  }

  const stream = result.toAIStream({
    async onFinal() {
      await data.close()
    }
  })

  return new StreamingTextResponse(stream, {}, data);
}
