import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EscalacoesService } from './escalacoes.service';
import { CreateEscalacaoDto } from './dto/create-escalacao.dto';
import { ConfirmacaoDto } from './dto/confirmacao.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Escalações')
@ApiBearerAuth()
@Controller('api')
export class EscalacoesController {
  constructor(private escalacaoService: EscalacoesService) {}

  @Get('escalacoes/minhas')
  @ApiOperation({ summary: 'Resumo das escalações do usuário logado' })
  getMinhas(@CurrentUser() user: any) {
    return this.escalacaoService.getMinhasEscalacoes(user.id);
  }

  @Get('escalacoes/detalhe/:repertorioId')
  @ApiOperation({ summary: 'Detalhe de escalação do usuário para um repertório' })
  getDetalhe(
    @Param('repertorioId', ParseIntPipe) repertorioId: number,
    @CurrentUser() user: any,
  ) {
    return this.escalacaoService.getDetalhe(repertorioId, user.id);
  }

  @Post('escalacoes')
  @ApiOperation({ summary: 'Escalar músico em um repertório' })
  escalar(@Body() dto: CreateEscalacaoDto) {
    return this.escalacaoService.escalar(dto);
  }

  @Delete('escalacoes/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover músico de um repertório' })
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.escalacaoService.remover(id);
  }

  @Post('confirmacoes')
  @ApiOperation({ summary: 'Confirmar/negar conhecimento de uma música' })
  confirmar(@Body() dto: ConfirmacaoDto) {
    return this.escalacaoService.confirmar(dto);
  }

  @Get('confirmacoes/repertorio/:id')
  @ApiOperation({ summary: 'Visão geral das confirmações de um repertório' })
  getConfirmacoes(@Param('id', ParseIntPipe) id: number) {
    return this.escalacaoService.getConfirmacoesRepertorio(id);
  }
}
