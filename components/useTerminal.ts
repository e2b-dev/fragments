import { CodeInterpreter, ProcessHandle } from '@e2b/code-interpreter'
import {
  useEffect,
  useState,
} from 'react'
import type { Terminal as XTermTerminal } from '@xterm/xterm'

export interface UseSandboxTerminalOpts {
  sandbox?: CodeInterpreter
  terminal?: XTermTerminal
}

function useSandboxTerminal({
  sandbox,
  terminal,
}: UseSandboxTerminalOpts) {
  const [sandboxPty, setSandboxPty] = useState<ProcessHandle>()

  useEffect(function initialize() {
    async function init() {
      if (!sandbox) return
      if (!terminal) return

      await new Promise<void>((res, rej) => {
        terminal.writeln('', res)
      })

      setTimeout(() => terminal.clear(), 0)

      let isEnabled = true

      try {
        const pty = await sandbox.pty.create({
          rows: terminal.rows,
          cols: terminal.cols,
          timeout: 0,
          onData: data => {
            if (!isEnabled) return
            terminal.write(data)
          },
        })

        const input = await sandbox.pty.streamInput(pty.pid)

        const disposeOnData = terminal.onData(data => {
          if (!isEnabled) return
          input.sendData(new TextEncoder().encode(data))
        })
        const disposeOnResize = terminal.onResize(size => {
          if (!isEnabled) return
          sandbox.pty.resize(pty.pid, size)
        })

        setSandboxPty(pty)

        return async () => {
          disposeOnData.dispose()
          disposeOnResize.dispose()
          input.stop()
          setSandboxPty(s => s === pty ? undefined : s)
          await pty.disconnect()
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : JSON.stringify(err)
        console.error(message)
      }
    }

    const disposePromise = init()

    return () => {
      disposePromise.then(dispose => dispose?.())
    }
  }, [
    sandbox,
    terminal,
  ])

  return sandboxPty
}

export default useSandboxTerminal
