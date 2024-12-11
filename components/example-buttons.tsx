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
    <div className="flex items-center space-x-2">
      {EXAMPLES.map((example) => (
        <Button
          key={example}
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => onSelect(example)}
        >
          {example}
        </Button>
      ))}
    </div>
  )
}
