import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TiposCultoController } from './tipos-culto.controller';
import { TiposCultoService } from './tipos-culto.service';

@Module({
  imports: [PrismaModule],
  controllers: [TiposCultoController],
  providers: [TiposCultoService],
  exports: [TiposCultoService],
})
export class TiposCultoModule {}
