import {
  Controller,
  Get,
  Patch,
  Param,
  ParseIntPipe,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificacoesService } from './notificacoes.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Notificações')
@ApiBearerAuth()
@Controller('api/notificacoes')
export class NotificacoesController {
  constructor(private notificacoesService: NotificacoesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar notificações do usuário' })
  getAll(
    @CurrentUser() user: any,
    @Query('pagina', new ParseIntPipe({ optional: true })) pagina = 0,
    @Query('tamanhoPagina', new ParseIntPipe({ optional: true })) tamanhoPagina = 50,
  ) {
    return this.notificacoesService.getAll(user.id, pagina, tamanhoPagina);
  }

  @Get('nao-lidas/count')
  @ApiOperation({ summary: 'Quantidade de notificações não lidas' })
  getNaoLidas(@CurrentUser() user: any) {
    return this.notificacoesService.getNaoLidasCount(user.id);
  }

  @Patch('marcar-todas-lidas')
  @ApiOperation({ summary: 'Marcar todas as notificações como lidas' })
  @HttpCode(HttpStatus.NO_CONTENT)
  marcarTodasLidas(@CurrentUser() user: any) {
    return this.notificacoesService.marcarTodasLidas(user.id);
  }

  @Patch(':id/lida')
  @ApiOperation({ summary: 'Marcar notificação como lida' })
  marcarLida(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.notificacoesService.marcarComoLida(id, user.id);
  }
}
