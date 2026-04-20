import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

import { PrismaModule } from './prisma/prisma.module';
import { EmailModule } from './email/email.module';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { IgrejasModule } from './igrejas/igrejas.module';
import { MusicasModule } from './musicas/musicas.module';
import { RepertoriosModule } from './repertorios/repertorios.module';
import { EscalacoesModule } from './escalacoes/escalacoes.module';
import { NotificacoesModule } from './notificacoes/notificacoes.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { TiposCultoModule } from './tipos-culto/tipos-culto.module';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    ScheduleModule.forRoot(),
    PrismaModule,
    EmailModule,
    AuthModule,
    UsuariosModule,
    IgrejasModule,
    MusicasModule,
    RepertoriosModule,
    EscalacoesModule,
    NotificacoesModule,
    DashboardModule,
    TiposCultoModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}

