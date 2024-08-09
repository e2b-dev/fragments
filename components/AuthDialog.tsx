import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import AuthForm from "./AuthForm"
import { SupabaseClient } from "@supabase/supabase-js"

export function AuthDialog({ open, setOpen, supabase }: { open: boolean, setOpen: (open: boolean) => void, supabase: SupabaseClient }) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogTitle>Continue</DialogTitle>
        <AuthForm supabase={supabase} />
      </DialogContent>
    </Dialog>
  )
}
