import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { Provider, SupabaseClient } from '@supabase/supabase-js'
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Loader2,
  Mail,
} from 'lucide-react'
import React, { useCallback, useEffect, useState } from 'react'
import * as SimpleIcons from 'simple-icons'

const VIEWS = {
  SIGN_IN: 'sign_in',
  SIGN_UP: 'sign_up',
  FORGOTTEN_PASSWORD: 'forgotten_password',
  MAGIC_LINK: 'magic_link',
  UPDATE_PASSWORD: 'update_password',
} as const

export type ViewType = (typeof VIEWS)[keyof typeof VIEWS]

type RedirectTo = undefined | string

export interface AuthProps {
  supabaseClient: SupabaseClient
  socialLayout?: 'horizontal' | 'vertical'
  providers?: Provider[]
  view?: ViewType
  redirectTo?: RedirectTo
  onlyThirdPartyProviders?: boolean
  magicLink?: boolean
  onSignUpValidate?: (email: string, password: string) => Promise<boolean>
  metadata?: Record<string, any>
}

interface SubComponentProps {
  supabaseClient: SupabaseClient
  setAuthView: (view: ViewType) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setMessage: (message: string | null) => void
  clearMessages: () => void
  loading: boolean
  redirectTo?: RedirectTo
}

interface SocialAuthProps {
  supabaseClient: SupabaseClient
  providers: Provider[]
  layout?: 'horizontal' | 'vertical'
  redirectTo?: RedirectTo
  setLoading: (loading: boolean) => void
  setError: (error: string) => void
  clearMessages: () => void
  loading: boolean
}

interface EmailAuthProps extends SubComponentProps {
  view: typeof VIEWS.SIGN_IN | typeof VIEWS.SIGN_UP
  magicLink?: boolean
  onSignUpValidate?: (email: string, password: string) => Promise<boolean>
  metadata?: Record<string, any>
}

interface UseAuthFormReturn {
  loading: boolean
  error: string | null
  message: string | null
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setMessage: (message: string | null) => void
  clearMessages: () => void
}

const ProviderIcons: {
  [key in Provider]?: React.ComponentType<{ className?: string }>
} = {
  github: ({ className }) => (
    <svg
      role="img"
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      dangerouslySetInnerHTML={{ __html: SimpleIcons.siGithub.svg }}
    />
  ),
  google: ({ className }) => (
    <svg
      role="img"
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      dangerouslySetInnerHTML={{ __html: SimpleIcons.siGoogle.svg }}
    />
  ),
}

function useAuthForm(): UseAuthFormReturn {
  const [loading, setLoading] = useState(false)
  const [error, setErrorState] = useState<string | null>(null)
  const [message, setMessageState] = useState<string | null>(null)

  const setError = useCallback((errorMsg: string | null) => {
    setErrorState(errorMsg)
    if (errorMsg) setMessageState(null)
  }, [])

  const setMessage = useCallback((msg: string | null) => {
    setMessageState(msg)
    if (msg) setErrorState(null)
  }, [])

  const clearMessages = useCallback(() => {
    setErrorState(null)
    setMessageState(null)
  }, [])

  return {
    loading,
    error,
    message,
    setLoading,
    setError,
    setMessage,
    clearMessages,
  }
}

function SocialAuth({
  supabaseClient,
  providers,
  layout = 'vertical',
  redirectTo,
  setLoading,
  setError,
  clearMessages,
  loading,
}: SocialAuthProps) {
  const handleProviderSignIn = async (provider: Provider) => {
    clearMessages()
    setLoading(true)
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    })
    if (error) setError(error.message)
  }

  return (
    <div
      className={cn(
        'space-y-3',
        layout === 'horizontal' && 'flex space-y-0 space-x-3',
      )}
    >
      {providers.map((provider) => {
        const IconComponent = ProviderIcons[provider]
        const providerName =
          provider.charAt(0).toUpperCase() + provider.slice(1)
        return (
          <Button
            key={provider}
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={() => handleProviderSignIn(provider)}
            disabled={loading}
          >
            {IconComponent && <IconComponent className="h-4 w-4" />}
            {layout === 'vertical'
              ? `Continue with ${providerName}`
              : providerName}
          </Button>
        )
      })}
    </div>
  )
}

function EmailAuth({
  supabaseClient,
  view,
  setAuthView,
  setLoading,
  setError,
  setMessage,
  clearMessages,
  loading,
  redirectTo,
  magicLink,
  onSignUpValidate,
  metadata,
}: Omit<EmailAuthProps, 'email' | 'setEmail' | 'password' | 'setPassword'> & {
  view: typeof VIEWS.SIGN_IN | typeof VIEWS.SIGN_UP
  magicLink?: boolean
  metadata?: Record<string, any>
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    clearMessages()
    setLoading(true)

    try {
      if (view === VIEWS.SIGN_IN) {
        const { error } = await supabaseClient.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      } else if (view === VIEWS.SIGN_UP) {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match')
        }
        if (onSignUpValidate) {
          const isValid = await onSignUpValidate(email, password)
          if (!isValid) {
            throw new Error(
              'Invalid email address. Please use a different email.',
            )
          }
        }
        const { data, error } = await supabaseClient.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectTo,
            data: metadata,
          },
        })
        if (error) throw error
        if (data.user && !data.session) {
          setMessage('Check your email for the confirmation link.')
        }
      }
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      id={view === VIEWS.SIGN_IN ? 'auth-sign-in' : 'auth-sign-up'}
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="pl-10"
            autoComplete="email"
          />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Button
            variant="link"
            type="button"
            onClick={() => setAuthView(VIEWS.FORGOTTEN_PASSWORD)}
            className={cn(
              'p-0 h-auto font-normal text-muted-foreground text-sm',
              view === VIEWS.SIGN_UP && 'invisible',
            )}
          >
            Forgot your password?
          </Button>
        </div>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="pl-10"
            autoComplete={
              view === VIEWS.SIGN_IN ? 'current-password' : 'new-password'
            }
          />
        </div>
      </div>
      {view === VIEWS.SIGN_UP && (
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="confirm-password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="pl-10"
              autoComplete="new-password"
            />
          </div>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {view === VIEWS.SIGN_IN ? 'Sign In' : 'Sign Up'}
      </Button>

      <div className="text-center text-sm space-y-2">
        {view === VIEWS.SIGN_IN && magicLink && (
          <Button
            variant="link"
            type="button"
            onClick={() => setAuthView(VIEWS.MAGIC_LINK)}
            className="p-0 h-auto font-normal"
          >
            Sign in with magic link
          </Button>
        )}
        {view === VIEWS.SIGN_IN ? (
          <p className="text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Button
              variant="link"
              type="button"
              onClick={() => setAuthView(VIEWS.SIGN_UP)}
              className="p-0 h-auto underline"
            >
              Sign up
            </Button>
          </p>
        ) : (
          <p className="text-muted-foreground">
            Already have an account?{' '}
            <Button
              variant="link"
              type="button"
              onClick={() => setAuthView(VIEWS.SIGN_IN)}
              className="p-0 h-auto underline"
            >
              Sign in
            </Button>
          </p>
        )}
      </div>
    </form>
  )
}

function MagicLink({
  supabaseClient,
  setAuthView,
  setLoading,
  setError,
  setMessage,
  clearMessages,
  loading,
  redirectTo,
}: SubComponentProps) {
  const [email, setEmail] = useState('')

  const handleMagicLinkSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    clearMessages()
    setLoading(true)
    const { error } = await supabaseClient.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    })
    if (error) setError(error.message)
    else setMessage('Check your email for the magic link.')
    setLoading(false)
  }

  return (
    <form
      id="auth-magic-link"
      onSubmit={handleMagicLinkSignIn}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="pl-10"
            autoComplete="email"
          />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Send Magic Link
      </Button>
      <div className="text-center text-sm">
        <Button
          variant="link"
          type="button"
          onClick={() => setAuthView(VIEWS.SIGN_IN)}
          className="p-0 h-auto font-normal"
        >
          Sign in with password instead
        </Button>
      </div>
    </form>
  )
}

function ForgottenPassword({
  supabaseClient,
  setAuthView,
  setLoading,
  setError,
  setMessage,
  clearMessages,
  loading,
  redirectTo,
}: Omit<SubComponentProps, 'email' | 'setEmail'>) {
  const [email, setEmail] = useState('')

  const handlePasswordReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    clearMessages()
    setLoading(true)
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo,
    })
    if (error) setError(error.message)
    else setMessage('Check your email for password reset instructions.')
    setLoading(false)
  }

  return (
    <form
      id="auth-forgot-password"
      onSubmit={handlePasswordReset}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="pl-10"
            autoComplete="email"
          />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Send Reset Instructions
      </Button>
      <div className="text-center text-sm">
        <Button
          variant="link"
          type="button"
          onClick={() => setAuthView(VIEWS.SIGN_IN)}
          className="p-0 h-auto underline"
        >
          Back to Sign In
        </Button>
      </div>
    </form>
  )
}

function UpdatePassword({
  supabaseClient,
  setLoading,
  setError,
  setMessage,
  clearMessages,
  loading,
}: Omit<
  SubComponentProps,
  'setAuthView' | 'redirectTo' | 'email' | 'setEmail'
>) {
  const [password, setPassword] = useState('')

  const handlePasswordUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    clearMessages()
    setLoading(true)
    const { error } = await supabaseClient.auth.updateUser({ password })
    if (error) setError(error.message)
    else setMessage('Password updated successfully.')
    setLoading(false)
    if (!error) setPassword('')
  }

  return (
    <form
      id="auth-update-password"
      onSubmit={handlePasswordUpdate}
      className="space-y-4"
    >
      <h3 className="text-lg font-semibold">Update Password</h3>
      <div className="space-y-2">
        <Label htmlFor="new-password">New Password</Label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="new-password"
            type="password"
            placeholder="Enter new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="pl-10"
            autoComplete="new-password"
          />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Update Password
      </Button>
    </form>
  )
}

function Auth({
  supabaseClient,
  socialLayout = 'vertical',
  providers,
  view = VIEWS.SIGN_IN,
  redirectTo,
  onlyThirdPartyProviders = false,
  magicLink = false,
  onSignUpValidate,
  metadata,
}: AuthProps): JSX.Element | null {
  const [authView, setAuthView] = useState<ViewType>(view)
  const {
    loading,
    error,
    message,
    setLoading,
    setError,
    setMessage,
    clearMessages,
  } = useAuthForm()

  useEffect(() => {
    setAuthView(view)
    setError(null)
    setMessage(null)
  }, [view, setError, setMessage])

  const commonProps = {
    supabaseClient,
    setAuthView,
    setLoading,
    setError,
    setMessage,
    clearMessages,
    loading,
    redirectTo,
  }

  const Container = ({ children }: { children: React.ReactNode }) => (
    <>
      {providers && providers.length > 0 && (
        <SocialAuth
          supabaseClient={supabaseClient}
          providers={providers}
          layout={socialLayout}
          redirectTo={redirectTo}
          setLoading={setLoading}
          setError={setError}
          clearMessages={clearMessages}
          loading={loading}
        />
      )}
      {providers && providers.length > 0 && !onlyThirdPartyProviders && (
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
      )}
      {!onlyThirdPartyProviders && children}
    </>
  )

  let viewComponent: React.ReactNode = null

  switch (authView) {
    case VIEWS.SIGN_IN:
      viewComponent = (
        <EmailAuth
          {...commonProps}
          view={VIEWS.SIGN_IN}
          magicLink={magicLink}
        />
      )
      break
    case VIEWS.SIGN_UP:
      viewComponent = (
        <EmailAuth
          {...commonProps}
          view={VIEWS.SIGN_UP}
          magicLink={false}
          onSignUpValidate={onSignUpValidate}
          metadata={metadata}
        />
      )
      break
    case VIEWS.FORGOTTEN_PASSWORD:
      viewComponent = <ForgottenPassword {...commonProps} />
      break
    case VIEWS.MAGIC_LINK:
      viewComponent = <MagicLink {...commonProps} />
      break
    case VIEWS.UPDATE_PASSWORD:
      viewComponent = <UpdatePassword {...commonProps} />
      break
    default:
      viewComponent = null
  }

  return (
    <div className="w-full space-y-4">
      {authView === VIEWS.UPDATE_PASSWORD ? (
        viewComponent
      ) : (
        <Container>{viewComponent}</Container>
      )}

      <div className="mt-4 space-y-2">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {message && (
          <Alert variant="default">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}

export default Auth
