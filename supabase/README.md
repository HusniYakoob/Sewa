# Supabase setup

The schema lives in `migrations/` and is applied in order. Money-critical logic
(payment capture, escrow release, wallet entries, payout/refund processing, PIN
checks) runs server-side with the service role and bypasses RLS.

## One-time setup

1. Create a project at https://supabase.com and note the Project URL and keys
   (Settings → API).
2. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server only, never exposed to the client)
3. Apply the schema. Either paste the files into the Supabase SQL editor in
   order, or use the CLI:

   ```bash
   npm i -g supabase
   supabase link --project-ref <your-project-ref>
   supabase db push          # applies migrations/
   # then run seed.sql once (SQL editor or psql) for categories
   ```

## Files

- `migrations/0001_initial_schema.sql` — tables, enums, indexes, triggers
- `migrations/0002_rls_policies.sql` — Row Level Security
- `seed.sql` — starter categories

## Notes

- A `profiles` row is created automatically when an auth user signs up
  (`handle_new_user` trigger), reading `role`, `full_name`, `phone` from the
  signup metadata.
- Regenerate `src/lib/supabase/types.ts` after schema changes:
  ```bash
  npx supabase gen types typescript --project-id <id> > src/lib/supabase/types.ts
  ```
