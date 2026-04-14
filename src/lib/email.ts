import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY!)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } }
)

type Standing = {
  user_id: string
  display_name: string
  total_points: number
  exact_scores: number
  correct_results: number
  rank: number
  isMe?: boolean
}

function matchResultEmail({
  leagueName,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  predHome,
  predAway,
  pointsEarned,
  standings,
  myRank,
  userName,
  appUrl,
  leagueId,
}: {
  leagueName: string
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  predHome: number
  predAway: number
  pointsEarned: number
  standings: Standing[]
  myRank: number
  userName: string
  appUrl: string
  leagueId: string
}): string {
  const pointsColor =
    pointsEarned >= 5 ? '#4ade80' :
    pointsEarned >= 3 ? '#60a5fa' :
    pointsEarned > 0 ? '#94a3b8' :
    '#6b7280'

  const pointsLabel =
    pointsEarned === 5 ? '🎯 ¡Marcador exacto!' :
    pointsEarned === 4 ? '✅ Resultado + diferencia' :
    pointsEarned === 3 ? '✅ Resultado correcto' :
    pointsEarned === 0 ? '❌ Sin puntos esta vez' :
    `+${pointsEarned} pts`

  const top5 = standings.slice(0, 5)

  const standingsRows = top5.map(s => `
    <tr style="border-bottom:1px solid #1f2937">
      <td style="padding:8px 12px;color:${s.rank <= 3 ? '#f59e0b' : '#6b7280'};font-weight:600;width:36px">
        ${s.rank === 1 ? '🥇' : s.rank === 2 ? '🥈' : s.rank === 3 ? '🥉' : `#${s.rank}`}
      </td>
      <td style="padding:8px 12px;color:${s.isMe ? '#93c5fd' : '#e5e7eb'};font-weight:${s.isMe ? '600' : '400'}">
        ${s.display_name}${s.isMe ? ' <span style="color:#60a5fa;font-size:11px">(vos)</span>' : ''}
      </td>
      <td style="padding:8px 12px;text-align:right;color:#e5e7eb;font-weight:600">${s.total_points} pts</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#030712;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:480px;margin:0 auto;padding:24px 16px">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:24px">
      <span style="font-size:28px">⚽</span>
      <h2 style="color:#e5e7eb;margin:8px 0 4px;font-size:16px;font-weight:600">${leagueName}</h2>
      <p style="color:#6b7280;margin:0;font-size:13px">Resultado del partido</p>
    </div>

    <!-- Resultado del partido -->
    <div style="background:#111827;border:1px solid #1f2937;border-radius:16px;padding:20px;margin-bottom:16px;text-align:center">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px">
        <span style="color:#e5e7eb;font-size:14px;flex:1;text-align:right">${homeTeam}</span>
        <span style="color:#ffffff;font-size:24px;font-weight:700;font-variant-numeric:tabular-nums;flex-shrink:0;min-width:60px;text-align:center">${homeScore} – ${awayScore}</span>
        <span style="color:#e5e7eb;font-size:14px;flex:1;text-align:left">${awayTeam}</span>
      </div>
    </div>

    <!-- Tu pronóstico -->
    <div style="background:#111827;border:1px solid #1f2937;border-radius:16px;padding:16px 20px;margin-bottom:16px">
      <p style="color:#6b7280;font-size:12px;margin:0 0 8px">Tu pronóstico, ${userName}</p>
      <div style="display:flex;align-items:center;justify-content:space-between">
        <span style="color:#93c5fd;font-size:20px;font-weight:700;font-variant-numeric:tabular-nums">${predHome} – ${predAway}</span>
        <div style="text-align:right">
          <div style="color:${pointsColor};font-size:18px;font-weight:700">+${pointsEarned} pts</div>
          <div style="color:${pointsColor};font-size:12px">${pointsLabel}</div>
        </div>
      </div>
    </div>

    <!-- Tabla de posiciones -->
    <div style="background:#111827;border:1px solid #1f2937;border-radius:16px;overflow:hidden;margin-bottom:24px">
      <div style="padding:12px 16px;border-bottom:1px solid #1f2937">
        <p style="color:#9ca3af;font-size:12px;margin:0;font-weight:500">🏆 Tabla de posiciones</p>
        ${myRank > 5 ? `<p style="color:#60a5fa;font-size:11px;margin:4px 0 0">Tu posición: #${myRank}</p>` : ''}
      </div>
      <table style="width:100%;border-collapse:collapse">
        <tbody>${standingsRows}</tbody>
      </table>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:24px">
      <a href="${appUrl}/leagues/${leagueId}/standings"
        style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;
               padding:12px 28px;border-radius:12px;font-size:14px;font-weight:600">
        Ver tabla completa →
      </a>
    </div>

    <p style="color:#374151;font-size:11px;text-align:center;margin:0">
      Quiniela 2026 · <a href="${appUrl}" style="color:#374151">quiniela-mundial-2026.vercel.app</a>
    </p>
  </div>
</body>
</html>`
}

export async function notifyMatchResult(matchId: string) {
  // 1. Obtener datos del partido
  const { data: match } = await supabaseAdmin
    .from('matches')
    .select('id, home_team, away_team, home_score, away_score, tournament')
    .eq('id', matchId)
    .single()

  if (!match || match.home_score === null) return

  // 2. Encontrar ligas que tienen predicciones para este partido
  const { data: leaguePreds } = await supabaseAdmin
    .from('predictions')
    .select('league_id')
    .eq('match_id', matchId)

  if (!leaguePreds?.length) return

  const leagueIds = [...new Set(leaguePreds.map(p => p.league_id))]

  for (const leagueId of leagueIds) {
    await notifyLeague({ match, leagueId })
  }
}

async function notifyLeague({
  match,
  leagueId,
}: {
  match: { id: string; home_team: string; away_team: string; home_score: number; away_score: number }
  leagueId: string
}) {
  // Datos de la liga
  const { data: league } = await supabaseAdmin
    .from('leagues')
    .select('name')
    .eq('id', leagueId)
    .single()

  if (!league) return

  // Standings actuales
  const { data: scoresData } = await supabaseAdmin
    .from('scores')
    .select('user_id, total_points, exact_scores, correct_results')
    .eq('league_id', leagueId)
    .order('total_points', { ascending: false })

  const { data: members } = await supabaseAdmin
    .from('league_members')
    .select('user_id')
    .eq('league_id', leagueId)
    .eq('status', 'approved')

  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, display_name, email')
    .in('id', members?.map(m => m.user_id) ?? [])

  if (!profiles?.length) return

  const scoreMap = Object.fromEntries((scoresData ?? []).map(s => [s.user_id, s]))
  const memberIds = members?.map(m => m.user_id) ?? []

  const standings: Standing[] = memberIds
    .map(uid => ({
      user_id: uid,
      display_name: profiles.find(p => p.id === uid)?.display_name ?? 'Jugador',
      total_points: scoreMap[uid]?.total_points ?? 0,
      exact_scores: scoreMap[uid]?.exact_scores ?? 0,
      correct_results: scoreMap[uid]?.correct_results ?? 0,
      rank: 0,
    }))
    .sort((a, b) => b.total_points - a.total_points)
    .map((s, i) => ({ ...s, rank: i + 1 }))

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://quiniela-mundial-2026-pi.vercel.app'

  // Predicciones del partido para todos los miembros
  const { data: predictions } = await supabaseAdmin
    .from('predictions')
    .select('user_id, pred_home, pred_away, points_earned')
    .eq('match_id', match.id)
    .eq('league_id', leagueId)

  // Enviar un email a cada miembro que tenga predicción y email
  const emailPromises = predictions?.map(async pred => {
    const profile = profiles.find(p => p.id === pred.user_id)
    if (!profile?.email) return

    const myStanding = standings.find(s => s.user_id === pred.user_id)
    const myRank = myStanding?.rank ?? standings.length

    const standingsWithMe = standings.map(s => ({
      ...s,
      isMe: s.user_id === pred.user_id,
    }))

    const html = matchResultEmail({
      leagueName: league.name,
      homeTeam: match.home_team,
      awayTeam: match.away_team,
      homeScore: match.home_score,
      awayScore: match.away_score,
      predHome: pred.pred_home,
      predAway: pred.pred_away,
      pointsEarned: pred.points_earned ?? 0,
      standings: standingsWithMe,
      myRank,
      userName: profile.display_name ?? 'jugador',
      appUrl,
      leagueId,
    })

    return resend.emails.send({
      from: `Quiniela 2026 <noreply@${process.env.RESEND_FROM_DOMAIN ?? 'resend.dev'}>`,
      to: profile.email,
      subject: `⚽ ${match.home_team} ${match.home_score}–${match.away_score} ${match.away_team} · ${league.name}`,
      html,
    })
  }) ?? []

  await Promise.allSettled(emailPromises)
}