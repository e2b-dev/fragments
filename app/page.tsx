'use client'

import { useEffect, useState } from 'react'
import { useChat } from 'ai/react'
import { useLocalStorage } from 'usehooks-ts'
import { usePostHog } from 'posthog-js/react'
import { ArtifactSchema, artifactSchema as schema } from '@/lib/schema'

import { Chat } from '@/components/chat'
import { SideView } from '@/components/side-view'
import NavBar from '@/components/navbar'

import { supabase } from '@/lib/supabase'
import { AuthDialog } from '@/components/AuthDialog'
import { useAuth } from '@/lib/auth'

import { LLMModel, LLMModelConfig } from '@/lib/models'
import modelsList from '@/lib/models.json'
import templates, { TemplateId } from '@/lib/templates';
import { ExecutionResult } from '@/lib/sandbox';

export default function Home() {
  // const [chatInput, setChatInput] = useLocalStorage('chat', '')
  const [selectedTemplate, setSelectedTemplate] = useState<'auto' | TemplateId>('auto')
  const [languageModel, setLanguageModel] = useLocalStorage<LLMModelConfig>('languageModel', {
    model: 'claude-3-5-sonnet-20240620'
  })

  const posthog = usePostHog()
  const [isAuthDialogOpen, setAuthDialog] = useState(false)
  const { session, apiKey } = useAuth(setAuthDialog)

  const currentModel = modelsList.models.find(model => model.id === languageModel.model)
  const currentTemplate = selectedTemplate === 'auto' ? templates : { [selectedTemplate]: templates[selectedTemplate] }

  const { messages, input, handleInputChange, handleSubmit, isLoading, stop, data } = useChat({
    api: '/api/chat',
    body: {
      userID: session?.user?.id,
      template: currentTemplate,
      model: currentModel,
      config: languageModel,
    }
  })

  // console.log({ messages, data })

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

    posthog.capture('chat_submit', {
      template: selectedTemplate,
      model: languageModel.model,
    })
  }

  // function handleSaveInputChange (e: React.ChangeEvent<HTMLInputElement>) {
  //   setChatInput(e.target.value)
  // }

  function logout () {
    supabase ? supabase.auth.signOut() : console.warn('Supabase is not initialized')
  }

  function handleLanguageModelChange (e: LLMModelConfig) {
    setLanguageModel({ ...languageModel, ...e })
  }

  function handleGitHubClick () {
    window.open('https://github.com/e2b-dev/ai-artifacts', '_blank')
    posthog.capture('github_click')
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
        templates={templates}
        selectedTemplate={selectedTemplate}
        onSelectedTemplateChange={setSelectedTemplate}
        models={modelsList.models}
        languageModel={languageModel}
        onLanguageModelChange={handleLanguageModelChange}
        onGitHubClick={handleGitHubClick}
        apiKeyConfigurable={!process.env.NEXT_PUBLIC_USE_HOSTED_MODELS}
        baseURLConfigurable={!process.env.NEXT_PUBLIC_USE_HOSTED_MODELS}
      />

      <div className="flex-1 flex space-x-8 w-full pt-36 pb-8 px-4">
        <Chat
          isLoading={isLoading}
          stop={stop}
          messages={messages}
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmitAuth}
        />
        <SideView
          isLoading={isLoading}
          result={(latestToolInvocation as any)?.result as ExecutionResult}
          selectedTemplate={latestToolInvocation?.args?.template as TemplateId}
        />
      </div>
    </main>
  )
}
