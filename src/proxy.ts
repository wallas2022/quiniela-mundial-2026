import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Rutas que NO requieren login (públicas)
const RUTAS_PUBLICAS = [
  '/',
  '/login',
  '/registro',
  '/como-participar',
  '/auth',
]

// Rutas de autenticación: si ya estás logueado, te redirigen a la app
const RUTAS_AUTH = ['/login', '/registro']

export async function proxy(req: NextRequest) {
  let res = NextResponse.next({ request: { headers: req.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return req.cookies.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({ name, value, ...options })
          res = NextResponse.next({ request: { headers: req.headers } })
          res.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({ name, value: '', ...options })
          res = NextResponse.next({ request: { headers: req.headers } })
          res.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const isAuth = !!user
  const pathname = req.nextUrl.pathname

  // ¿Es una ruta pública? (coincidencia exacta o comienza con la ruta + /)
  const esRutaPublica = RUTAS_PUBLICAS.some(
    ruta => pathname === ruta || pathname.startsWith(`${ruta}/`)
  )

  // ¿Es una ruta de autenticación (login/registro)?
  const esRutaAuth = RUTAS_AUTH.some(
    ruta => pathname === ruta || pathname.startsWith(`${ruta}/`)
  )

  // Si NO está logueado e intenta entrar a una ruta privada → al login
  if (!isAuth && !esRutaPublica) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Si SÍ está logueado e intenta entrar al login/registro → al home
  if (isAuth && esRutaAuth) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}