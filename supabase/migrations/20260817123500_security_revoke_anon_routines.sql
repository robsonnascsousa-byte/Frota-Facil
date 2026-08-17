-- Fecha a execução de RPCs por clientes sem sessão e mantém uma allowlist.
BEGIN;

REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_venda_veiculo(INTEGER, NUMERIC, DATE, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_profile_role(UUID, TEXT) TO authenticated;

COMMIT;
