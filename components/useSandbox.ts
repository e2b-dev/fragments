import { CodeInterpreter } from '@e2b/code-interpreter'
import {
  useEffect,
  useState,
} from 'react'

function useSandbox(sandboxID: string) {
  const [sandbox, setSandbox] = useState<CodeInterpreter>()
  const [error, setError] = useState<Error>()

  useEffect(function connectToSandbox() {
    (async () => {
      try {
        const sandbox = await CodeInterpreter.connect(sandboxID)
        setSandbox(sandbox)
      } catch (error) {
        setError(error as Error)
      }
    })()
  }, [sandboxID])

  return { sandbox, error }
}

export default useSandbox
