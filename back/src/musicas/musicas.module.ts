import { Module } from '@nestjs/common';
import { MusicasController } from './musicas.controller';
import { MusicasService } from './musicas.service';

@Module({
  controllers: [MusicasController],
  providers: [MusicasService],
  exports: [MusicasService],
})
export class MusicasModule {}
