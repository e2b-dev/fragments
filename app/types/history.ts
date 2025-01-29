import { Message } from '@/lib/messages'
import { ExecutionResult } from '@/lib/types'
import { DeepPartial } from 'ai'
import { FragmentSchema } from '@/lib/schema'

export interface HistoryItem {
  prompt: string;
  response: string;
  timestamp: Date;
  fragment?: DeepPartial<FragmentSchema>;
  result?: ExecutionResult;
  messages?: Message[];
} 