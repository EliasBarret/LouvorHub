import { Module } from '@nestjs/common';
import { RepertoriosController } from './repertorios.controller';
import { RepertoriosService } from './repertorios.service';

@Module({
  controllers: [RepertoriosController],
  providers: [RepertoriosService],
  exports: [RepertoriosService],
})
export class RepertoriosModule {}
