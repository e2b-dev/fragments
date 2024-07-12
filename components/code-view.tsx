import Editor from 'react-simple-code-editor'
import { highlight, languages } from 'prismjs/components/prism-core'
import 'prismjs/components/prism-clike'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-python'
import 'prismjs/themes/prism.css' //Example style, you can use another

import { SandboxTemplate } from '@/lib/types'


export function CodeView({ code, template }: { code: string, template: SandboxTemplate }) {
  return (
    <Editor
      value={code}
      disabled={true}
      onValueChange={() => {}}
      highlight={code => highlight(code, template === SandboxTemplate.CodeInterpreterMultilang ? languages.python : languages.javascript)}
      padding={10}
      style={{
        fontFamily: '"Fira code", "Fira Mono", monospace',
        fontSize: 12,
      }}
    />
  )
}