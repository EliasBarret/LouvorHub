import { Module } from '@nestjs/common';
import { EscalacoesController } from './escalacoes.controller';
import { EscalacoesService } from './escalacoes.service';
import { NotificacoesModule } from '../notificacoes/notificacoes.module';

@Module({
  imports: [NotificacoesModule],
  controllers: [EscalacoesController],
  providers: [EscalacoesService],
  exports: [EscalacoesService],
})
export class EscalacoesModule {}
