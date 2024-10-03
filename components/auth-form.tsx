import Logo from './logo'
import { AuthViewType } from '@/lib/auth'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { SupabaseClient } from '@supabase/supabase-js'

function AuthForm({
  supabase,
  view = 'sign_in',
}: {
  supabase: SupabaseClient
  view: AuthViewType
}) {
  return (
    <div className="flex justify-center items-center flex-col">
      <h1 className="flex items-center gap-4 text-xl font-bold mb-2 w-full">
        <div className="flex items-center justify-center rounded-md shadow-md bg-black p-2">
          <Logo className="text-white w-6 h-6" />
        </div>
        Sign in to Fragments
      </h1>
      <div className="w-full">
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'rgb(255, 136, 0)',
                  brandAccent: 'rgb(255, 136, 0)',
                  inputText: 'hsl(var(--foreground))',
                  dividerBackground: 'hsl(var(--border))',
                  inputBorder: 'hsl(var(--input))',
                  inputBorderFocus: 'hsl(var(--ring))',
                  inputBorderHover: 'hsl(var(--input))',
                  inputLabelText: 'hsl(var(--muted-foreground))',
                  defaultButtonText: 'hsl(var(--primary))',
                  defaultButtonBackground: 'hsl(var(--secondary))',
                  defaultButtonBackgroundHover: 'hsl(var(--secondary))',
                  defaultButtonBorder: 'hsl(var(--secondary))',
                },
                radii: {
                  borderRadiusButton: '0.7rem',
                  inputBorderRadius: '0.7rem',
                },
              },
            },
          }}
          localization={{
            variables: {
              sign_in: {
                email_label: 'Email address',
                password_label: 'Password',
              },
            },
          }}
          view={view}
          theme="default"
          showLinks={true}
          providers={['github', 'google']}
          providerScopes={{
            github: 'email',
          }}
        />
      </div>
    </div>
  )
}

export default AuthForm
