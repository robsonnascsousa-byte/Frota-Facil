-- =====================================================
-- SISTEMA DE AUDITORIA (AUDIT LOGS)
-- Rastreia quem mudou o que, quando e o que mudou.
-- =====================================================

-- 1. Tabela de Logs de Auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL, -- ID do registro afetado (convertido para texto)
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB, -- Dados anteriores (apenas para UPDATE/DELETE)
    new_data JSONB, -- Novos dados (apenas para INSERT/UPDATE)
    user_id UUID DEFAULT auth.uid(), -- Quem fez a alteração
    user_role TEXT, -- Papel do usuário no momento (snapshot)
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ativar RLS na tabela de logs (apenas Admins devem ver logs?)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Política: Apenas Admins podem ver os logs
CREATE POLICY "Admins ver logs" ON audit_logs FOR SELECT
USING (
  public.get_user_role() = 'admin'
);

-- Política: Sistema insere logs (via Trigger, bypass RLS no insert não é necessário se função for Security Definer)
-- Na prática, triggers rodam com permissão do dono da tabela ou definer, mas inserção direta deve ser bloqueada.

-- 2. Função de Trigger Genérica
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
  v_old_data JSONB;
  v_new_data JSONB;
  v_record_id TEXT;
  v_user_role TEXT;
BEGIN
  -- Tentar obter role se a função existir
  BEGIN
    v_user_role := public.get_user_role();
  EXCEPTION WHEN OTHERS THEN
    v_user_role := 'unknown';
  END;

  IF (TG_OP = 'INSERT') THEN
    v_new_data := to_jsonb(NEW);
    v_record_id := NEW.id::TEXT;
  ELSIF (TG_OP = 'UPDATE') THEN
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
    v_record_id := NEW.id::TEXT;
  ELSIF (TG_OP = 'DELETE') THEN
    v_old_data := to_jsonb(OLD);
    v_record_id := OLD.id::TEXT;
  END IF;

  INSERT INTO public.audit_logs (
    table_name,
    record_id,
    operation,
    old_data,
    new_data,
    user_id,
    user_role
  ) VALUES (
    TG_TABLE_NAME,
    v_record_id,
    TG_OP,
    v_old_data,
    v_new_data,
    auth.uid(),
    v_user_role
  );
  
  RETURN NULL; -- Resultado ignorado para triggers AFTER
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Aplicar Triggers nas Tabelas Críticas
-- (Descomente ou rode conforme necessidade)

DROP TRIGGER IF EXISTS audit_veiculos ON veiculos;
CREATE TRIGGER audit_veiculos
AFTER INSERT OR UPDATE OR DELETE ON veiculos
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

DROP TRIGGER IF EXISTS audit_motoristas ON motoristas;
CREATE TRIGGER audit_motoristas
AFTER INSERT OR UPDATE OR DELETE ON motoristas
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

DROP TRIGGER IF EXISTS audit_contratos ON contratos;
CREATE TRIGGER audit_contratos
AFTER INSERT OR UPDATE OR DELETE ON contratos
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

DROP TRIGGER IF EXISTS audit_pagamentos ON pagamentos;
CREATE TRIGGER audit_pagamentos
AFTER INSERT OR UPDATE OR DELETE ON pagamentos
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

DROP TRIGGER IF EXISTS audit_manutencoes ON manutencoes;
CREATE TRIGGER audit_manutencoes
AFTER INSERT OR UPDATE OR DELETE ON manutencoes
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- Adicione outras tabelas conforme necessário
