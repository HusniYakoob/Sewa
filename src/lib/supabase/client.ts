import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for Client Components ("use client").
 * Reads the public anon key; never expose the service role key here.
 *
 * Untyped for now. Once a Supabase project exists, generate schema-accurate
 * types and pass them as the generic:
 *   npx supabase gen types typescript --project-id <id> > src/lib/supabase/types.ts
 * Until then, cast query results to the domain interfaces in ./types.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
