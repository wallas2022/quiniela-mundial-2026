'use server'
import { createBrowserClient } from '@supabase/ssr'

 const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

export async function addLeagueMember(leagueId: string, userId: string) {
  const { error } = await supabase
    .from('league_members')
    .insert({
      league_id: leagueId,
      user_id:   userId,
      role:      'admin',
      status:    'approved',
    })

  if (error) throw new Error(error.message)
}