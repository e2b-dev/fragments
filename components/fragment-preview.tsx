'use client'

import { FragmentInterpreter } from './fragment-interpreter'
import { FragmentWeb } from './fragment-web'
import {
  ExecutionResult,
  ExecutionResultInterpreter,
  ExecutionResultWeb,
} from '@/lib/types'

export function FragmentPreview({ result }: { result: ExecutionResult }) {
  if (result.template === 'code-interpreter-v1') {
    return <FragmentInterpreter result={result as ExecutionResultInterpreter} />
  }

  return <FragmentWeb result={result as ExecutionResultWeb} />
}
