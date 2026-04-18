import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { EscalacoesModule } from '../escalacoes/escalacoes.module';

@Module({
  imports: [EscalacoesModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
