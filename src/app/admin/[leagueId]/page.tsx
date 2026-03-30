import { supabaseServer } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import AdminClient from './AdminClient'

export default async function AdminPage({
  params,
}: {
  params: Promise<{ leagueId: string }>
}) {
  const { leagueId } = await params
  const supabase = await supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('league_members')
    .select('role')
    .eq('league_id', leagueId)
    .eq('user_id', user.id)
    .single()

  if (membership?.role !== 'admin') redirect('/')

  const [leagueRes, membersRes, paymentsRes, profilesRes] = await Promise.all([
    supabase.from('leagues').select('*').eq('id', leagueId).single(),
    supabase
      .from('league_members')
      .select('id, role, status, user_id, joined_at')
      .eq('league_id', leagueId)
      .order('joined_at'),
    supabase
      .from('payments')
      .select('*')
      .eq('league_id', leagueId)
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('id, display_name, phone, email'),
  ])

  return (
    <AdminClient
      league={leagueRes.data!}
      members={membersRes.data ?? []}
      payments={paymentsRes.data ?? []}
      profiles={profilesRes.data ?? []}
      leagueId={leagueId}
      adminId={user.id}
    />
  )
}