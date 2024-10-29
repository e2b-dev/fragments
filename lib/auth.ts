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

interface UserTeam {
  id: string
  name: string
  is_default: boolean
  tier: string
  email: string
  team_api_keys: { api_key: string }[]
}

export async function getUserAPIKey(session: Session) {
  // If Supabase is not initialized will use E2B_API_KEY env var
  if (!supabase || process.env.E2B_API_KEY) return process.env.E2B_API_KEY

  const { data: userTeams } = await supabase
    .from('users_teams')
    .select(
      'teams (id, name, is_default, tier, email, team_api_keys (api_key))',
    )
    .eq('user_id', session?.user.id)

  const teams = userTeams
    ?.map((userTeam: any) => userTeam.teams)
    .map((team: UserTeam) => {
      return {
        ...team,
        apiKeys: team.team_api_keys.map((apiKey) => apiKey.api_key),
      }
    })

  const defaultTeam = teams?.find((team) => team.is_default)
  return defaultTeam?.apiKeys[0]
}

export function useAuth(
  setAuthDialog: (value: boolean) => void,
  setAuthView: (value: AuthViewType) => void,
) {
  const [session, setSession] = useState<Session | null>(null)
  const [apiKey, setApiKey] = useState<string | undefined>(undefined)
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
        getUserAPIKey(session).then(setApiKey)
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
        setAuthDialog(false)
        getUserAPIKey(session as Session).then(setApiKey)
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
        setApiKey(undefined)
        setAuthView('sign_in')
        posthog.capture('sign_out')
        posthog.reset()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return {
    session,
    apiKey,
  }
}
