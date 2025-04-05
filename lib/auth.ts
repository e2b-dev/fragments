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
  is_default: boolean
  teams: {
    id: string
  }
}

export async function getUserTeamID(session: Session) {
  // If Supabase is not initialized will use E2B_API_KEY env var
  if (!supabase || process.env.E2B_API_KEY) return process.env.E2B_API_KEY

  const { data: userTeams } = await supabase
    .from('users_teams')
    .select('is_default, teams (id, name, tier, email)')
    .eq('user_id', session?.user.id)

  const defaultTeam = userTeams?.find((team) => team.is_default)
  return (defaultTeam as unknown as UserTeam).teams.id
}

export function useAuth(
  setAuthDialog: (value: boolean) => void,
  setAuthView: (value: AuthViewType) => void,
) {
  const [session, setSession] = useState<Session | null>(null)
  const [userTeamID, setUserTeamID] = useState<string | undefined>(undefined)
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
        getUserTeamID(session).then(setUserTeamID)
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
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
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
        getUserTeamID(session as Session).then(setUserTeamID)
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
    userTeamID,
  }
}
