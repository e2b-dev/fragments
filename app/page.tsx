'use client'

import { createSandbox } from './actions/sandbox'
import { AuthDialog } from '@/components/auth-dialog'
import { Chat } from '@/components/chat'
import { ChatInput } from '@/components/chat-input'
import { ChatPicker } from '@/components/chat-picker'
import { NavBar } from '@/components/navbar'
import { SideView } from '@/components/side-view'
import { AuthViewType, useAuth } from '@/lib/auth'
import { Message, toAISDKMessages, toMessageImage } from '@/lib/messages'
import { LLMModelConfig } from '@/lib/models'
import modelsList from '@/lib/models.json'
import { ArtifactSchema, artifactSchema as schema } from '@/lib/schema'
import { supabase } from '@/lib/supabase'
import templates, { TemplateId } from '@/lib/templates'
import { ExecutionResult } from '@/lib/types'
import { DeepPartial } from 'ai'
import { experimental_useObject as useObject } from 'ai/react'
import { usePostHog } from 'posthog-js/react'
import { useEffect, useState } from 'react'
import { useLocalStorage } from 'usehooks-ts'

export default function Home() {
  const [chatInput, setChatInput] = useLocalStorage('chat', '')
  const [files, setFiles] = useState<File[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<'auto' | TemplateId>(
    'auto',
  )
  const [languageModel, setLanguageModel] = useLocalStorage<LLMModelConfig>(
    'languageModel',
    {
      model: 'claude-3-5-sonnet-20240620',
    },
  )

  const posthog = usePostHog()

  const [result, setResult] = useState<Partial<ExecutionResult>>()
  const [messages, setMessages] = useState<Message[]>([])
  const [artifact, setArtifact] = useState<
    DeepPartial<ArtifactSchema> | undefined
  >()
  const [currentTab, setCurrentTab] = useState<'code' | 'artifact'>('code')
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [isAuthDialogOpen, setAuthDialog] = useState(false)
  const [authView, setAuthView] = useState<AuthViewType>('sign_in')
  const { session, apiKey } = useAuth(setAuthDialog, setAuthView)

  const currentModel = modelsList.models.find(
    (model) => model.id === languageModel.model,
  )
  const currentTemplate =
    selectedTemplate === 'auto'
      ? templates
      : { [selectedTemplate]: templates[selectedTemplate] }
  const lastMessage = messages[messages.length - 1]

  const { object, submit, isLoading, stop, error } = useObject({
    api:
      currentModel?.id === 'o1-preview' || currentModel?.id === 'o1-mini'
        ? '/api/chat-o1'
        : '/api/chat',
    schema,
    onFinish: async ({ object: artifact, error }) => {
      if (!error) {
        // send it to /api/sandbox
        console.log('artifact', artifact)

        const result = await createSandbox({
          artifact: artifact as ArtifactSchema,
          userID: session?.user?.id || 'none',
          apiKey,
        })

        console.log('result', result)

        setResult(result)
        setCurrentPreview({ object: artifact, result })
        setMessage({ result })
        setCurrentTab('artifact')
        setIsPreviewLoading(false)
      }
    },
  })

  useEffect(() => {
    if (object) {
      setArtifact(object)
      const content: Message['content'] = [
        { type: 'text', text: object.commentary || '' },
        { type: 'code', text: object.code || '' },
      ]

      if (!lastMessage || lastMessage.role !== 'assistant') {
        addMessage({
          role: 'assistant',
          content,
          object,
        })
      }

      if (lastMessage && lastMessage.role === 'assistant') {
        setMessage({
          content,
          object,
        })
      }
    }
  }, [object])

  useEffect(() => {
    if (error) stop()
  }, [error])

  function setMessage(message: Partial<Message>, index?: number) {
    setMessages((previousMessages) => {
      const updatedMessages = [...previousMessages]
      updatedMessages[index ?? previousMessages.length - 1] = {
        ...previousMessages[index ?? previousMessages.length - 1],
        ...message,
      }

      return updatedMessages
    })
  }

  async function handleSubmitAuth(e: React.FormEvent<HTMLFormElement>) {
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
      images.forEach((image) => {
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

    setChatInput('')
    setFiles([])
    setCurrentTab('code')
    setIsPreviewLoading(true)

    posthog.capture('chat_submit', {
      template: selectedTemplate,
      model: languageModel.model,
    })
  }

  function retry() {
    submit({
      userID: session?.user?.id,
      messages: toAISDKMessages(messages),
      template: currentTemplate,
      model: currentModel,
      config: languageModel,
    })
  }

  function addMessage(message: Message) {
    setMessages((previousMessages) => [...previousMessages, message])
    return [...messages, message]
  }

  function handleSaveInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setChatInput(e.target.value)
  }

  function handleFileChange(files: File[]) {
    setFiles(files)
  }

  function logout() {
    supabase
      ? supabase.auth.signOut()
      : console.warn('Supabase is not initialized')
  }

  function handleLanguageModelChange(e: LLMModelConfig) {
    setLanguageModel({ ...languageModel, ...e })
  }

  function handleSocialClick(target: 'github' | 'x' | 'discord') {
    if (target === 'github') {
      window.open('https://github.com/e2b-dev/ai-artifacts', '_blank')
    } else if (target === 'x') {
      window.open('https://x.com/e2b_dev', '_blank')
    } else if (target === 'discord') {
      window.open('https://discord.gg/U7KEcGErtQ', '_blank')
    }

    posthog.capture(`${target}_click`)
  }

  function handleNewChat() {
    stop()
    setChatInput('')
    setFiles([])
    setMessages([])
    setArtifact(undefined)
    setResult(undefined)
    setCurrentTab('code')
    setIsPreviewLoading(false)
  }

  function setCurrentPreview(preview: {
    object: DeepPartial<ArtifactSchema> | undefined
    result: Partial<ExecutionResult> | undefined
  }) {
    setArtifact(preview.object)
    setResult(preview.result)
  }

  function handleUndo() {
    setMessages((previousMessages) => [...previousMessages.slice(0, -2)])
    setCurrentPreview({ object: undefined, result: undefined })
  }

  return (
    <main className="flex min-h-screen max-h-screen">
      {supabase && (
        <AuthDialog
          open={isAuthDialogOpen}
          setOpen={setAuthDialog}
          view={authView}
          supabase={supabase}
        />
      )}
      <div className="grid w-full md:grid-cols-2">
        <div
          className={`flex flex-col w-full max-h-full max-w-[800px] mx-auto px-4 overflow-auto ${artifact ? 'col-span-1' : 'col-span-2'}`}
        >
          <NavBar
            session={session}
            showLogin={() => setAuthDialog(true)}
            signOut={logout}
            onSocialClick={handleSocialClick}
            onNewChat={handleNewChat}
            languageModel={languageModel}
            onLanguageModelChange={handleLanguageModelChange}
            apiKeyConfigurable={!process.env.NEXT_PUBLIC_USE_HOSTED_MODELS}
            baseURLConfigurable={!process.env.NEXT_PUBLIC_USE_HOSTED_MODELS}
            canUndo={messages.length > 1 && !isLoading}
            onUndo={handleUndo}
          />
          <Chat messages={messages} setCurrentPreview={setCurrentPreview} />
          <ChatInput
            error={error}
            retry={retry}
            isLoading={isLoading}
            stop={stop}
            input={chatInput}
            handleInputChange={handleSaveInputChange}
            handleSubmit={handleSubmitAuth}
            isMultiModal={currentModel?.multiModal || false}
            files={files}
            handleFileChange={handleFileChange}
          >
            <ChatPicker
              templates={templates}
              selectedTemplate={selectedTemplate}
              onSelectedTemplateChange={setSelectedTemplate}
              models={modelsList.models}
              languageModel={languageModel}
              onLanguageModelChange={handleLanguageModelChange}
            />
          </ChatInput>
        </div>
        <SideView
          apiKey={apiKey}
          selectedTab={currentTab}
          onSelectedTabChange={setCurrentTab}
          isLoading={isPreviewLoading}
          artifact={artifact}
          result={result as ExecutionResult}
          onClose={() => setArtifact(undefined)}
        />
      </div>
    </main>
  )
}
