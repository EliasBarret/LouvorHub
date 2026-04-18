import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IgrejasService } from './igrejas.service';
import { CreateIgrejaDto, UpdateIgrejaDto } from './dto/create-igreja.dto';
import { AddMembroDto } from './dto/add-membro.dto';

@ApiTags('Igrejas')
@ApiBearerAuth()
@Controller('api/igrejas')
export class IgrejasController {
  constructor(private igrejasService: IgrejasService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas as igrejas' })
  getAll() {
    return this.igrejasService.getAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar igreja por ID' })
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.igrejasService.getById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar nova igreja' })
  create(@Body() dto: CreateIgrejaDto) {
    return this.igrejasService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar igreja' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateIgrejaDto) {
    return this.igrejasService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover igreja' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.igrejasService.remove(id);
  }

  @Get(':id/membros')
  @ApiOperation({ summary: 'Listar membros de uma igreja' })
  getMembros(@Param('id', ParseIntPipe) id: number) {
    return this.igrejasService.getMembros(id);
  }

  @Post(':id/membros')
  @ApiOperation({ summary: 'Adicionar membro à igreja' })
  addMembro(@Param('id', ParseIntPipe) id: number, @Body() dto: AddMembroDto) {
    return this.igrejasService.addMembro(id, dto);
  }

  @Delete('membros/:membroId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover membro da igreja' })
  removeMembro(@Param('membroId', ParseIntPipe) membroId: number) {
    return this.igrejasService.removeMembro(membroId);
  }

  @Get('usuario/:usuarioId')
  @ApiOperation({ summary: 'Listar igrejas de um usuário' })
  getByUsuario(@Param('usuarioId', ParseIntPipe) usuarioId: number) {
    return this.igrejasService.getIgrejasByUsuario(usuarioId);
  }
}
