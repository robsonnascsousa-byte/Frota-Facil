-- Script para definir seu usuário como administrador
-- Execute este script no SQL Editor do Supabase Dashboard

-- Opção 1: Definir TODOS os usuários existentes como admin (útil para o primeiro setup)
UPDATE profiles 
SET role = 'admin' 
WHERE role IS NULL OR role = '';

-- Opção 2: Definir um usuário específico como admin (substitua pelo seu email)
-- UPDATE profiles 
-- SET role = 'admin' 
-- WHERE email = 'SEU_EMAIL_AQUI@exemplo.com';

-- Verificar os usuários e seus roles após a atualização
SELECT id, email, nome, role, created_at 
FROM profiles 
ORDER BY created_at DESC;
