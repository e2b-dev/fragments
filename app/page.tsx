'use client'

import { useState } from 'react'
import { useChat } from 'ai/react'

import { Chat } from '@/components/chat'
import { SideView } from '@/components/side-view'
import { SandboxTemplate } from '@/lib/types'
import NavBar from '@/components/navbar'

import { supabase } from './../lib/supabase'
import { AuthDialog } from '@/components/AuthDialog'
import { useAuth } from '@/lib/auth'

export default function Home() {
  const [selectedTemplate, setSelectedTemplate] = useState(SandboxTemplate.CodeInterpreterMultilang)
  const [isAuthDialogOpen, setAuthDialog] = useState(false)
  const { session, apiKey } = useAuth(setAuthDialog)

  const { messages, input, handleInputChange, handleSubmit, data } = useChat({
    api: '/api/chat',
    body: {
      userID: session?.user?.id,
      template: selectedTemplate,
      apiKey,
    },
  })
  console.log({ messages, data })
  // For simplicity, we care only about the latest message that has a tool invocation
  const latestMessageWithToolInvocation = [...messages].reverse().find(message => message.toolInvocations && message.toolInvocations.length > 0)
  // Get the latest tool invocation
  const latestToolInvocation = latestMessageWithToolInvocation?.toolInvocations?.[0]

  function handleSubmitAuth (e: React.FormEvent<HTMLFormElement>) {
    if (!session) {
      e.preventDefault()
      return setAuthDialog(true)
    }

    handleSubmit(e)
  }

  function logout () {
    supabase ? supabase.auth.signOut() : console.warn('Supabase is not initialized')
  }

  return (
    <main className="flex min-h-screen max-h-screen">
      {
        supabase && <AuthDialog open={isAuthDialogOpen} setOpen={setAuthDialog} supabase={supabase} />
      }
      <NavBar session={session} showLogin={() => setAuthDialog(true)} signOut={logout} />
        <div className="flex-1 flex space-x-8 w-full pt-16 pb-8 px-4">
          <Chat
            messages={messages}
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmitAuth}
            selectedTemplate={selectedTemplate}
            onSelectedTemplateChange={setSelectedTemplate}
          />
          <SideView
            toolInvocation={latestToolInvocation}
            data={data}
            selectedTemplate={selectedTemplate}
          />
        </div>
    </main>
  )
}
