import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://htgxpflareheltfewlif.supabase.co'
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0Z3hwZmxhcmVoZWx0ZmV3bGlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1MjUyNDgsImV4cCI6MjEwNDEwMTI0OH0.bGY0dDUnntJNqz7vrB9DfX5Y912hp-cFkHRD2rcbIFc'

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}
