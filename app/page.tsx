'use client'

import { useState } from 'react'
import { useChat } from 'ai/react'
import { useLocalStorage } from 'usehooks-ts'

import { Chat } from '@/components/chat'
import { SideView } from '@/components/side-view'
import { SandboxTemplate } from '@/lib/types'
import NavBar from '@/components/navbar'

import { supabase } from '@/lib/supabase'
import { AuthDialog } from '@/components/AuthDialog'
import { useAuth } from '@/lib/auth'

import { LLMModel } from '@/lib/models'
import modelsList from '@/lib/models.json'

export default function Home() {
  const [selectedTemplate, setSelectedTemplate] = useState(SandboxTemplate.CodeInterpreterMultilang)
  const [selectedLanguageModel, setSelectedLanguageModel] = useLocalStorage('selectedLanguageModel', 'claude-3-5-sonnet-20240620')
  const [languageModelAPIKey, setLanguageModelAPIKey] = useLocalStorage<string | undefined>('languageModelAPIKey', undefined)
  const [isAuthDialogOpen, setAuthDialog] = useState(false)
  const { session, apiKey } = useAuth(setAuthDialog)

  const currentModel = modelsList.models.find((model: LLMModel) => model.id === selectedLanguageModel)

  const { messages, input, handleInputChange, handleSubmit, data } = useChat({
    api: '/api/chat',
    body: {
      userID: session?.user?.id,
      template: selectedTemplate,
      model: currentModel,
      modelAPIKey: languageModelAPIKey,
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
    supabase.auth.signOut()
  }

  return (
    <main className="flex min-h-screen max-h-screen">
      <AuthDialog open={isAuthDialogOpen} setOpen={setAuthDialog} supabase={supabase} />
      <NavBar
        session={session}
        showLogin={() => setAuthDialog(true)}
        signOut={logout}
        selectedTemplate={selectedTemplate}
        onSelectedTemplateChange={setSelectedTemplate}
        models={modelsList.models}
        selectedLanguageModel={selectedLanguageModel}
        onSelectedLanguageModelChange={setSelectedLanguageModel}
        onLanguageModelAPIKeyChange={setLanguageModelAPIKey}
        languageModelAPIKey={languageModelAPIKey}
      />

      <div className="flex-1 flex space-x-8 w-full pt-32 pb-8 px-4">
        <Chat
          messages={messages}
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmitAuth}
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
