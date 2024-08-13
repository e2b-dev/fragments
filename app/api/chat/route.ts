import { z } from 'zod'
import {
  type CoreMessage,
  StreamingTextResponse,
  StreamData,
  streamText,
  StreamTextResult,
  tool,
} from 'ai'

import { LanguageModelV1 } from '@ai-sdk/provider'

import {
  runPython,
  writeToPage,
  writeToApp,
} from '@/lib/sandbox'
import { SandboxTemplate } from '@/lib/types'
import { prompt as dataAnalystPrompt } from '@/lib/python-analyst-prompt'
import { prompt as nextjsPrompt } from '@/lib/nextjs-prompt'
import { prompt as streamlitPrompt } from '@/lib/streamlit-prompt'
import { getModelClient } from '@/lib/models'
import { LLMModel, LLMModelConfig } from '@/lib/models'

export interface ServerMessage {
  role: 'user' | 'assistant' | 'function';
  content: string;
}

export async function POST(req: Request) {
  const { messages, userID, template, model, config, apiKey }: { messages: CoreMessage[], userID: string, template: SandboxTemplate, model: LLMModel, config: LLMModelConfig, apiKey: string } = await req.json()
  console.log('userID', userID)
  console.log('template', template)
  console.log('apiKey', apiKey)
  console.log('model', model)
  console.log('config', config)

  const { model: modelNameString, apiKey: modelApiKey, ...modelConfig } = config
  const modelClient = getModelClient(model, config)

  let data: StreamData = new StreamData()
  let result: StreamTextResult<any>

  if (template === SandboxTemplate.CodeInterpreterMultilang) {
    result = await streamText({
      model: modelClient as LanguageModelV1,
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

            const execOutput = await runPython(userID, code, template, apiKey)
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
              template,
            }
          },
        }),
      },
      toolChoice: 'auto',
      system: dataAnalystPrompt,
      messages,
      ...modelConfig,
    })
  } else if (template === SandboxTemplate.NextJS) {
    result = await streamText({
      model: modelClient as LanguageModelV1,
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
            const { url } = await writeToPage(userID, code, template, apiKey)
            console.log('WROTE', { url })

            data.append({
              tool: 'writeCodeToPageTsx',
              state: 'complete',
            })


            return {
              url,
              template,
            }
          },
        }),
      },
      toolChoice: 'auto',
      system: nextjsPrompt,
      messages,
      ...modelConfig,
    })
  } else if (template === SandboxTemplate.Streamlit) {
    result = await streamText({
      model: modelClient as LanguageModelV1,
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
            const { url } = await writeToApp(userID, code, template, apiKey)
            console.log('WROTE', { url })
            data.append({
              tool: 'writeCodeToAppPy',
              state: 'complete',
            })

            return {
              url,
              template,
            }
          },
        }),
      },
      system: streamlitPrompt,
      messages,
      ...modelConfig,
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
