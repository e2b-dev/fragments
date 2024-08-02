'use client'

import { useState } from 'react'
import { useChat } from 'ai/react'

import { Chat } from '@/components/chat'
import { Header } from '@/components/ui/header'
import { SideView } from '@/components/side-view'
import { SandboxTemplate } from '@/lib/types'
import { Models } from '@/lib/models'


import { useMarkdownParser } from '@/lib/markdown'

// Simulate user ID
const userID = 'dummy-user-id'

export default function Home() {
  const [selectedTemplate, setSelectedTemplate] = useState(SandboxTemplate.CodeInterpreterMultilang)
  const [selectedModel, setSelectedModel] = useState<keyof typeof Models>('claude-3-5-sonnet-20240620')
  const { messages, input, handleInputChange, handleSubmit, data } = useChat({
    api: '/api/chat',
    body: {
      userID,
      modelId: selectedModel,
      template: selectedTemplate,
    },
  })
  const lastAssistantMessage = [...messages].reverse().find(message => message.role === 'assistant')

  const { codeBlocks } = useMarkdownParser({
    code: lastAssistantMessage?.content || '',
    onCodeBlock: (code) => {
      console.log('+ Code block detected!', code)
    }
  })
  console.log({ messages, data })
  // For simplicity, we care only about the latest message that has a tool invocation
  const latestMessageWithToolInvocation = [...messages].reverse().find(message => message.toolInvocations && message.toolInvocations.length > 0)
  // Get the latest tool invocation
  const latestToolInvocation = latestMessageWithToolInvocation?.toolInvocations?.[0]

  return (
    <main className="flex min-h-screen max-h-screen">
      <Header defaultModel={selectedModel} onModelChange={setSelectedModel}/>
      <div className="flex-1 flex space-x-8 w-full pt-16 pb-8 px-4">
        <Chat
          messages={messages}
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          selectedTemplate={selectedTemplate}
          onSelectedTemplateChange={setSelectedTemplate}
        />
        <SideView
          userID={userID}
          toolInvocation={latestToolInvocation}
          data={data}
          selectedTemplate={selectedTemplate}
        />
      </div>
    </main>
  )
}
