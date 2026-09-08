-- Migration: remove o sistema de códigos de acesso (autenticação passa a ser
-- apenas e-mail + senha). A coluna era opcional; nenhum dado de usuário é
-- afetado — apenas o hash do código de acesso é descartado.

ALTER TABLE "User" DROP COLUMN IF EXISTS "accessCodeHash";
