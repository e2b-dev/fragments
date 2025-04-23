import Auth, { ViewType } from './auth'
import Logo from './logo'
import { validateEmail } from '@/app/actions/validate-email'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { SupabaseClient } from '@supabase/supabase-js'

export function AuthDialog({
  open,
  setOpen,
  supabase,
  view,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  supabase: SupabaseClient
  view: ViewType
}) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <VisuallyHidden>
          <DialogTitle>Sign in to Fragments</DialogTitle>
          <DialogDescription>
            Sign in or create an account to access Fragments
          </DialogDescription>
        </VisuallyHidden>
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
              onSignUpValidate={validateEmail}
              metadata={{
                is_fragments_user: true,
              }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
