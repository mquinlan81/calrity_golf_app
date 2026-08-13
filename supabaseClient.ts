/**
 * Convenience re-export. The live client lives at src/lib/supabaseClient.ts
 * and is initialized from .env (EXPO_PUBLIC_SUPABASE_URL / ANON_KEY).
 */
export { supabase, SUPABASE_ANON_KEY, SUPABASE_URL } from './src/lib/supabaseClient';
