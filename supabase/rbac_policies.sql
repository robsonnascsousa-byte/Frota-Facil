-- =====================================================
-- ROLE BASED ACCESS CONTROL (RBAC)
-- Roles: 'admin', 'gerente', 'operacao'
-- =====================================================

-- 1. Adicionar coluna de Função (Role) ao Perfil
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin' 
CHECK (role IN ('admin', 'gerente', 'operacao'));

-- 2. Função auxiliar para verificar o papel do usuário atual
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- EXEMPLO DE POLÍTICAS POR PAPEL
-- Nota: Estas políticas substituem as genéricas "create_user_policies"
-- Você deve dropar as antigas antes ou ajustar os nomes.
-- =====================================================

-- --- TABELA VEÍCULOS ---
-- Admin e Gerente: Acesso Total
-- Operação: Apenas Leitura (SELECT)

DROP POLICY IF EXISTS "Users can view own veiculos" ON veiculos;
DROP POLICY IF EXISTS "Users can insert own veiculos" ON veiculos;
DROP POLICY IF EXISTS "Users can update own veiculos" ON veiculos;
DROP POLICY IF EXISTS "Users can delete own veiculos" ON veiculos;

CREATE POLICY "RBAC: Ver Veiculos" ON veiculos FOR SELECT
USING (auth.uid() = user_id); -- Todos veem seus próprios dados (ou da organização futura)

CREATE POLICY "RBAC: Criar Veiculos" ON veiculos FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND 
  public.get_user_role() IN ('admin', 'gerente')
);

CREATE POLICY "RBAC: Editar Veiculos" ON veiculos FOR UPDATE
USING (
  auth.uid() = user_id AND 
  public.get_user_role() IN ('admin', 'gerente')
);

CREATE POLICY "RBAC: Deletar Veiculos" ON veiculos FOR DELETE
USING (
  auth.uid() = user_id AND 
  public.get_user_role() = 'admin' -- Apenas Admin deleta
);

-- --- TABELA FINANCEIROPAGAMENTOS/DESPESAS ---
-- Admin: Total
-- Gerente: Ver e Criar (Sem Deletar)
-- Operação: Sem Acesso (ou apenas ver?) -> Vamos bloquear Operação

DROP POLICY IF EXISTS "Users can view own pagamentos" ON pagamentos;
-- ... (repetir drop para insert/update/delete)

CREATE POLICY "RBAC: Ver Financeiro" ON pagamentos FOR SELECT
USING (
  auth.uid() = user_id AND 
  public.get_user_role() IN ('admin', 'gerente') -- Operação não vê financeiro
);

-- ... (Outras tabelas seguem lógica similar)

-- =====================================================
-- OBSERVAÇÃO IMPORTANTE SOBRE "TIMES"
-- =====================================================
-- Atualmente, a cláusula "auth.uid() = user_id" isola cada usuário.
-- Se você criar um usuário "Operação", ele NÃO verá os carros do "Admin",
-- pois o user_id será diferente.
--
-- Para permitir que uma equipe veja os mesmos dados, é necessário:
-- 1. Criar uma tabela 'organizations'
-- 2. Vincular profiles a 'organization_id'
-- 3. Alterar as políticas para: 
--    USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()))
-- =====================================================
