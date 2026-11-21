import { createClient } from '@supabase/supabase-js'

// Clé « publishable » : publique par nature, la protection vient des règles RLS de la table.
export const supabase = createClient(
  'https://rjnodshmmhdkfskmqwbf.supabase.co',
  'sb_publishable_Ep7WZ4HYnTMCEgD09nQMyQ_t9OCW-9P',
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } },
)
