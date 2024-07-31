import { useMemo } from 'react'
import { Marked, MarkedExtension } from 'marked'

const codeBlockDetector: (parser: MarkdownParser) => MarkedExtension = (parser: MarkdownParser) => ({
  extensions: [{
    name: 'codeBlockNotifier',
    level: 'block',
    start(src) {
      return src.match(/^```/)?.index;
    },
    tokenizer(src, tokens) {
      // const rule = /^```([^\n]*)\n([\s\S]*?)\n```/;
      const rule = /^```([^\n]*)\n([\s\S]*?)(?:\n```|$)/;
      const match = rule.exec(src);
      if (match) {
        // Code block detected, you can add your notification logic here
        console.log('+ Code block started!');
        console.log('+ Language:', match[1] || 'unspecified');
        console.log('+ MATCHED CODE', match[2])

        parser.notifyListeners(match[2])

        return {
          type: 'code',
          raw: match[0],
          lang: match[1],
          text: match[2]
        };
      }
    }
  }]
})

class MarkdownParser {
  private marked: Marked
  private listeners: ((code: string) => void)[] = []

  constructor({ onCodeBlock }: { onCodeBlock: (code: string) => void }) {
    this.listeners.push(onCodeBlock)
    this.marked = new Marked(codeBlockDetector(this))
  }

  addCodeBlockListener(listener: (code: string) => void) {
    this.listeners.push(listener)
  }

  parse(markdown: string) {
    return this.marked.parse(markdown)
  }

  notifyListeners(code: string) {
    this.listeners.forEach(listener => listener(code))
  }
}

/////


export function useMarkdownParser({ code, onCodeBlock }: { code: string, onCodeBlock: (code: string) => void }) {
  const parser = useMemo(() => {
    console.log('CREATING NEW PARSER')
    const parser = new MarkdownParser({ onCodeBlock })
    return parser
  }, [onCodeBlock])
  const html = useMemo(() => parser.parse(code), [code, parser])
  return { html }
}

