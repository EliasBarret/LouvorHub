-- AlterTable: add horario_fim to tipos_culto
ALTER TABLE "tipos_culto" ADD COLUMN "horario_fim" TEXT;

-- AlterTable: add horario_fim to repertorios
ALTER TABLE "repertorios" ADD COLUMN "horario_fim" TEXT;
