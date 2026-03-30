import { supabaseServer } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import PredictionsClient from './PredictionsClient'

export default async function PredictionsPage({
    params,
}: {
    params: Promise<{ leagueId: string }>
}) {
    const { leagueId } = await params
    const supabase = await supabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: member } = await supabase
        .from('league_members')
        .select('status')
        .eq('league_id', leagueId)
        .eq('user_id', user.id)
        .single()

    if (!member || member.status !== 'approved') redirect(`/leagues/${leagueId}`)

    const [matchesRes, predsRes] = await Promise.all([
        supabase.from('matches').select('*').order('kickoff_at'),
        supabase.from('predictions').select('*')
            .eq('league_id', leagueId)
            .eq('user_id', user.id),
    ])

    console.log('SERVER matches count:', matchesRes.data?.length)
    console.log('SERVER matches error:', matchesRes.error)

    return (
        <PredictionsClient
            matches={matchesRes.data ?? []}
            predictions={predsRes.data ?? []}
            leagueId={leagueId}
            userId={user.id}
        />
    )
}