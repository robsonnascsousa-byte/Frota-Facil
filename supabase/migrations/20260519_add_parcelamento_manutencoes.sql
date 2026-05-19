-- =====================================================
-- MIGRATION: Add parcelamento_id to manutencoes
-- Run this in your Supabase SQL Editor
-- =====================================================

ALTER TABLE manutencoes ADD COLUMN IF NOT EXISTS parcelamento_id TEXT;
