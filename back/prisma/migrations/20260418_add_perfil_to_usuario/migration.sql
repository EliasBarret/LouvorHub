-- ============================================================
-- LouvorHub - Migração: adicionar coluna perfil em usuarios
-- Execute este arquivo no SQL Editor do Supabase Dashboard
-- após ter executado a migração inicial (20260418_init)
-- ============================================================

ALTER TABLE "usuarios"
  ADD COLUMN "perfil" "PerfilMembro" NOT NULL DEFAULT 'Musico';
