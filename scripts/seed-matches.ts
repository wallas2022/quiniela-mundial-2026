import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const FOOTBALL_API_KEY    = process.env.FOOTBALL_API_KEY!
const SUPABASE_URL        = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
})

const COMPETITIONS: Record<string, { id: number; name: string }> = {
  world_cup_2026:   { id: 2000, name: 'FIFA World Cup 2026' },
  champions_league: { id: 2001, name: 'UEFA Champions League' },
  premier_league:   { id: 2021, name: 'Premier League' },
  liga_mx:          { id: 2137, name: 'Liga MX' },
}

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

function mapRound(stage: string): string {
  const map: Record<string, string> = {
    'GROUP_STAGE':       'group',
    'LEAGUE_STAGE':      'group',
    'LAST_16':           'round_of_16',
    'ROUND_OF_16':       'round_of_16',
    'LAST_8':            'round_of_8',
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
    'SCHEDULED': 'scheduled', 'TIMED': 'scheduled',
    'IN_PLAY':   'live',
    'FINISHED':  'finished',
    'POSTPONED': 'postponed',
  }
  return map[status] ?? 'scheduled'
}

async function seedMatches(tournament: string) {
  const competition = COMPETITIONS[tournament]
  if (!competition) {
    console.error(`Torneo no soportado: "${tournament}"`)
    console.error(`Opciones: ${Object.keys(COMPETITIONS).join(', ')}`)
    process.exit(1)
  }

  console.log(`\nObteniendo partidos: ${competition.name} (id: ${competition.id})...`)

  const res = await fetch(
    `https://api.football-data.org/v4/competitions/${competition.id}/matches`,
    { headers: { 'X-Auth-Token': FOOTBALL_API_KEY } }
  )

  if (!res.ok) {
    console.error('Error API:', res.status, await res.text())
    return
  }

  const data = await res.json()
  const allMatches = data.matches ?? []
  console.log(`Total partidos en API: ${allMatches.length}`)

  const rows = allMatches
    .filter((m: any) => m.homeTeam?.name && m.awayTeam?.name)
    .map((m: any) => ({
      external_id: String(m.id),
      tournament,
      home_team:   m.homeTeam.name,
      away_team:   m.awayTeam.name,
      home_flag:   FLAG_CODES[m.homeTeam.name] ?? m.homeTeam.tla?.toLowerCase() ?? 'xx',
      away_flag:   FLAG_CODES[m.awayTeam.name] ?? m.awayTeam.tla?.toLowerCase() ?? 'xx',
      home_crest:  m.homeTeam.crest ?? null,
      away_crest:  m.awayTeam.crest ?? null,
      group_stage: m.group ?? null,
      round:       mapRound(m.stage),
      kickoff_at:  m.utcDate,
      home_score:  m.score?.fullTime?.home ?? null,
      away_score:  m.score?.fullTime?.away ?? null,
      status:      mapStatus(m.status),
    }))

  console.log(`Partidos con equipos definidos: ${rows.length}`)
  if (rows.length === 0) { console.log('Nada que insertar.'); return }

  // Mostrar rondas encontradas
  const rounds = [...new Set(rows.map((r: any) => r.round))]
  console.log(`Rondas: ${rounds.join(', ')}`)

  const BATCH = 20
  let inserted = 0

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    const { error } = await supabase
      .from('matches')
      .upsert(batch, { onConflict: 'external_id' })

    if (error) {
      console.error(`Error en lote ${i}-${i + BATCH}:`, error.message)
    } else {
      inserted += batch.length
      console.log(`✓ ${inserted}/${rows.length}`)
    }
  }

  console.log(`\n✅ Seed completado — ${inserted} partidos en Supabase`)
}

// Tomar torneo del argumento CLI, default world_cup_2026
const tournament = process.argv[2] ?? 'world_cup_2026'
seedMatches(tournament)
