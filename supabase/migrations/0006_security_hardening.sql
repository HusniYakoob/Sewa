-- ============================================================================
-- Minor security hardening (from the Supabase advisor after DDL changes).
-- Pin the phone helper's search_path, and stop trigger-only functions from
-- being reachable through the REST RPC surface.
-- ============================================================================

alter function public.normalized_phone(text) set search_path = pg_catalog;

revoke execute on function public.handle_new_user() from anon, authenticated, public;
revoke execute on function public.on_review_change() from anon, authenticated, public;
revoke execute on function public.set_updated_at() from anon, authenticated, public;
