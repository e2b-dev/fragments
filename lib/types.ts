import { TemplateId } from './templates'
import { ExecutionError, Result } from '@e2b/code-interpreter'

export type ExecutionResult = {
  sbxId: string
  template: TemplateId
  stdout: string[]
  stderr: string[]
  runtimeError?: ExecutionError
  cellResults: Result[]
  url?: string
}
