import { createClient } from '@supabase/supabase-js'

export const supabase = !process.env.NEXT_PUBLIC_DISABLE_SUPABASE
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  : undefined
