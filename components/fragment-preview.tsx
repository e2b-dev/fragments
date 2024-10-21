'use client'

import { FragmentInterpreter } from './fragment-interpreter'
import { FragmentWeb } from './fragment-web'
import { ExecutionResult } from '@/lib/types'

export function FragmentPreview({ result }: { result: ExecutionResult }) {
  if (result.template === 'code-interpreter-v1') {
    return <FragmentInterpreter result={result} />
  }

  return <FragmentWeb result={result} />
}
