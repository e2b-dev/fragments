import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import AuthForm from "./AuthForm"
import { SupabaseClient } from "@supabase/supabase-js"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

export function AuthDialog({ open, setOpen, supabase }: { open: boolean, setOpen: (open: boolean) => void, supabase: SupabaseClient }) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <VisuallyHidden>
          <DialogTitle>Sign in to E2B</DialogTitle>
        </VisuallyHidden>
        <AuthForm supabase={supabase} />
      </DialogContent>
    </Dialog>
  )
}
