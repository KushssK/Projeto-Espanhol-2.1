-- Migration: autenticação por código de acesso (6 caracteres) no lugar de senha
-- Colunas adicionadas como opcionais/default para não quebrar o deploy mesmo
-- com usuários existentes (a limpeza de usuários remove os registros antigos).

-- 1. Remover a senha (o login passa a usar apenas e-mail + código de acesso)
ALTER TABLE "User" DROP COLUMN "passwordHash";

-- 2. Hash do código de acesso (nunca armazenado em texto puro)
ALTER TABLE "User" ADD COLUMN "accessCodeHash" TEXT;

-- 3. Proteção contra brute force: contagem de tentativas falhas e lockout
ALTER TABLE "User" ADD COLUMN "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "lockoutUntil" TIMESTAMP(3);