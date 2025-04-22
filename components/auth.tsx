import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { SupabaseClient, Provider } from '@supabase/supabase-js'
import {
  Mail,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
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

export interface AuthProps {
  supabaseClient: SupabaseClient
  socialLayout?: 'horizontal' | 'vertical'
  providers?: Provider[]
  view?: ViewType
  redirectTo?: RedirectTo
  onlyThirdPartyProviders?: boolean
  magicLink?: boolean
  onSignInValidate?: (email: string, password: string) => Promise<void> | void
}

function Auth({
  supabaseClient,
  socialLayout = 'vertical',
  providers,
  view = VIEWS.SIGN_IN,
  redirectTo,
  onlyThirdPartyProviders = false,
  magicLink = false,
  onSignInValidate,
}: AuthProps): JSX.Element | null {
  const [authView, setAuthView] = useState<ViewType>(view)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  useEffect(() => {
    setAuthView(view)
    setError(null)
    setMessage(null)
  }, [view])

  const handleAuthError = (err: Error | null, defaultMessage: string) => {
    if (isMounted.current) {
      setError(err?.message || defaultMessage)
      setLoading(false)
    }
  }

  const handleAuthSuccess = (successMessage: string | null) => {
    if (isMounted.current) {
      setMessage(successMessage)
      setError(null)
      setLoading(false)
    }
  }

  const clearMessages = () => {
    setError(null)
    setMessage(null)
  }

  const renderFeedback = () => (
    <>
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {message && (
        <Alert variant="default" className="mt-4">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
    </>
  )

  const commonProps = {
    supabaseClient,
    setAuthView,
    setLoading,
    setError: (msg: string) => handleAuthError(new Error(msg), msg),
    setMessage: handleAuthSuccess,
    clearMessages,
    loading,
    redirectTo,
    renderFeedback,
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
          setError={(msg) => handleAuthError(new Error(msg), msg)}
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

  switch (authView) {
    case VIEWS.SIGN_IN:
      return (
        <Container>
          <EmailAuth
            {...commonProps}
            view={VIEWS.SIGN_IN}
            magicLink={magicLink}
            onSignInValidate={onSignInValidate}
          />
        </Container>
      )
    case VIEWS.SIGN_UP:
      return (
        <Container>
          <EmailAuth {...commonProps} view={VIEWS.SIGN_UP} magicLink={false} />
        </Container>
      )
    case VIEWS.FORGOTTEN_PASSWORD:
      return (
        <Container>
          <ForgottenPassword {...commonProps} />
        </Container>
      )
    case VIEWS.MAGIC_LINK:
      return (
        <Container>
          <MagicLink {...commonProps} />
        </Container>
      )
    case VIEWS.UPDATE_PASSWORD:
      return (
        <Container>
          <UpdatePassword {...commonProps} />
        </Container>
      )
    default:
      return null
  }
}

interface SubComponentProps {
  supabaseClient: SupabaseClient
  setAuthView: (view: ViewType) => void
  setLoading: (loading: boolean) => void
  setError: (error: string) => void
  setMessage: (message: string | null) => void
  clearMessages: () => void
  loading: boolean
  redirectTo?: RedirectTo
  renderFeedback: () => React.ReactNode
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

interface EmailAuthProps extends SubComponentProps {
  view: typeof VIEWS.SIGN_IN | typeof VIEWS.SIGN_UP
  magicLink?: boolean
  onSignInValidate?: (email: string, password: string) => Promise<void> | void
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
  renderFeedback,
  onSignInValidate,
}: Omit<EmailAuthProps, 'email' | 'setEmail' | 'password' | 'setPassword'> & {
  view: typeof VIEWS.SIGN_IN | typeof VIEWS.SIGN_UP
  magicLink?: boolean
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    clearMessages()
    setLoading(true)

    try {
      if (view === VIEWS.SIGN_IN) {
        if (onSignInValidate) {
          await onSignInValidate(email, password)
        }
        const { error } = await supabaseClient.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      } else if (view === VIEWS.SIGN_UP) {
        const { data, error } = await supabaseClient.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectTo },
        })
        if (error) throw error
        if (data.user && !data.session) {
          setMessage('Check your email for the confirmation link.')
        } else {
        }
      }
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred.')
    } finally {
      if (
        document.getElementById(
          view === VIEWS.SIGN_IN ? 'auth-sign-in' : 'auth-sign-up',
        )
      ) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    setEmail('')
    setPassword('')
  }, [view])

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
        <Label htmlFor="password">Password</Label>
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

      {view === VIEWS.SIGN_IN && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <Checkbox id="remember-me" />
            <Label htmlFor="remember-me" className="font-normal">
              Remember me
            </Label>
          </div>
          <Button
            variant="link"
            type="button"
            onClick={() => setAuthView(VIEWS.FORGOTTEN_PASSWORD)}
            className="p-0 h-auto font-normal text-muted-foreground"
          >
            Forgot your password?
          </Button>
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
            Don't have an account?{' '}
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
      {renderFeedback()}
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
  renderFeedback,
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
      {renderFeedback()}
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
  renderFeedback,
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
      {renderFeedback()}
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
  renderFeedback,
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
      {renderFeedback()}
    </form>
  )
}

export default Auth
