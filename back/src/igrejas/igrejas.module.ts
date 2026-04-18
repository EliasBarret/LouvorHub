import { Module } from '@nestjs/common';
import { IgrejasController } from './igrejas.controller';
import { IgrejasService } from './igrejas.service';

@Module({
  controllers: [IgrejasController],
  providers: [IgrejasService],
  exports: [IgrejasService],
})
export class IgrejasModule {}
