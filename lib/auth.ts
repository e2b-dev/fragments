import { supabase } from './supabase'
import { Session } from '@supabase/supabase-js'
import { usePostHog } from 'posthog-js/react'
import { useState, useEffect } from 'react'

export type AuthViewType =
  | 'sign_in'
  | 'sign_up'
  | 'magic_link'
  | 'forgotten_password'
  | 'update_password'
  | 'verify_otp'

type UserTeam = {
  email: string
  id: string
  name: string
  tier: string
}

export async function getUserTeam(
  session: Session,
): Promise<UserTeam | undefined> {
  const { data: defaultTeam } = await supabase!
    .from('users_teams')
    .select('teams (id, name, tier, email)')
    .eq('user_id', session?.user.id)
    .eq('is_default', true)
    .single()

  return defaultTeam?.teams as unknown as UserTeam
}

export function useAuth(
  setAuthDialog: (value: boolean) => void,
  setAuthView: (value: AuthViewType) => void,
) {
  const [session, setSession] = useState<Session | null>(null)
  const [userTeam, setUserTeam] = useState<UserTeam | undefined>(undefined)
  const posthog = usePostHog()
  let recovery = false

  useEffect(() => {
    if (!supabase) {
      console.warn('Supabase is not initialized')
      return setSession({ user: { email: 'demo@e2b.dev' } } as Session)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        getUserTeam(session).then(setUserTeam)
        if (!session.user.user_metadata.is_fragments_user) {
          supabase?.auth.updateUser({
            data: { is_fragments_user: true },
          })
        }
        posthog.identify(session?.user.id, {
          email: session?.user.email,
          supabase_id: session?.user.id,
        })
        posthog.capture('sign_in')
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)

      if (_event === 'PASSWORD_RECOVERY') {
        recovery = true
        setAuthView('update_password')
        setAuthDialog(true)
      }

      if (_event === 'USER_UPDATED' && recovery) {
        recovery = false
      }

      if (_event === 'SIGNED_IN' && !recovery) {
        getUserTeam(session as Session).then(setUserTeam)
        setAuthDialog(false)
        if (!session?.user.user_metadata.is_fragments_user) {
          supabase?.auth.updateUser({
            data: { is_fragments_user: true },
          })
        }
        posthog.identify(session?.user.id, {
          email: session?.user.email,
          supabase_id: session?.user.id,
        })
        posthog.capture('sign_in')
      }

      if (_event === 'SIGNED_OUT') {
        setAuthView('sign_in')
        posthog.capture('sign_out')
        posthog.reset()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return {
    session,
    userTeam,
  }
}
