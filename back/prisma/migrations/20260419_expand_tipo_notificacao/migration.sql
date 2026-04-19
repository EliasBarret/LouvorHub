-- Expandir enum TipoNotificacao com novos tipos de notificação

ALTER TYPE "TipoNotificacao" ADD VALUE IF NOT EXISTS 'lembrete_culto';
ALTER TYPE "TipoNotificacao" ADD VALUE IF NOT EXISTS 'lembrete_culto_hora';
ALTER TYPE "TipoNotificacao" ADD VALUE IF NOT EXISTS 'repertorio_alterado';
ALTER TYPE "TipoNotificacao" ADD VALUE IF NOT EXISTS 'repertorio_aprovado';
ALTER TYPE "TipoNotificacao" ADD VALUE IF NOT EXISTS 'repertorio_reprovado';
ALTER TYPE "TipoNotificacao" ADD VALUE IF NOT EXISTS 'repertorio_pendente_aprovacao';
ALTER TYPE "TipoNotificacao" ADD VALUE IF NOT EXISTS 'confirmacao_pendente';
ALTER TYPE "TipoNotificacao" ADD VALUE IF NOT EXISTS 'musico_confirmou';
