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

import { LLMModel, LLMModelConfig } from '@/lib/models'
import modelsList from '@/lib/models.json'

export default function Home() {
  const [chatInput, setChatInput] = useLocalStorage('chat', '')
  const [selectedTemplate, setSelectedTemplate] = useState(SandboxTemplate.CodeInterpreterMultilang)
  // reduce this to only fields needed
  const [languageModel, setLanguageModel] = useLocalStorage<LLMModelConfig>('languageModel', {
    model: 'claude-3-5-sonnet-20240620'
  })

  const [isAuthDialogOpen, setAuthDialog] = useState(false)
  const { session, apiKey } = useAuth(setAuthDialog)

  const filteredModels = modelsList.models.filter((model: LLMModel) => {
    if (process.env.NEXT_PUBLIC_USE_HOSTED_MODELS === 'true') {
      return model.hosted
    }

    return true
  })

  const currentModel = filteredModels.find((model: LLMModel) => model.id === languageModel.model)

  const { messages, handleInputChange, handleSubmit, data } = useChat({
    api: '/api/chat',
    body: {
      userID: session?.user?.id,
      template: selectedTemplate,
      model: currentModel,
      config: languageModel,
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
    setChatInput('')
  }

  function handleSaveInputChange (e: React.ChangeEvent<HTMLInputElement>) {
    handleInputChange(e)
    setChatInput(e.target.value)
  }

  function logout () {
    supabase ? supabase.auth.signOut() : console.warn('Supabase is not initialized')
  }

  function handleLanguageModelChange (e: LLMModelConfig) {
    setLanguageModel({ ...languageModel, ...e })
  }

  return (
    <main className="flex min-h-screen max-h-screen">
      {
        supabase && <AuthDialog open={isAuthDialogOpen} setOpen={setAuthDialog} supabase={supabase} />
      }
      <NavBar
        session={session}
        showLogin={() => setAuthDialog(true)}
        signOut={logout}
        selectedTemplate={selectedTemplate}
        onSelectedTemplateChange={setSelectedTemplate}
        models={filteredModels}
        languageModel={languageModel}
        onLanguageModelChange={handleLanguageModelChange}
        apiKeyConfigurable={!process.env.NEXT_PUBLIC_USE_HOSTED_MODELS}
      />

      <div className="flex-1 flex space-x-8 w-full pt-36 pb-8 px-4">
        <Chat
          messages={messages}
          input={chatInput}
          handleInputChange={handleSaveInputChange}
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
