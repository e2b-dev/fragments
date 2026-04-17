'use client'

import { DesktopGate } from '@/components/builder/desktop-gate'
import { Chat } from '@/components/chat'
import { ChatInput } from '@/components/chat-input'
import { ChatPicker } from '@/components/chat-picker'
import { ChatSettings } from '@/components/chat-settings'
import { LandingHero } from '@/components/landing-hero'
import { useReducedMotion } from '@/components/motion-provider'
import { NavBar, type SessionInfo } from '@/components/navbar'
import { PreviewPane } from '@/components/preview/preview-pane'
import { PromptGateOverlay } from '@/components/prompt-gate-overlay'
import { getVariant } from '@/lib/chat'
import { AppError, ErrorCode } from '@/lib/errors'
import { type Message, toAISDKMessages, toMessageImage } from '@/lib/messages'
import type { LLMModelConfig } from '@/lib/models'
import modelsList from '@/lib/models.json'
import { type FragmentSchema, fragmentSchema as schema } from '@/lib/schema'
import templates from '@/lib/templates'
import type { ExecutionResult } from '@/lib/types'
import { useSandboxStore } from '@/stores/use-sandbox-store'
import type { DeepPartial } from 'ai'
import { experimental_useObject as useObject } from 'ai/react'
import { AnimatePresence, motion } from 'motion/react'
import { useSearchParams } from 'next/navigation'
import { usePostHog } from 'posthog-js/react'
import { type SetStateAction, Suspense, useEffect, useRef, useState } from 'react'
import { useLocalStorage } from 'usehooks-ts'

function Home() {
  const [chatInput, setChatInput] = useLocalStorage('chat', '')
  const [files, setFiles] = useState<File[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('auto')
  const [languageModel, setLanguageModel] = useLocalStorage<LLMModelConfig>('languageModel', {
    model: 'claude-sonnet-4.6',
  })

  const posthog = usePostHog()

  const [result, setResult] = useState<ExecutionResult>()
  const [messages, setMessages] = useState<Message[]>([])
  const [fragment, setFragment] = useState<DeepPartial<FragmentSchema>>()
  const [currentTab, setCurrentTab] = useState<'code' | 'fragment'>('code')
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [errorDismissed, setErrorDismissed] = useState(false)
  const [session, setSession] = useState<SessionInfo | null>(null)
  const [showAuthGate, setShowAuthGate] = useState(false)
  const [pendingAutoSubmit, setPendingAutoSubmit] = useState(false)
  const searchParams = useSearchParams()

  // Fetch session on mount for auth-aware UI
  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data: { authenticated: boolean; session?: SessionInfo }) => {
        if (data.authenticated && data.session) {
          setSession(data.session)
        }
      })
      .catch(() => {
        // Silently fail — user stays unauthenticated
      })
  }, [])

  // Resume flow: auto-submit saved prompt after SSO redirect
  useEffect(() => {
    if (searchParams.get('resume') === 'true' && session) {
      const savedPrompt = sessionStorage.getItem('flamingo_pending_prompt')
      if (savedPrompt) {
        sessionStorage.removeItem('flamingo_pending_prompt')
        setChatInput(savedPrompt)
        setPendingAutoSubmit(true)
      }
    }
  }, [searchParams, session, setChatInput])

  const [useMorphApply, setUseMorphApply] = useLocalStorage(
    'useMorphApply',
    process.env.NEXT_PUBLIC_USE_MORPH_APPLY === 'true',
  )

  const filteredModels = modelsList.models.filter((model) => {
    if (process.env.NEXT_PUBLIC_HIDE_LOCAL_MODELS) {
      return model.providerId !== 'ollama'
    }
    return true
  })

  const defaultModel =
    filteredModels.find((model) => model.id === 'claude-sonnet-4.6') || filteredModels[0]

  const currentModel =
    filteredModels.find((model) => model.id === languageModel.model) || defaultModel

  // Update localStorage if stored model no longer exists
  useEffect(() => {
    if (languageModel.model && !filteredModels.find((m) => m.id === languageModel.model)) {
      setLanguageModel({ ...languageModel, model: defaultModel.id })
    }
  }, [languageModel.model])
  const currentTemplate =
    selectedTemplate === 'auto' ? templates : { [selectedTemplate]: templates[selectedTemplate] }
  const lastMessage = messages[messages.length - 1]

  // Determine which API to use based on morph toggle and existing fragment
  const shouldUseMorph = useMorphApply && fragment && fragment.code && fragment.file_path
  const apiEndpoint = shouldUseMorph ? '/api/morph-chat' : '/api/chat'

  const { object, submit, isLoading, stop, error } = useObject({
    api: apiEndpoint,
    schema,
    onError: (error) => {
      console.error('Error submitting request:', error)
      if (error.message.includes('limit')) {
        setIsRateLimited(true)
      }

      setErrorMessage(error.message)
      setErrorDismissed(false)
      useSandboxStore
        .getState()
        .setSandboxError(AppError.fromUnknown(error, ErrorCode.GENERATION_FAILED))
    },
    onFinish: async ({ object: fragment, error }) => {
      if (error) {
        console.error('Fragment generation failed:', error)
        setErrorMessage(error.message || 'Failed to generate fragment')
        setErrorDismissed(false)
        useSandboxStore
          .getState()
          .setSandboxError(AppError.fromUnknown(error, ErrorCode.GENERATION_FAILED))
        return
      }

      // send it to /api/sandbox
      console.log('fragment', fragment)
      setIsPreviewLoading(true)
      posthog.capture('fragment_generated', {
        template: fragment?.template,
      })

      const response = await fetch('/api/sandbox', {
        method: 'POST',
        body: JSON.stringify({
          fragment,
          sbxId: result?.sbxId,
        }),
      })

      if (!response.ok) {
        console.error('Sandbox request failed:', response.status)
        setErrorMessage('Failed to create sandbox preview')
        setErrorDismissed(false)
        setIsPreviewLoading(false)
        useSandboxStore.getState().setSandboxError(
          new AppError({
            code: ErrorCode.SANDBOX_BOOT_FAILED,
            httpStatus: response.status,
            userMessage: 'Preview failed to load',
            message: `Sandbox request failed: ${response.status}`,
          }),
        )
        return
      }

      const sandboxResult = await response.json()
      console.log('result', sandboxResult)
      posthog.capture('sandbox_created', { url: sandboxResult.url })

      setResult(sandboxResult)
      setCurrentPreview({ fragment, result: sandboxResult })
      setMessage({ result: sandboxResult })
      setCurrentTab('fragment')
      setIsPreviewLoading(false)

      // Bridge: update sandbox store so PreviewPane shows the iframe
      if (sandboxResult.url && sandboxResult.sbxId) {
        useSandboxStore.getState().setSandboxReady(sandboxResult.sbxId, sandboxResult.url)
      } else {
        useSandboxStore.getState().resetSandbox()
      }
    },
  })

  useEffect(() => {
    if (object) {
      setFragment(object)
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

    // Auth gate: if not authenticated, save prompt and show overlay
    if (!session) {
      sessionStorage.setItem('flamingo_pending_prompt', chatInput)
      setShowAuthGate(true)
      return
    }

    if (isLoading) {
      stop()
    }

    const content: Message['content'] = [{ type: 'text', text: chatInput }]
    const images = await toMessageImage(files)

    if (images.length > 0) {
      for (const image of images) {
        content.push({ type: 'image', image })
      }
    }

    const updatedMessages = addMessage({
      role: 'user',
      content,
    })

    submit({
      messages: toAISDKMessages(updatedMessages),
      template: currentTemplate,
      model: currentModel,
      config: languageModel,
      ...(shouldUseMorph && fragment ? { currentFragment: fragment } : {}),
    })

    setChatInput('')
    setFiles([])
    setCurrentTab('code')
    useSandboxStore.getState().bootSandbox({ type: 'template' })

    posthog.capture('chat_submit', {
      template: selectedTemplate,
      model: languageModel.model,
    })
  }

  // Auto-submit when pending resume has populated the input.
  // Ref avoids stale closure and keeps deps minimal.
  const handleSubmitRef = useRef(handleSubmitAuth)
  handleSubmitRef.current = handleSubmitAuth

  useEffect(() => {
    if (pendingAutoSubmit && chatInput) {
      setPendingAutoSubmit(false)
      handleSubmitRef.current({ preventDefault: () => {} } as React.FormEvent<HTMLFormElement>)
    }
  }, [pendingAutoSubmit, chatInput])

  function retry() {
    submit({
      messages: toAISDKMessages(messages),
      template: currentTemplate,
      model: currentModel,
      config: languageModel,
      ...(shouldUseMorph && fragment ? { currentFragment: fragment } : {}),
    })
  }

  function addMessage(message: Message) {
    setMessages((previousMessages) => [...previousMessages, message])
    return [...messages, message]
  }

  function handleSaveInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setChatInput(e.target.value)
  }

  function handleFileChange(change: SetStateAction<File[]>) {
    setFiles(change)
  }

  function handleLanguageModelChange(e: LLMModelConfig) {
    setLanguageModel({ ...languageModel, ...e })
  }

  function handleClearChat() {
    stop()
    setChatInput('')
    setFiles([])
    setMessages([])
    setFragment(undefined)
    setResult(undefined)
    setCurrentTab('code')
    setIsPreviewLoading(false)
  }

  function setCurrentPreview(preview: {
    fragment: DeepPartial<FragmentSchema> | undefined
    result: ExecutionResult | undefined
  }) {
    setFragment(preview.fragment)
    setResult(preview.result)
  }

  function handleUndo() {
    setMessages((previousMessages) => [...previousMessages.slice(0, -2)])
    setCurrentPreview({ fragment: undefined, result: undefined })
  }

  const isLanding = messages.length === 0 && !isLoading

  // SPA navigation: back button returns to Onseason dashboard
  useEffect(() => {
    if (isLanding) return

    const dashboardUrl = process.env.NEXT_PUBLIC_ONSEASON_BASE_URL ?? '/'
    window.history.replaceState(null, '', window.location.pathname)

    function handlePopState() {
      window.location.href = dashboardUrl
    }

    window.history.pushState(null, '', window.location.pathname)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [isLanding])

  const prefersReducedMotion = useReducedMotion()
  const landingExitVariant = getVariant('landingExit', prefersReducedMotion)
  const builderLeftVariant = getVariant('builderEnterLeft', prefersReducedMotion)
  const builderRightVariant = getVariant('builderEnterRight', prefersReducedMotion)

  return (
    <DesktopGate>
      <main className="flex min-h-screen max-h-screen">
        <AnimatePresence mode="popLayout">
          {isLanding ? (
            /* -- Landing page layout -- */
            <motion.div
              key="landing"
              className="flex flex-col w-full max-h-full overflow-auto"
              initial={landingExitVariant.initial}
              animate={landingExitVariant.animate}
              exit={{}}
              transition={landingExitVariant.transition}
            >
              <div className="max-w-[900px] w-full mx-auto px-4">
                <NavBar session={session} />
              </div>
              <motion.div
                className="flex-1 flex flex-col"
                exit={{ opacity: 0, y: 60 }}
                transition={{ duration: 0.35, ease: 'easeIn' }}
              >
                <LandingHero
                  input={chatInput}
                  onInputChange={handleSaveInputChange}
                  onSubmit={handleSubmitAuth}
                  isLoading={isLoading}
                  stop={stop}
                  isMultiModal={currentModel?.multiModal || false}
                  files={files}
                  handleFileChange={handleFileChange}
                  isErrored={error !== undefined || !!errorMessage}
                  errorMessage={errorMessage}
                  isRateLimited={isRateLimited}
                  retry={retry}
                >
                  <ChatPicker
                    templates={templates}
                    selectedTemplate={selectedTemplate}
                    onSelectedTemplateChange={setSelectedTemplate}
                    models={filteredModels}
                    languageModel={languageModel}
                    onLanguageModelChange={handleLanguageModelChange}
                  />
                  <ChatSettings
                    languageModel={languageModel}
                    onLanguageModelChange={handleLanguageModelChange}
                    apiKeyConfigurable={!process.env.NEXT_PUBLIC_NO_API_KEY_INPUT}
                    baseURLConfigurable={!process.env.NEXT_PUBLIC_NO_BASE_URL_INPUT}
                    useMorphApply={useMorphApply}
                    onUseMorphApplyChange={setUseMorphApply}
                  />
                </LandingHero>
              </motion.div>
            </motion.div>
          ) : (
            /* -- Chat + Preview split layout -- */
            <motion.div
              key="builder"
              className="grid w-full md:grid-cols-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
            >
              <motion.div
                layout
                className={`flex flex-col w-full max-h-full max-w-[800px] mx-auto px-4 overflow-auto ${fragment ? 'col-span-1' : 'col-span-2'}`}
                initial={builderLeftVariant.initial}
                animate={builderLeftVariant.animate}
                transition={{
                  ...builderLeftVariant.transition,
                  layout: { duration: 0.35, ease: 'easeOut' },
                }}
              >
                <NavBar session={session} />
                <Chat
                  messages={messages}
                  isLoading={isLoading}
                  setCurrentPreview={setCurrentPreview}
                />
                <ChatInput
                  retry={retry}
                  isErrored={!errorDismissed && (error !== undefined || !!errorMessage)}
                  errorMessage={errorMessage}
                  isLoading={isLoading}
                  isRateLimited={isRateLimited}
                  onDismissError={() => setErrorDismissed(true)}
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
                    models={filteredModels}
                    languageModel={languageModel}
                    onLanguageModelChange={handleLanguageModelChange}
                  />
                  <ChatSettings
                    languageModel={languageModel}
                    onLanguageModelChange={handleLanguageModelChange}
                    apiKeyConfigurable={!process.env.NEXT_PUBLIC_NO_API_KEY_INPUT}
                    baseURLConfigurable={!process.env.NEXT_PUBLIC_NO_BASE_URL_INPUT}
                    useMorphApply={useMorphApply}
                    onUseMorphApplyChange={setUseMorphApply}
                  />
                </ChatInput>
              </motion.div>
              <AnimatePresence mode="popLayout">
                {fragment && (
                  <motion.div
                    key="preview"
                    layout
                    initial={builderRightVariant.initial}
                    animate={builderRightVariant.animate}
                    exit={builderRightVariant.exit}
                    transition={builderRightVariant.transition}
                  >
                    <PreviewPane
                      streamingCode={object?.code ?? null}
                      result={result}
                      onClose={() => {
                        setFragment(undefined)
                        setResult(undefined)
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showAuthGate && (
            <PromptGateOverlay
              onSignIn={() => {
                const onseasonUrl = process.env.NEXT_PUBLIC_ONSEASON_BASE_URL ?? ''
                const clientId = process.env.NEXT_PUBLIC_ONSEASON_SSO_CLIENT_ID ?? 'flamingo'
                window.location.href = `${onseasonUrl}/api/sso/authorize?client_id=${clientId}&returnTo=${encodeURIComponent('/?resume=true')}`
              }}
              onDismiss={() => setShowAuthGate(false)}
            />
          )}
        </AnimatePresence>
      </main>
    </DesktopGate>
  )
}

export default function Page() {
  return (
    <Suspense>
      <Home />
    </Suspense>
  )
}
