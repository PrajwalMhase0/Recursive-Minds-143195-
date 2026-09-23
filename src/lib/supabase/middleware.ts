import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://htgxpflareheltfewlif.supabase.co'
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0Z3hwZmxhcmVoZWx0ZmV3bGlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1MjUyNDgsImV4cCI6MjEwNDEwMTI0OH0.bGY0dDUnntJNqz7vrB9DfX5Y912hp-cFkHRD2rcbIFc'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const supabase = createServerClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // Refresh auth token only if Supabase session cookie exists
    const hasAuthCookie = request.cookies
      .getAll()
      .some(c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'))

    if (hasAuthCookie) {
      await supabase.auth.getUser()
    }
  } catch (err) {
    // Under no circumstances should middleware crash the page load
    console.warn('Middleware updateSession caught error:', err)
  }

  return supabaseResponse
}
