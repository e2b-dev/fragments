import { z } from 'zod'
import {
  type CoreMessage,
  StreamingTextResponse,
  StreamData,
  streamText,
  tool,
} from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

import {
  runPython,
} from '@/lib/sandbox'

export interface ServerMessage {
  role: 'user' | 'assistant' | 'function';
  content: string;
}

// export async function POST(req: Request) {
//   // TODO: Implement
// }
