import { Module } from '@nestjs/common';
import { EscalacoesController } from './escalacoes.controller';
import { EscalacoesService } from './escalacoes.service';

@Module({
  controllers: [EscalacoesController],
  providers: [EscalacoesService],
  exports: [EscalacoesService],
})
export class EscalacoesModule {}
