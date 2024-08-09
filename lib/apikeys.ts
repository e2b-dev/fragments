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

export async function getUserAPIKeys(session: Session) {
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
