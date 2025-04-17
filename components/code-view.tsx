import './code-theme.css'
import { Controlled as CodeMirror } from 'react-codemirror2'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/material.css'
import 'codemirror/mode/javascript/javascript'
import 'codemirror/mode/jsx/jsx'
import 'codemirror/mode/python/python'
import 'codemirror/mode/tsx/tsx'
import 'codemirror/mode/typescript/typescript'

export function CodeView({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <CodeMirror
      value={value}
      options={{
        mode: 'javascript',
        theme: 'material',
        lineNumbers: true,
      }}
      onBeforeChange={(editor, data, value) => {
        onChange(value)
      }}
    />
  )
}
