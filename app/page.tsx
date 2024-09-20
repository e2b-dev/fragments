'use client'

import { useEffect, useState } from 'react'
import { experimental_useObject as useObject } from 'ai/react'
import { useLocalStorage } from 'usehooks-ts'
import { usePostHog } from 'posthog-js/react'
import { ArtifactSchema, artifactSchema as schema } from '@/lib/schema'

import { Chat } from '@/components/chat'
import { SideView } from '@/components/side-view'
import NavBar from '@/components/navbar'

import { supabase } from '@/lib/supabase'
import { AuthDialog } from '@/components/AuthDialog'
import { AuthViewType, useAuth } from '@/lib/auth'
import { Message, toAISDKMessages, toMessageImage } from '@/lib/messages'

import { LLMModel, LLMModelConfig } from '@/lib/models'
import modelsList from '@/lib/models.json'
import templates, { TemplateId } from '@/lib/templates';

import { ExecutionResult } from './api/sandbox/route';

export default function Home() {
  const [chatInput, setChatInput] = useLocalStorage('chat', '')
  const [files, setFiles] = useState<FileList | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<'auto' | TemplateId>('auto')
  const [languageModel, setLanguageModel] = useLocalStorage<LLMModelConfig>('languageModel', {
    model: 'claude-3-5-sonnet-20240620'
  })

  const posthog = usePostHog()

  const [result, setResult] = useState<ExecutionResult>()
  const [messages, setMessages] = useState<Message[]>([])
  const [artifact, setArtifact] = useState<Partial<ArtifactSchema> | undefined>()
  const [currentTab, setCurrentTab] = useState<'code' | 'artifact'>('code')
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [isAuthDialogOpen, setAuthDialog] = useState(false)
  const [authView, setAuthView] = useState<AuthViewType>('sign_in')
  const { session, apiKey } = useAuth(setAuthDialog, setAuthView)

  const currentModel = modelsList.models.find(model => model.id === languageModel.model)
  const currentTemplate = selectedTemplate === 'auto' ? templates : { [selectedTemplate]: templates[selectedTemplate] }

  const { object, submit, isLoading, stop, error } = useObject({
    api: currentModel?.id === 'o1-preview' || currentModel?.id === 'o1-mini' ? '/api/chat-o1' : '/api/chat',
    schema,
    onFinish: async ({ object: artifact, error }) => {
      if (!error) {
        // send it to /api/sandbox
        console.log('artifact', artifact)
        posthog.capture('artifact_generated', {
          template: artifact?.template,
        })

        const response = await fetch('/api/sandbox', {
          method: 'POST',
          body: JSON.stringify({
            artifact,
            userID: session?.user?.id,
            apiKey
          })
        })

        const result = await response.json()
        console.log('result', result)
        posthog.capture('sandbox_created', { url: result.url })

        setResult(result)
        setCurrentTab('artifact')
        setIsPreviewLoading(false)
      }
    }
  })

  useEffect(() => {
    if (object) {
      setArtifact(object as ArtifactSchema)
      const lastAssistantMessage = messages.findLast(message => message.role === 'assistant')
      if (lastAssistantMessage) {
        lastAssistantMessage.content = [{ type: 'text', text: object.commentary || '' }, { type: 'code', text: object.code || '' }]
        lastAssistantMessage.meta = {
          title: object.title,
          description: object.description
        }
      }
    }
  }, [object])

  async function handleSubmitAuth (e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!session) {
      return setAuthDialog(true)
    }

    if (isLoading) {
      stop()
    }

    const content: Message['content'] = [{ type: 'text', text: chatInput }]
    const images = await toMessageImage(files)

    if (images.length > 0) {
      images.forEach(image => {
        content.push({ type: 'image', image })
      })
    }

    const updatedMessages = addMessage({
      role: 'user',
      content,
    })

    submit({
      userID: session?.user?.id,
      messages: toAISDKMessages(updatedMessages),
      template: currentTemplate,
      model: currentModel,
      config: languageModel,
    })

    addMessage({
      role: 'assistant',
      content: [{ type: 'text', text: 'Generating artifact...' }],
    })

    setChatInput('')
    setFiles(null)
    setCurrentTab('code')
    setIsPreviewLoading(true)

    posthog.capture('chat_submit', {
      template: selectedTemplate,
      model: languageModel.model,
    })
  }

  function addMessage (message: Message) {
    setMessages(previousMessages => [...previousMessages, message])
    return [...messages, message]
  }

  function handleSaveInputChange (e: React.ChangeEvent<HTMLInputElement>) {
    setChatInput(e.target.value)
  }

  function handleFileChange (e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setFiles(e.target.files)
    }
  }

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

  function handleNewChat () {
    stop()
    setMessages([])
    setArtifact(undefined)
    setResult(undefined)
    setCurrentTab('code')
    setIsPreviewLoading(false)
  }

  return (
    <main className="flex min-h-screen max-h-screen">
      {
        supabase && <AuthDialog open={isAuthDialogOpen} setOpen={setAuthDialog} view={authView} supabase={supabase} />
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
        onNewChat={handleNewChat}
        apiKeyConfigurable={!process.env.NEXT_PUBLIC_NO_API_KEY_INPUT}
        baseURLConfigurable={!process.env.NEXT_PUBLIC_NO_BASE_URL_INPUT}
      />

      <div className="flex-1 flex space-x-8 w-full pt-36 pb-8 px-4">
        <Chat
          isLoading={isLoading}
          stop={stop}
          messages={messages}
          input={chatInput}
          handleInputChange={handleSaveInputChange}
          handleSubmit={handleSubmitAuth}
          isMultiModal={currentModel?.multiModal || false}
          files={files}
          handleFileChange={handleFileChange}
        />
        <SideView
          selectedTab={currentTab}
          onSelectedTabChange={setCurrentTab}
          isLoading={isPreviewLoading}
          artifact={artifact as ArtifactSchema}
          result={result}
          selectedTemplate={artifact?.template as TemplateId}
        />
      </div>
    </main>
  )
}
