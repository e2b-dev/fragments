import Auth, { ViewType } from './auth'
import Logo from './logo'
import { SupabaseClient } from '@supabase/supabase-js'

function AuthForm({
  supabase,
  view = 'sign_in',
}: {
  supabase: SupabaseClient
  view: ViewType
}) {
  return (
    <div className="flex justify-center items-center flex-col">
      <h1 className="flex items-center gap-4 text-xl font-bold mb-6 w-full">
        <div className="flex items-center justify-center rounded-md shadow-md bg-black p-2">
          <Logo className="text-white w-6 h-6" />
        </div>
        Sign in to Fragments
      </h1>
      <div className="w-full">
        <Auth
          supabaseClient={supabase}
          view={view}
          providers={['github', 'google']}
          socialLayout="horizontal"
        />
      </div>
    </div>
  )
}

export default AuthForm
