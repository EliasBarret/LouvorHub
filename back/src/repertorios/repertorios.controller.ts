import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  Query,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RepertoriosService } from './repertorios.service';
import { CreateRepertorioDto, UpdateRepertorioDto } from './dto/create-repertorio.dto';
import { ReprovacaoDto } from './dto/aprovacao.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Repertórios')
@ApiBearerAuth()
@Controller('api/repertorios')
export class RepertoriosController {
  constructor(private repertoriosService: RepertoriosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar repertórios' })
  getAll(
    @Query('pagina', new ParseIntPipe({ optional: true })) pagina = 0,
    @Query('tamanhoPagina', new ParseIntPipe({ optional: true })) tamanhoPagina = 50,
  ) {
    return this.repertoriosService.getAll(pagina, tamanhoPagina);
  }

  @Get('pendentes')
  @ApiOperation({ summary: 'Listar repertórios pendentes de aprovação' })
  getPendentes() {
    return this.repertoriosService.getPendentes();
  }

  @Get('tipos-culto')
  @ApiOperation({ summary: 'Listar tipos de culto disponíveis' })
  getTiposCulto() {
    return this.repertoriosService.getTiposCulto();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar repertório por ID' })
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.repertoriosService.getById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo repertório' })
  create(@Body() dto: CreateRepertorioDto, @CurrentUser() user: any) {
    const perfisPermitidos = ['ADM', 'Pastor', 'Ministro'];
    if (!perfisPermitidos.includes(user.perfil)) {
      throw new ForbiddenException('Apenas Administrador, Pastor ou Ministro podem criar repertórios.');
    }
    return this.repertoriosService.create(dto, user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar repertório' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRepertorioDto) {
    return this.repertoriosService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover repertório' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.repertoriosService.remove(id);
  }

  @Patch(':id/publicar')
  @ApiOperation({ summary: 'Publicar repertório (enviar para aprovação)' })
  publicar(@Param('id', ParseIntPipe) id: number) {
    return this.repertoriosService.publicar(id);
  }

  @Patch(':id/aprovar')
  @ApiOperation({ summary: 'Aprovar repertório (pastor)' })
  aprovar(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.repertoriosService.aprovar(id, user.id);
  }

  @Patch(':id/reprovar')
  @ApiOperation({ summary: 'Reprovar repertório (pastor)' })
  reprovar(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Body() dto: ReprovacaoDto,
  ) {
    return this.repertoriosService.reprovar(id, user.id, dto);
  }
}
