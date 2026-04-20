-- Add email verification and password reset token fields to usuarios
ALTER TABLE "usuarios"
  ADD COLUMN IF NOT EXISTS "email_verificado"        BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "token_verificacao"       TEXT,
  ADD COLUMN IF NOT EXISTS "token_redefinicao_senha" TEXT,
  ADD COLUMN IF NOT EXISTS "token_expiracao"         TIMESTAMP WITH TIME ZONE;
