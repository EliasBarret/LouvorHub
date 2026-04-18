-- ============================================================
-- LouvorHub - Migração inicial
-- Execute este arquivo no SQL Editor do Supabase Dashboard
-- ============================================================

-- Enums
CREATE TYPE "PerfilMembro"     AS ENUM ('ADM', 'Pastor', 'Ministro', 'Musico', 'Cantor');
CREATE TYPE "StatusRepertorio" AS ENUM ('aguardando_aprovacao', 'aprovado', 'reprovado');
CREATE TYPE "StatusConfirmacao" AS ENUM ('conhece', 'nao_conhece', 'pendente');
CREATE TYPE "TipoNotificacao"  AS ENUM ('escalacao', 'confirmacao', 'aviso', 'sistema');

-- ─── usuarios ──────────────────────────────────────────────
CREATE TABLE "usuarios" (
  "id"            SERIAL      PRIMARY KEY,
  "nome"          TEXT        NOT NULL,
  "email"         TEXT        NOT NULL UNIQUE,
  "senha_hash"    TEXT        NOT NULL,
  "funcao"        TEXT        NOT NULL DEFAULT '',
  "ministerio"    TEXT        NOT NULL DEFAULT '',
  "avatar"        TEXT,
  "instrumentos"  TEXT[]      NOT NULL DEFAULT '{}',
  "data_membro"   TIMESTAMP WITH TIME ZONE,
  "criado_em"     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "atualizado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ─── igrejas ───────────────────────────────────────────────
CREATE TABLE "igrejas" (
  "id"          SERIAL  PRIMARY KEY,
  "nome"        TEXT    NOT NULL,
  "cidade"      TEXT,
  "observacoes" TEXT,
  "criado_em"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ─── membros_igrejas ───────────────────────────────────────
CREATE TABLE "membros_igrejas" (
  "id"          SERIAL          PRIMARY KEY,
  "usuario_id"  INT             NOT NULL REFERENCES "usuarios"("id") ON DELETE CASCADE,
  "igreja_id"   INT             NOT NULL REFERENCES "igrejas"("id")  ON DELETE CASCADE,
  "perfil"      "PerfilMembro"  NOT NULL,
  UNIQUE ("usuario_id", "igreja_id")
);

-- ─── tags ──────────────────────────────────────────────────
CREATE TABLE "tags" (
  "id"   SERIAL PRIMARY KEY,
  "nome" TEXT   NOT NULL UNIQUE,
  "cor"  TEXT   NOT NULL DEFAULT '#6B7280'
);

-- ─── musicas ───────────────────────────────────────────────
CREATE TABLE "musicas" (
  "id"            SERIAL  PRIMARY KEY,
  "titulo"        TEXT    NOT NULL,
  "artista"       TEXT    NOT NULL DEFAULT '',
  "tom"           TEXT    NOT NULL DEFAULT '',
  "bpm"           INT     NOT NULL DEFAULT 0,
  "link_youtube"  TEXT    NOT NULL DEFAULT '',
  "link_spotify"  TEXT    NOT NULL DEFAULT '',
  "observacoes"   TEXT    NOT NULL DEFAULT '',
  "ultimo_uso"    TIMESTAMP WITH TIME ZONE,
  "criado_em"     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "criado_por_id" INT     NOT NULL REFERENCES "usuarios"("id")
);

-- ─── musicas_tags ──────────────────────────────────────────
CREATE TABLE "musicas_tags" (
  "musica_id" INT NOT NULL REFERENCES "musicas"("id") ON DELETE CASCADE,
  "tag_id"    INT NOT NULL REFERENCES "tags"("id")    ON DELETE CASCADE,
  PRIMARY KEY ("musica_id", "tag_id")
);

-- ─── repertorios ───────────────────────────────────────────
CREATE TABLE "repertorios" (
  "id"          SERIAL              PRIMARY KEY,
  "nome"        TEXT                NOT NULL,
  "data_culto"  TIMESTAMP WITH TIME ZONE NOT NULL,
  "horario"     TEXT,
  "tipo_culto"  TEXT                NOT NULL,
  "local_culto" TEXT,
  "aviso"       TEXT,
  "status"      "StatusRepertorio"  NOT NULL DEFAULT 'aguardando_aprovacao',
  "criado_em"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "criador_id"  INT                 NOT NULL REFERENCES "usuarios"("id"),
  "igreja_id"   INT                 REFERENCES "igrejas"("id")
);

-- ─── repertorios_musicas ───────────────────────────────────
CREATE TABLE "repertorios_musicas" (
  "repertorio_id" INT NOT NULL REFERENCES "repertorios"("id") ON DELETE CASCADE,
  "musica_id"     INT NOT NULL REFERENCES "musicas"("id")     ON DELETE CASCADE,
  "ordem"         INT NOT NULL DEFAULT 0,
  PRIMARY KEY ("repertorio_id", "musica_id")
);

-- ─── aprovacoes_repertorios ────────────────────────────────
CREATE TABLE "aprovacoes_repertorios" (
  "id"             SERIAL  PRIMARY KEY,
  "repertorio_id"  INT     NOT NULL UNIQUE REFERENCES "repertorios"("id") ON DELETE CASCADE,
  "pastor_id"      INT     NOT NULL REFERENCES "usuarios"("id"),
  "status"         TEXT    NOT NULL,
  "motivo"         TEXT,
  "data"           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ─── escalacoes_musicos ────────────────────────────────────
CREATE TABLE "escalacoes_musicos" (
  "id"             SERIAL PRIMARY KEY,
  "repertorio_id"  INT    NOT NULL REFERENCES "repertorios"("id") ON DELETE CASCADE,
  "usuario_id"     INT    NOT NULL REFERENCES "usuarios"("id")    ON DELETE CASCADE,
  UNIQUE ("repertorio_id", "usuario_id")
);

-- ─── musicas_escaladas ─────────────────────────────────────
CREATE TABLE "musicas_escaladas" (
  "id"            SERIAL PRIMARY KEY,
  "escalacao_id"  INT    NOT NULL REFERENCES "escalacoes_musicos"("id") ON DELETE CASCADE,
  "musica_id"     INT    NOT NULL REFERENCES "musicas"("id")            ON DELETE CASCADE,
  "instrumento"   TEXT   NOT NULL,
  UNIQUE ("escalacao_id", "musica_id")
);

-- ─── confirmacoes_musicas ──────────────────────────────────
CREATE TABLE "confirmacoes_musicas" (
  "id"                 SERIAL               PRIMARY KEY,
  "musica_escalada_id" INT                  NOT NULL UNIQUE REFERENCES "musicas_escaladas"("id") ON DELETE CASCADE,
  "musica_id"          INT                  NOT NULL REFERENCES "musicas"("id"),
  "status"             "StatusConfirmacao"  NOT NULL DEFAULT 'pendente',
  "atualizado_em"      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ─── notificacoes ──────────────────────────────────────────
CREATE TABLE "notificacoes" (
  "id"               SERIAL            PRIMARY KEY,
  "usuario_id"       INT               NOT NULL REFERENCES "usuarios"("id") ON DELETE CASCADE,
  "titulo"           TEXT              NOT NULL,
  "mensagem"         TEXT              NOT NULL,
  "tipo"             "TipoNotificacao" NOT NULL,
  "lida"             BOOLEAN           NOT NULL DEFAULT false,
  "criado_em"        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "referencia_id"    INT,
  "referencia_tipo"  TEXT
);

-- ─── Trigger: atualizado_em em usuarios ────────────────────
CREATE OR REPLACE FUNCTION update_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_usuarios_atualizado_em
BEFORE UPDATE ON "usuarios"
FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

-- ─── Trigger: atualizado_em em confirmacoes_musicas ────────
CREATE TRIGGER trg_confirmacoes_atualizado_em
BEFORE UPDATE ON "confirmacoes_musicas"
FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

-- ─── Seed: Tags padrão ─────────────────────────────────────
INSERT INTO "tags" ("nome", "cor") VALUES
  ('Adoração',    '#6366F1'),
  ('Louvor',      '#F59E0B'),
  ('Comunhão',    '#10B981'),
  ('Instrumental','#3B82F6'),
  ('Jovem',       '#EC4899'),
  ('Tradicional', '#8B5CF6'),
  ('Internacional','#14B8A6'),
  ('Nacional',    '#F97316')
ON CONFLICT ("nome") DO NOTHING;

-- ─── Prisma migrations tracking table ─────────────────────
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
  "id"                    TEXT        PRIMARY KEY,
  "checksum"              TEXT        NOT NULL,
  "finished_at"           TIMESTAMP WITH TIME ZONE,
  "migration_name"        TEXT        NOT NULL,
  "logs"                  TEXT,
  "rolled_back_at"        TIMESTAMP WITH TIME ZONE,
  "started_at"            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "applied_steps_count"   INT         NOT NULL DEFAULT 0
);
