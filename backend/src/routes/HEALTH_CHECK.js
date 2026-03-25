import { createClient } from '@supabase/supabase-js';

export function getSupabase(c) {
  const url = c.env.SUPABASE_URL;
  const key =
    c.env.SUPABASE_SERVICE_ROLE_KEY ||
    c.env.SUPABASE_SECRET_KEY ||
    c.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    console.error("❌ Supabase config missing");
    throw new Error('Supabase configuration missing');
  }

  console.log("✅ Supabase initialized");

  return createClient(url, key, {
    global: { fetch },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
