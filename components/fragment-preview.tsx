'use client'

import { FragmentInterpreter } from './fragment-interpreter'
import { FragmentWeb } from './fragment-web'
import { stripDevSuffix } from '@/lib/templates'
import {
  ExecutionResult,
  ExecutionResultInterpreter,
  ExecutionResultWeb,
} from '@/lib/types'

export function FragmentPreview({ result }: { result: ExecutionResult }) {
  if (stripDevSuffix(result.template) === 'code-interpreter-v1') {
    return <FragmentInterpreter result={result as ExecutionResultInterpreter} />
  }

  return <FragmentWeb result={result as ExecutionResultWeb} />
}
