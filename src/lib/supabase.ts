import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase client singletons.
 *
 * - `supabaseServer` (service role) — used server-side only (uploads, bucket management).
 * - `supabasePublic` (anon key) — safe for any environment; used for public URLs.
 *
 * NOTE: Service role key bypasses RLS. Never expose it to the client.
 */

const globalForSupabase = globalThis as unknown as {
  supabaseServer: SupabaseClient | undefined
}

export function getSupabaseServer(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)')
  }

  if (!globalForSupabase.supabaseServer) {
    globalForSupabase.supabaseServer = createClient(url, key, {
      auth: { persistSession: false },
    })
  }

  return globalForSupabase.supabaseServer
}

export function getSupabaseBucket(): string {
  return process.env.SUPABASE_BUCKET || 'indio-uploads'
}
