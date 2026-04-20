-- Add TipoMusica enum and tipos column to musicas table
CREATE TYPE "TipoMusica" AS ENUM ('Adoracao', 'Solo', 'Ofertorio', 'Abertura', 'DistribuicaoElementos', 'Apelo');

ALTER TABLE "musicas" ADD COLUMN "tipos" "TipoMusica"[] NOT NULL DEFAULT '{}';
