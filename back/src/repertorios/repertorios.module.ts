import { Module } from '@nestjs/common';
import { RepertoriosController } from './repertorios.controller';
import { RepertoriosService } from './repertorios.service';
import { NotificacoesModule } from '../notificacoes/notificacoes.module';

@Module({
  imports: [NotificacoesModule],
  controllers: [RepertoriosController],
  providers: [RepertoriosService],
  exports: [RepertoriosService],
})
export class RepertoriosModule {}
