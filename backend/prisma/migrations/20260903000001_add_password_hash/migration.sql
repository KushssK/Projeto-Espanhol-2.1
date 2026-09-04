-- Migration: restaura a senha como segunda credencial de login
-- (login passa a exigir e-mail + senha + código de acesso de 6 caracteres).
-- Coluna adicionada como opcional para não quebrar o deploy com usuários existentes.

ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;