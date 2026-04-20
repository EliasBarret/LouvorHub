-- CreateTable
CREATE TABLE "blocos_repertorio" (
    "id" SERIAL NOT NULL,
    "repertorio_id" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "blocos_repertorio_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "repertorios_musicas"
    ADD COLUMN "bloco_id" INTEGER,
    ADD COLUMN "tom_override" TEXT;

-- AddForeignKey
ALTER TABLE "blocos_repertorio" ADD CONSTRAINT "blocos_repertorio_repertorio_id_fkey"
    FOREIGN KEY ("repertorio_id") REFERENCES "repertorios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repertorios_musicas" ADD CONSTRAINT "repertorios_musicas_bloco_id_fkey"
    FOREIGN KEY ("bloco_id") REFERENCES "blocos_repertorio"("id") ON DELETE SET NULL ON UPDATE CASCADE;
