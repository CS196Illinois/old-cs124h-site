import { createClient } from "@supabase/supabase-js";

// Server-only client — uses the secret key which is NEVER sent to the browser.
// Do NOT add NEXT_PUBLIC_ to these env vars.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

export const supabaseServer = createClient(supabaseUrl, supabaseSecretKey);
