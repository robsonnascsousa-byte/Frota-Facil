-- Remedia permissões herdadas do baseline após o diagnóstico do Database Advisor.
BEGIN;

REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon;

REVOKE ALL ON FUNCTION public.get_user_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_audit_event() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_unauthorized_role_change() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.set_profile_role(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_profile_role(UUID, TEXT) TO authenticated;

ALTER FUNCTION public.create_user_policies(TEXT) SET search_path = 'public';
REVOKE ALL ON FUNCTION public.create_user_policies(TEXT) FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.update_updated_at_column() SET search_path = '';

COMMIT;
