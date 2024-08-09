import { useState, useEffect } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

interface UserTeam {
  id: string;
  name: string;
  is_default: boolean;
  tier: string;
  email: string;
  team_api_keys: { api_key: string; }[];
}

export async function getUserAPIKey (session: Session) {
  const { data: userTeams } = await supabase
    .from('users_teams')
    .select('teams (id, name, is_default, tier, email, team_api_keys (api_key))')
    .eq('user_id', session?.user.id)

  const teams = userTeams?.map((userTeam: any) => userTeam.teams).map((team: UserTeam) => {
    return {
      ...team,
      apiKeys: team.team_api_keys.map(apiKey => apiKey.api_key)
    }
  })

  const defaultTeam = teams?.find(team => team.is_default)
  return defaultTeam?.apiKeys[0]
}

export function useAuth (setAuthDialog: (value: boolean) => void) {
  const [session, setSession] = useState<Session | null>(null)
  const [apiKey, setApiKey] = useState<string | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)

      if (_event === 'SIGNED_IN') {
        setAuthDialog(false)
        getUserAPIKey(session as Session).then(setApiKey)
      }

      if (_event === 'SIGNED_OUT') {
        setApiKey(undefined)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return {
    session,
    apiKey
  }
}
