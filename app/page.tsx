'use client'

import { useState, useEffect } from 'react'
import { useChat } from 'ai/react'

import { Chat } from '@/components/chat'
import { SideView } from '@/components/side-view'
import { SandboxTemplate } from '@/lib/types'
import NavBar from '@/components/navbar'

import { supabase } from './../lib/supabase'
import { AuthDialog } from '@/components/AuthDialog'
import { Session } from '@supabase/supabase-js'
import { getUserAPIKeys } from '@/lib/apikeys'

export default function Home() {
  const [selectedTemplate, setSelectedTemplate] = useState(SandboxTemplate.CodeInterpreterMultilang)
  const [session, setSession] = useState<Session | null>(null)
  const [apiKey, setApiKey] = useState<string | undefined>(undefined)
  const [isAuthDialogOpen, setAuthDialog] = useState(false)

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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)

      if (_event === 'SIGNED_IN') {
        setAuthDialog(false)
        getUserAPIKeys(session as Session).then(setApiKey)
      }

      if (_event === 'SIGNED_OUT') {
        setApiKey(undefined)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  function handleSubmitAuth(e: React.FormEvent<HTMLFormElement>) {
    if (!session) {
      e.preventDefault()
      return setAuthDialog(true)
    }

    handleSubmit(e)
  }

  return (
    <main className="flex min-h-screen max-h-screen">
      <AuthDialog open={isAuthDialogOpen} setOpen={setAuthDialog} supabase={supabase} />
      <NavBar session={session} showLogin={() => setAuthDialog(true)} />
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
