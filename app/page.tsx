'use client'

import Image from 'next/image'
import { useChat } from 'ai/react'

import { Chat } from '@/components/chat'
import { SideView } from '@/components/side-view'

// Simulate user ID
const userID = 'dummy-user-id'

export default function Home() {
  const { messages, input, handleInputChange, handleSubmit, data } = useChat({
    api: '/api/chat',
    body: { userID },
  })
  console.log({ messages, data })

  // For simplicity, we care only about the latest message that has a tool invocation
  const latestMessageWithToolInvocation = [...messages].reverse().find(message => message.toolInvocations && message.toolInvocations.length > 0)
  // Get the latest tool invocation
  const latestToolInvocation = latestMessageWithToolInvocation?.toolInvocations?.[0]

  return (
    <main className="flex min-h-screen max-h-screen">
      <div className="fixed top-0 left-0 right-0 py-4 pl-8">
        <Image src="/logo.svg" alt="logo" width={30} height={30} />
      </div>
      <div className="flex-1 flex space-x-8 w-full pt-16 pb-8 px-4">
        <Chat
          messages={messages}
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
        />
        <SideView toolInvocation={latestToolInvocation} data={data} />
      </div>
    </main>
  )
}
