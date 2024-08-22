import Editor from 'react-simple-code-editor'
// @ts-ignore
import { highlight, languages } from 'prismjs/components/prism-core'
import 'prismjs/components/prism-clike'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-python'
import 'prismjs/themes/prism.css'

import { TemplateId } from '@/lib/templates'

export function CodeView({ code, template }: { code: string, template?: TemplateId }) {
  return (
    <Editor
      value={code}
      disabled={true}
      onValueChange={() => {}}
      highlight={code => highlight(code, template === 'code-interpreter-multilang' ? languages.python : languages.javascript)}
      padding={10}
      style={{
        fontFamily: '"Fira code", "Fira Mono", monospace',
        fontSize: 12,
      }}
    />
  )
}
