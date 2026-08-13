import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Clarity Supabase client.
 * Anon key is expected in the mobile bundle; Row Level Security is the access control.
 */
export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL ??
  'https://dovscsygoerhhrdidfhh.supabase.co';

export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvdnNjc3lnb2VyaGhyZGlkZmhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2MDY4NDIsImV4cCI6MjEwMjE4Mjg0Mn0.lpyZ8JrfHcxsaqgik6xqcyo6h670F0zbFUEgIMtWeAg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
