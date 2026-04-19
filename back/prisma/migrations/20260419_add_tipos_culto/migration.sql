-- CreateTable
CREATE TABLE "tipos_culto" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "horario" TEXT NOT NULL,
    "igreja_id" INTEGER,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tipos_culto_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tipos_culto" ADD CONSTRAINT "tipos_culto_igreja_id_fkey" FOREIGN KEY ("igreja_id") REFERENCES "igrejas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
