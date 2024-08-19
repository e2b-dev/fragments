'use client'

import { useState } from 'react'
import { experimental_useObject as useObject } from 'ai/react';
import { useLocalStorage } from 'usehooks-ts'
import { outputSchema as schema } from '@/lib/schema'

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

  const { object, submit, isLoading, stop, error } = useObject({
    api: '/api/chat',
    schema,
    onFinish: async ({ object: config, error }) => {
      if (!error) {
        // send it to /api/sandbox
        const response = await fetch('/api/sandbox', {
          method: 'POST',
          body: JSON.stringify({
            config,
            userID: session?.user?.id,
            apiKey
          })
        })

        console.log('response', await response.json())
      }
    }
  })

  function handleSubmitAuth (e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!session) {
      return setAuthDialog(true)
    }

    submit({
      userID: session?.user?.id,
      prompt: chatInput,
      template: selectedTemplate,
      model: currentModel,
      config: languageModel,
    })

    setChatInput('')
  }

  function handleSaveInputChange (e: React.ChangeEvent<HTMLInputElement>) {
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
        {object && <pre>{JSON.stringify(object, null, 2)}</pre>}
        <Chat
          // messages={messages}
          input={chatInput}
          handleInputChange={handleSaveInputChange}
          handleSubmit={handleSubmitAuth}
        />
        {/* <SideView
          toolInvocation={latestToolInvocation}
          data={data}
          selectedTemplate={selectedTemplate}
        /> */}
      </div>
    </main>
  )
}
