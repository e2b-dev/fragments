import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { ExecutionResultInterpreter } from '@/lib/types'
import { Terminal } from 'lucide-react'
import Image from 'next/image'
import React from 'react'

function LogsOutput({
  stdout,
  stderr,
}: {
  stdout: string[]
  stderr: string[]
}) {
  if (stdout.length === 0 && stderr.length === 0) return null

  return (
    <div className="w-full h-32 max-h-32 overflow-y-auto flex flex-col items-start justify-start space-y-1 p-4">
      {stdout &&
        stdout.length > 0 &&
        stdout.map((out: string, index: number) => (
          <pre key={index} className="text-xs">
            {out}
          </pre>
        ))}
      {stderr &&
        stderr.length > 0 &&
        stderr.map((err: string, index: number) => (
          <pre key={index} className="text-xs text-red-500">
            {err}
          </pre>
        ))}
    </div>
  )
}

export function FragmentInterpreter({
  result,
}: {
  result: ExecutionResultInterpreter
}) {
  const { cellResults, stdout, stderr, runtimeError } = result

  // The AI-generated code experienced runtime error
  if (runtimeError) {
    const { name, value, traceback } = runtimeError
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>
            {name}: {value}
          </AlertTitle>
          <AlertDescription className="font-mono whitespace-pre-wrap">
            {traceback}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const visibleResults = cellResults.filter(({ png, text }) => png || text)

  if (visibleResults.length > 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="w-full flex-1 min-h-0 overflow-auto p-4 space-y-4 border-b">
          {visibleResults.map(({ png, text }, index) =>
            png ? (
              <Image
                key={index}
                src={`data:image/png;base64,${png}`}
                alt="result"
                width={600}
                height={400}
                className="mx-auto"
              />
            ) : (
              <pre
                key={index}
                className="text-xs whitespace-pre-wrap break-words"
              >
                {text}
              </pre>
            ),
          )}
        </div>
        <LogsOutput stdout={stdout} stderr={stderr} />
      </div>
    )
  }

  // No supported result formats, but there is stdout or stderr
  if (stdout.length > 0 || stderr.length > 0) {
    return <LogsOutput stdout={stdout} stderr={stderr} />
  }

  return (
    <span>
      {cellResults.length > 0 ? 'No previewable output' : 'No output or logs'}
    </span>
  )
}
