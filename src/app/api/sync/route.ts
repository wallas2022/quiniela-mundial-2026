import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } }
)

const FLAG_CODES: Record<string, string> = {
  // ── Selecciones nacionales ──────────────────────────────────────────
  'Mexico': 'mx', 'Argentina': 'ar', 'Brazil': 'br', 'France': 'fr',
  'Spain': 'es', 'Germany': 'de', 'Portugal': 'pt', 'England': 'gb-eng',
  'USA': 'us', 'United States': 'us', 'Canada': 'ca', 'Guatemala': 'gt',
  'Honduras': 'hn', 'Japan': 'jp', 'Morocco': 'ma', 'Senegal': 'sn',
  'Australia': 'au', 'Netherlands': 'nl', 'Belgium': 'be', 'Croatia': 'hr',
  'Serbia': 'rs', 'Switzerland': 'ch', 'Denmark': 'dk', 'Austria': 'at',
  'Poland': 'pl', 'Ukraine': 'ua', 'Turkey': 'tr', 'South Korea': 'kr',
  'Iran': 'ir', 'Saudi Arabia': 'sa', 'Qatar': 'qa', 'Nigeria': 'ng',
  'Tunisia': 'tn', 'Cameroon': 'cm', 'South Africa': 'za', 'Ghana': 'gh',
  'Algeria': 'dz', 'Egypt': 'eg', 'New Zealand': 'nz', 'Ecuador': 'ec',
  'Uruguay': 'uy', 'Colombia': 'co', 'Paraguay': 'py', 'Venezuela': 've',
  'Panama': 'pa', 'Costa Rica': 'cr', 'Jamaica': 'jm', 'El Salvador': 'sv',
  'Italy': 'it', 'Scotland': 'gb-sct', 'Albania': 'al', 'Hungary': 'hu',
  'Slovakia': 'sk', 'Czech Republic': 'cz', 'Czechia': 'cz', 'Georgia': 'ge',
  'Romania': 'ro', 'Uzbekistan': 'uz', 'Iraq': 'iq', 'Jordan': 'jo',
  'Haiti': 'ht', 'Bolivia': 'bo', 'Chile': 'cl', 'Peru': 'pe',
  'Sweden': 'se', 'Norway': 'no', 'Finland': 'fi', 'Ireland': 'ie',
  'Wales': 'gb-wls', 'Slovenia': 'si', 'Montenegro': 'me', 'Bulgaria': 'bg',
  'Belarus': 'by', 'Bosnia-Herzegovina': 'ba', 'Curaçao': 'cw', 'Curacao': 'cw',
  'Ivory Coast': 'ci', 'Cape Verde Islands': 'cv', 'Congo DR': 'cd',
  'Greece': 'gr', 'Cyprus': 'cy', 'Kazakhstan': 'kz', 'Azerbaijan': 'az',
  'Israel': 'il', 'Iceland': 'is', 'Kosovo': 'xk', 'North Macedonia': 'mk',
  'Faroe Islands': 'fo', 'Lithuania': 'lt', 'Latvia': 'lv', 'Estonia': 'ee',
  'Moldova': 'md', 'Armenia': 'am', 'Luxembourg': 'lu', 'Andorra': 'ad',
  'Malta': 'mt', 'San Marino': 'sm', 'Liechtenstein': 'li', 'Gibraltar': 'gi',
  // ── Clubes Champions League (nombres exactos de la API) ─────────────
  'Real Madrid CF': 'es', 'FC Barcelona': 'es', 'Club Atlético de Madrid': 'es',
  'Villarreal CF': 'es', 'Real Sociedad de Fútbol': 'es', 'Girona FC': 'es',
  'Athletic Club': 'es',
  'FC Bayern München': 'de', 'Borussia Dortmund': 'de', 'Bayer 04 Leverkusen': 'de',
  'RB Leipzig': 'de', 'Eintracht Frankfurt': 'de', 'VfB Stuttgart': 'de',
  'TSG Hoffenheim': 'de', 'Sport-Club Freiburg': 'de',
  'Paris Saint-Germain FC': 'fr', 'Olympique de Marseille': 'fr',
  'Olympique Lyonnais': 'fr', 'Lille OSC': 'fr', 'AS Monaco FC': 'fr',
  'Stade Rennais FC 1901': 'fr', 'Paris FC': 'fr',
  'Arsenal FC': 'gb-eng', 'Chelsea FC': 'gb-eng', 'Manchester City FC': 'gb-eng',
  'Liverpool FC': 'gb-eng', 'Tottenham Hotspur FC': 'gb-eng',
  'Manchester United FC': 'gb-eng', 'Newcastle United FC': 'gb-eng',
  'AFC Bournemouth': 'gb-eng', 'Aston Villa FC': 'gb-eng', 'Brentford FC': 'gb-eng',
  'Brighton & Hove Albion FC': 'gb-eng', 'Burnley FC': 'gb-eng',
  'Crystal Palace FC': 'gb-eng', 'Everton FC': 'gb-eng', 'Fulham FC': 'gb-eng',
  'Leeds United FC': 'gb-eng', 'Nottingham Forest FC': 'gb-eng',
  'Sunderland AFC': 'gb-eng', 'West Ham United FC': 'gb-eng',
  'Wolverhampton Wanderers FC': 'gb-eng', 'Leicester City FC': 'gb-eng',
  'Celtic FC': 'gb-sct', 'Rangers FC': 'gb-sct',
  'Juventus FC': 'it', 'AC Milan': 'it', 'Inter Milan': 'it',
  'FC Internazionale Milano': 'it', 'Atalanta BC': 'it', 'SSC Napoli': 'it',
  'AS Roma': 'it',
  'FC Porto': 'pt', 'SL Benfica': 'pt', 'Sport Lisboa e Benfica': 'pt',
  'Sporting Clube de Portugal': 'pt',
  'AFC Ajax': 'nl', 'Ajax Amsterdam': 'nl', 'PSV': 'nl', 'PSV Eindhoven': 'nl',
  'Feyenoord': 'nl',
  'Club Brugge KV': 'be', 'RSC Anderlecht': 'be',
  'Royal Union Saint-Gilloise': 'be', 'Royale Union Saint-Gilloise': 'be',
  'FC Shakhtar Donetsk': 'ua', 'FK Shakhtar Donetsk': 'ua', 'FC Dynamo Kyiv': 'ua',
  'GNK Dinamo Zagreb': 'hr', 'HNK Hajduk Split': 'hr',
  'Red Bull Salzburg': 'at', 'SK Sturm Graz': 'at',
  'Galatasaray SK': 'tr', 'Fenerbahçe SK': 'tr', 'Beşiktaş JK': 'tr',
  'GS Trabzonspor': 'tr',
  'FC Midtjylland': 'dk', 'FC Copenhagen': 'dk', 'FC København': 'dk',
  'Qarabağ FK': 'az', 'Qarabağ Ağdam FK': 'az',
  'Young Boys': 'ch', 'BSC Young Boys': 'ch', 'FC Basel': 'ch',
  'SK Slavia Praha': 'cz', 'AC Sparta Praha': 'cz',
  'PAE Olympiakos SFP': 'gr', 'PAOK FC': 'gr',
  'Paphos FC': 'cy', 'APOEL FC': 'cy',
  'FK Kairat': 'kz',
}

const COMPETITIONS: Record<string, { id: number; tournament: string }> = {
  world_cup_2026:   { id: 2000, tournament: 'world_cup_2026' },
  champions_league: { id: 2001, tournament: 'champions_league' },
  premier_league:   { id: 2021, tournament: 'premier_league' },
  liga_mx:          { id: 2137, tournament: 'liga_mx' },
}

function mapRound(stage: string): string {
  const map: Record<string, string> = {
    'GROUP_STAGE':       'group',
    'LEAGUE_STAGE':      'group',
    'LAST_16':           'round_of_16',
    'ROUND_OF_16':       'round_of_16',
    'LAST_8':           'round_of_8',
    'ROUND_OF_8':       'round_of_8',
    'QUARTER_FINALS':    'qf',
    'SEMI_FINALS':       'sf',
    'FINAL':             'final',
    'ROUND_OF_32':       'round_of_32',
    'PLAYOFF_ROUND_ONE': 'round_of_32',
    'PLAYOFF_ROUND_TWO': 'round_of_16',
  }
  return map[stage] ?? 'group'
}

function mapStatus(status: string): string {
  const map: Record<string, string> = {
    'SCHEDULED': 'scheduled',
    'TIMED':     'scheduled',
    'IN_PLAY':   'live',
    'FINISHED':  'finished',
    'POSTPONED': 'postponed',
  }
  return map[status] ?? 'scheduled'
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token      = searchParams.get('token')
  const tournament = searchParams.get('tournament') ?? 'world_cup_2026'

  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const competition = COMPETITIONS[tournament]
  if (!competition) {
    return NextResponse.json({ error: 'Torneo no soportado' }, { status: 400 })
  }

  try {
    const res = await fetch(
      `https://api.football-data.org/v4/competitions/${competition.id}/matches`,
      { headers: { 'X-Auth-Token': process.env.FOOTBALL_API_KEY! } }
    )
    const data = await res.json()
    const matches = data.matches ?? []


    console.log('Total matches:', matches.length)
console.log('Statuses:', [...new Set(matches.map((m: any) => m.status))])
console.log('Stages:', [...new Set(matches.map((m: any) => m.stage))])
console.log('Sample match:', JSON.stringify(matches[0], null, 2))
    // 1. Partidos LIVE
    const liveMatches = matches.filter((m: any) => m.status === 'IN_PLAY')
    for (const m of liveMatches) {
      await supabase
        .from('matches')
        .update({ status: 'live' })
        .eq('external_id', String(m.id))
    }

    // 2. Partidos terminados → actualizar resultado
    const finished = matches.filter((m: any) =>
      m.status === 'FINISHED' && m.homeTeam?.name && m.awayTeam?.name
    )

    let updated = 0
    for (const m of finished) {
      const { error } = await supabase
        .from('matches')
        .update({
          home_score: m.score?.fullTime?.home,
          away_score: m.score?.fullTime?.away,
          status:     'finished',
          synced_at:  new Date().toISOString(),
        })
        .eq('external_id', String(m.id))

      if (!error) updated++
    }

    // 3. Insertar partidos programados nuevos
// Reemplaza esto:
const scheduled = matches.filter((m: any) =>
  ['SCHEDULED', 'TIMED'].includes(m.status) && 
  m.homeTeam?.name && m.awayTeam?.name
)

// Por esto — inserta TODOS los partidos:
const toInsert = matches.filter((m: any) =>
  m.homeTeam?.name && m.awayTeam?.name
)

const rows = toInsert.map((m: any) => ({
  external_id: String(m.id),
  tournament:  competition.tournament,
  home_team:   m.homeTeam.name,
  away_team:   m.awayTeam.name,
  home_flag:   FLAG_CODES[m.homeTeam.name] ?? m.homeTeam.tla?.toLowerCase() ?? '',
  away_flag:   FLAG_CODES[m.awayTeam.name] ?? m.awayTeam.tla?.toLowerCase() ?? '',
  home_crest:  m.homeTeam.crest ?? null,  // ← escudo del equipo
  away_crest:  m.awayTeam.crest ?? null,
  round:       mapRound(m.stage),
  group_stage: m.group ?? null,
  kickoff_at:  m.utcDate,
  home_score:  m.score?.fullTime?.home ?? null,
  away_score:  m.score?.fullTime?.away ?? null,
  status:      mapStatus(m.status),
  synced_at:   new Date().toISOString(),
}))

    
    const { count: inserted } = await supabase
      .from('matches')
      .upsert(rows, { onConflict: 'external_id', count: 'exact' })

    // 4. Calcular puntos
    const { data: finishedInDB } = await supabase
      .from('matches')
      .select('id')
      .eq('status', 'finished')
      .eq('tournament', competition.tournament)

    let calculated = 0
    for (const match of finishedInDB ?? []) {
      const { error } = await supabase.rpc('calculate_match_points', {
        p_match_id: match.id
      })
      if (!error) calculated++
    }

    return NextResponse.json({
      ok:         true,
      tournament,
      live:       liveMatches.length,
      updated,
      inserted,
      calculated,
      timestamp:  new Date().toISOString(),
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}