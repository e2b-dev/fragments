'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useChat } from 'ai/react'

import { Chat } from '@/components/chat'
import { SideView } from '@/components/side-view'
import { SandboxTemplate } from '@/lib/types'

// Simulate user ID
const userID = 'dummy-user-id'

export default function Home() {
  const [selectedTemplate, setSelectedTemplate] = useState(SandboxTemplate.CodeInterpreterMultilang)
  const { messages, input, handleInputChange, handleSubmit, data } = useChat({
    api: '/api/chat',
    body: {
      userID,
      template: selectedTemplate,
    },
  })
  console.log({ messages, data })
  // For simplicity, we care only about the latest message that has a tool invocation
  const latestMessageWithToolInvocation = [...messages].reverse().find(message => message.toolInvocations && message.toolInvocations.length > 0)
  // Get the latest tool invocation
  const latestToolInvocation = latestMessageWithToolInvocation?.toolInvocations?.[0]

  return (
    <main className="flex min-h-screen max-h-screen">
      <div className="fixed top-0 left-0 right-0 py-4 pl-8 flex items-center">
        <Link href="/" className="flex items-center gap-2" target="_blank">
          <Image src="/logo.svg" alt="logo" width={30} height={30} />
          <h1 className="whitespace-pre text-[#3d3929]">AI Artifacts by </h1>
        </Link>
        <Link href="https://e2b.dev" className="underline decoration-[#ff8800] decoration-2 text-[#ff8800]" target="_blank">E2B</Link>
      </div>
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
