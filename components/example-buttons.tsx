import React from 'react'
import { Button } from '@/components/ui/button'

const EXAMPLES = [
  'Create a REST API with authentication',
  'Build a data visualization dashboard',
  'Make an AI-powered chatbot',
]

export function ExampleButtons({
  onSelect,
}: {
  onSelect: (text: string) => void
}) {
  return (
    <div className="flex flex-wrap justify-center gap-2 w-full">
      {EXAMPLES.map((example) => (
        <Button
          key={example}
          variant="outline"
          size="sm"
          className="text-xs whitespace-normal text-center min-w-[120px] md:min-w-fit"
          onClick={() => onSelect(example)}
        >
          {example}
        </Button>
      ))}
    </div>
  )
}
