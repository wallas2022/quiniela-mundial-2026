import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const FOOTBALL_API_KEY    = process.env.FOOTBALL_API_KEY!
const SUPABASE_URL         = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
})

const FLAG_CODES: Record<string, string> = {
  'Mexico': 'mx', 'Argentina': 'ar', 'Brazil': 'br', 'France': 'fr',
  'Spain': 'es', 'Germany': 'de', 'Portugal': 'pt', 'England': 'gb-eng',
  'USA': 'us', 'United States': 'us', 'Canada': 'ca', 'Guatemala': 'gt',
  'Honduras': 'hn', 'Japan': 'jp', 'Morocco': 'ma', 'Senegal': 'sn',
  'Australia': 'au', 'Netherlands': 'nl', 'Belgium': 'be', 'Croatia': 'hr',
  'Serbia': 'rs', 'Switzerland': 'ch', 'Denmark': 'dk', 'Austria': 'at',
  'Poland': 'pl', 'Ukraine': 'ua', 'Turkey': 'tr', 'South Korea': 'kr',
  'Iran': 'ir', 'Saudi Arabia': 'sa', 'Qatar': 'qa', 'Nigeria': 'ng',
  "Côte d'Ivoire": 'ci', 'Tunisia': 'tn', 'Cameroon': 'cm',
  'South Africa': 'za', 'Ghana': 'gh', 'Algeria': 'dz', 'Egypt': 'eg',
  'New Zealand': 'nz', 'Ecuador': 'ec', 'Uruguay': 'uy', 'Colombia': 'co',
  'Paraguay': 'py', 'Venezuela': 've', 'Panama': 'pa', 'Costa Rica': 'cr',
  'Jamaica': 'jm', 'El Salvador': 'sv', 'Italy': 'it', 'Scotland': 'gb-sct',
  'Albania': 'al', 'Hungary': 'hu', 'Slovakia': 'sk', 'Czech Republic': 'cz',
  'Georgia': 'ge', 'Romania': 'ro', 'Uzbekistan': 'uz', 'Iraq': 'iq',
  'Jordan': 'jo', 'Haiti': 'ht', 'Curacao': 'cw', 'Bolivia': 'bo',
  'Chile': 'cl', 'Peru': 'pe', 'Israel': 'il', 'Greece': 'gr',
  'Iceland': 'is', 'Norway': 'no', 'Sweden': 'se', 'Finland': 'fi',
  'Ireland': 'ie', 'Wales': 'gb-wls', 'Slovenia': 'si', 'Serbia': 'rs',
  'North Macedonia': 'mk', 'Bosnia and Herzegovina': 'ba', 'Kosovo': 'xk',
  'Montenegro': 'me', 'Bulgaria': 'bg', 'Belarus': 'by',
}

async function seedMatches() {
  console.log('Obteniendo partidos del Mundial 2026...')

  const res = await fetch(
    'https://api.football-data.org/v4/competitions/2000/matches',
    { headers: { 'X-Auth-Token': FOOTBALL_API_KEY } }
  )

  if (!res.ok) {
    console.error('Error API:', res.status, await res.text())
    return
  }

  const data = await res.json()
  const allMatches = data.matches
  console.log(`Total partidos en API: ${allMatches.length}`)

  // Solo partidos de 2026 con equipos definidos
  const rows = allMatches
    .filter((m: any) =>
      m.utcDate?.startsWith('2026') &&
      m.homeTeam?.name &&
      m.awayTeam?.name
    )
    .map((m: any) => ({
      external_id: String(m.id),
      home_team:   m.homeTeam.name,
      away_team:   m.awayTeam.name,
      home_flag:   FLAG_CODES[m.homeTeam.name] ?? m.homeTeam.tla?.toLowerCase() ?? 'xx',
      away_flag:   FLAG_CODES[m.awayTeam.name] ?? m.awayTeam.tla?.toLowerCase() ?? 'xx',
      group_stage: m.group ?? null,
      round:       m.stage?.toLowerCase() ?? 'group',
      kickoff_at:  m.utcDate,
      home_score:  m.score?.fullTime?.home ?? null,
      away_score:  m.score?.fullTime?.away ?? null,
      status:      m.status === 'FINISHED' ? 'finished'
                 : m.status === 'IN_PLAY'  ? 'live'
                 : 'scheduled',
    }))

  console.log(`Partidos 2026 con equipos: ${rows.length}`)

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
      console.log(`✓ ${inserted}/${rows.length} partidos procesados`)
    }
  }

  console.log(`\n✅ Seed completado — ${inserted} partidos en Supabase`)
}

seedMatches()