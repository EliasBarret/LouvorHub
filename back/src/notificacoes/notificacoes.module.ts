import { Module } from '@nestjs/common';
import { NotificacoesController } from './notificacoes.controller';
import { NotificacoesService } from './notificacoes.service';
import { NotificacoesScheduler } from './notificacoes.scheduler';

@Module({
  controllers: [NotificacoesController],
  providers: [NotificacoesService, NotificacoesScheduler],
  exports: [NotificacoesService],
})
export class NotificacoesModule {}
