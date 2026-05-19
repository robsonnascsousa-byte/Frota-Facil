-- =====================================================
-- MIGRATION: Align manutencoes table with frontend
-- Run this in your Supabase SQL Editor
-- =====================================================

-- 1. Add 'fornecedor' column (frontend uses this name instead of 'oficina')
ALTER TABLE manutencoes ADD COLUMN IF NOT EXISTS fornecedor TEXT;

-- 2. Copy existing 'oficina' data to 'fornecedor'
UPDATE manutencoes SET fornecedor = oficina WHERE fornecedor IS NULL AND oficina IS NOT NULL;

-- 3. Make 'descricao' nullable (frontend doesn't always send it, uses 'tipo' instead)
ALTER TABLE manutencoes ALTER COLUMN descricao DROP NOT NULL;

-- 4. Drop tipo CHECK constraint if it still exists (frontend allows free text)
ALTER TABLE manutencoes DROP CONSTRAINT IF EXISTS manutencoes_tipo_check;

-- 5. Update status constraint to include 'Atrasado'
ALTER TABLE manutencoes DROP CONSTRAINT IF EXISTS manutencoes_status_check;
ALTER TABLE manutencoes ADD CONSTRAINT manutencoes_status_check
    CHECK (status IN ('Paga', 'Em aberto', 'Atrasado'));

-- 6. Add 'documentos_anexados' column for attached documents (JSONB)
ALTER TABLE manutencoes ADD COLUMN IF NOT EXISTS documentos_anexados JSONB DEFAULT '[]'::jsonb;

-- =====================================================
-- DONE! Manutencoes table is now aligned with frontend.
-- =====================================================
