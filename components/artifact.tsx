'use client'

import { ArtifactInterpreter } from './artifact-interpreter'
import { ArtifactWeb } from './artifact-web'
import { ExecutionResult } from '@/lib/types'

export function Artifact({ result }: { result: ExecutionResult }) {
  if (result.template === 'code-interpreter-multilang') {
    return <ArtifactInterpreter result={result} />
  }

  return <ArtifactWeb result={result} />
}
