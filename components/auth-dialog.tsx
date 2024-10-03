import AuthForm from './auth-form'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { AuthViewType } from '@/lib/auth'
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
  view: AuthViewType
}) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <VisuallyHidden>
          <DialogTitle>Sign in to E2B</DialogTitle>
        </VisuallyHidden>
        <AuthForm supabase={supabase} view={view} />
      </DialogContent>
    </Dialog>
  )
}
