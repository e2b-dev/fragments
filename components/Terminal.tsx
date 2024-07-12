import {
  forwardRef,
  useCallback,
  useEffect,
  useState,
} from 'react'
import { useResizeDetector } from 'react-resize-detector'
import type { Terminal as XTermTerminal } from '@xterm/xterm'
import type { FitAddon } from '@xterm/addon-fit'

import useTerminal from './useTerminal'
import useSandbox from './useSandbox'
import Spinner from './Spinner'

export interface Props {
  sandboxID: string
  autofocus?: boolean
}

const Terminal = forwardRef<{}, Props>(({
  autofocus,
  sandboxID,
}, ref) => {
  const [errMessage, setErrMessage] = useState('')
  const [terminal, setTerminal] = useState<{ terminal: XTermTerminal, fitAddon: FitAddon }>()

  const { sandbox } = useSandbox(sandboxID)
  const pty = useTerminal({
    sandbox,
    terminal: terminal?.terminal,
  })

  useEffect(function removeErrorMessage() {
    setErrMessage('')
  }, [
    sandbox,
    pty,
  ])

  const focus = useCallback(() => {
    terminal?.terminal.focus()
  }, [terminal?.terminal])

  const onResize = useCallback(() => {
    if (!terminal?.fitAddon) return

    const dim = terminal.fitAddon.proposeDimensions()

    if (!dim) return
    if (isNaN(dim.cols) || isNaN(dim.rows)) return

    terminal.fitAddon.fit()
  }, [terminal?.fitAddon])

  const { ref: terminalRef } = useResizeDetector<HTMLDivElement>({ onResize })

  useEffect(function initialize() {
    async function init() {
      if (!terminalRef.current) return

      const xterm = await import('@xterm/xterm')

      const term = new xterm.Terminal({
        cursorStyle: 'block',
        fontSize: 13,
        theme: {
          background: '#000',
          foreground: '#FFFFFF',
          cursor: '#FFFFFF',
        },
        allowProposedApi: true,
      })

      const { FitAddon } = await import('@xterm/addon-fit')
      const fitAddon = new FitAddon()
      term.loadAddon(fitAddon)
      term.open(terminalRef.current)

      setTerminal({
        fitAddon,
        terminal: term,
      })

      // TODO: We want to add handling of multiline commands

      if (autofocus) term.focus()


      const { CanvasAddon } = await import('@xterm/addon-canvas')
      const canvasAddon = new CanvasAddon()
      term.loadAddon(canvasAddon)

      fitAddon.fit()

      return term
    }

    const result = init()

    return () => {
      result.then(i => i?.dispose())
    }
  }, [
    terminalRef,
    autofocus,
  ])

  const clear = useCallback(() => {
    terminal?.terminal.clear()
  }, [terminal?.terminal])


  return (
    <div className="py-2 pl-2 flex-1 bg-[#000] flex">
      <div
        className="
          flex-1
          flex
          relative
          bg-[#000]
        ">
        {/*
           * We assign the `sizeRef` and the `terminalRef` to a child element intentionally
           * because the fit addon for xterm.js resizes the terminal based on the PARENT'S size.
           * The child element MUST have set the same width and height of it's parent, hence
           * the `w-full` and `h-full`.
           */}
        <div
          ref={terminalRef}
          className="
            terminal
            terminal-wrapper
            absolute
            h-full
            w-full
            bg-[#000]
          " />
        {(errMessage || !terminal || (!pty)) &&
          <div
            className="
              absolute
              h-full
              w-full
              top-0
              left-0
              bg-[#000]
              ">
            <div
              className="
                text-white
                flex
                flex-1
                h-full
                items-center
                justify-center
              ">
              {errMessage &&
                <div
                  className="text-red">
                  {errMessage}
                </div>
              }
              {(!terminal || (!pty)) && <Spinner />}
            </div>
          </div>
        }
      </div>
    </div>
  )
})

Terminal.displayName = 'Terminal'

export default Terminal
