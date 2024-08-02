'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useChat } from 'ai/react'

import { Chat } from '@/components/chat'
import { SideView } from '@/components/side-view'
import { SandboxTemplate } from '@/lib/types'
import { useRandomId } from '@/lib/utils'

export default function Home() {
  const userID = useRandomId()
  console.log('user id')
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
      <div className="fixed top-0 left-0 right-0 py-4 pl-8 flex items-center justify-between">

        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-2" target="_blank">
            <Image src="/logo.svg" alt="logo" width={30} height={30} />
            <h1 className="whitespace-pre text-[#3d3929]">AI Artifacts by </h1>
          </Link>
          <Link href="https://e2b.dev" className="underline decoration-[#ff8800] decoration-2 text-[#ff8800]" target="_blank">E2B</Link>
        </div>

        <div className="flex-1 flex justify-center ml-[-12.5%]">
          <Link href="https://github.com/e2b-dev/ai-artifacts" className="bg-white shadow-md rounded-lg px-4 py-2 text-[#3d3929] text-sm hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-2" target="_blank">
            <span>⭐ Give AI Artifacts a star on GitHub</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-github">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
            </svg>
          </Link>
        </div>
      </div>
      {userID && (
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
      )}
    </main>
  )
}
