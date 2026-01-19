import { createClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client for server-only usage (webhooks, jobs).
 * Uses SUPABASE_SERVICE_ROLE_KEY to bypass RLS for trusted operations.
 *
 * IMPORTANT:
 * - Never expose the service role key to the client.
 * - Only import this module in server-side code paths.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        'X-Client-Info': 'infographic-ai/admin',
      },
    },
  })
}