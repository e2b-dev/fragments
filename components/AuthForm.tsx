import { AuthViewType } from '@/lib/auth'
import { Auth } from '@supabase/auth-ui-react'
import {
  ThemeSupa
} from '@supabase/auth-ui-shared'
import { SupabaseClient } from '@supabase/supabase-js'

function AuthForm({ supabase, view = 'sign_in' }: { supabase: SupabaseClient, view: AuthViewType }) {
  return (
    <div className="flex justify-center items-center flex-col">
      <h1 className="flex items-center gap-4 text-xl font-bold mb-2 w-full">
        <img src="/logo-colored.svg" alt="E2B" className="w-8 h-8" />
        Sign in to E2B
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
                  inputText: '#FFF',
                  dividerBackground: 'hsla(270, 2%, 19%)',
                  inputBorder: 'hsla(240 3.7% 15.9%)',
                  inputBorderFocus: 'hsla(0, 0%, 100%, .1)',
                  inputBorderHover: 'hsla(240 3.7% 15.9%)',
                  inputLabelText: 'hsla(240 5% 64.9%)',
                  defaultButtonText: '#FFF',
                  defaultButtonBackground: 'hsla(240 3.7% 15.9%)',
                  defaultButtonBackgroundHover: 'hsla(240 3.7% 15.9%)',
                  defaultButtonBorder: 'hsla(240 3.7% 15.9%)',
                },
                radii: {
                  borderRadiusButton: '0.7rem',
                  inputBorderRadius: '0.7rem'
                }
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
          theme='default'
          showLinks={true}
          providers={['github']}
          providerScopes={{
            github: 'email',
          }}
        />
      </div>
    </div>
  )
}

export default AuthForm
