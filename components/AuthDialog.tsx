import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import AuthForm from "./AuthForm"
import { SupabaseClient } from "@supabase/supabase-js"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { AuthViewType } from "@/lib/auth"

export function AuthDialog({ open, setOpen, supabase, view }: { open: boolean, setOpen: (open: boolean) => void, supabase: SupabaseClient, view: AuthViewType }) {
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
