'use client'

import { getTemplateId } from '@/lib/templates'
import type { ExecutionResult, ExecutionResultInterpreter, ExecutionResultWeb } from '@/lib/types'
import { FragmentInterpreter } from './fragment-interpreter'
import { FragmentWeb } from './fragment-web'

export function FragmentPreview({ result }: { result: ExecutionResult }) {
  if (getTemplateId(result.template) === 'code-interpreter-v1') {
    return <FragmentInterpreter result={result as ExecutionResultInterpreter} />
  }

  return <FragmentWeb result={result as ExecutionResultWeb} />
}
