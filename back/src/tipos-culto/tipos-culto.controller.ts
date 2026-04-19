import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TiposCultoService } from './tipos-culto.service';
import { CreateTipoCultoDto, UpdateTipoCultoDto } from './dto/create-tipo-culto.dto';

@ApiTags('Tipos de Culto')
@ApiBearerAuth()
@Controller('api/tipos-culto')
export class TiposCultoController {
  constructor(private tiposCultoService: TiposCultoService) {}

  @Get()
  @ApiOperation({ summary: 'Listar tipos de culto' })
  getAll(@Query('igrejaId', new ParseIntPipe({ optional: true })) igrejaId?: number) {
    return this.tiposCultoService.getAll(igrejaId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar tipo de culto por ID' })
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.tiposCultoService.getById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar tipo de culto' })
  create(@Body() dto: CreateTipoCultoDto) {
    return this.tiposCultoService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar tipo de culto' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTipoCultoDto) {
    return this.tiposCultoService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover tipo de culto' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tiposCultoService.remove(id);
  }
}
