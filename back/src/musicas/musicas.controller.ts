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
import { MusicasService } from './musicas.service';
import { CreateMusicaDto, UpdateMusicaDto } from './dto/create-musica.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Musicas')
@ApiBearerAuth()
@Controller('api/musicas')
export class MusicasController {
  constructor(private musicasService: MusicasService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas as músicas' })
  getAll(
    @Query('pagina', new ParseIntPipe({ optional: true })) pagina = 0,
    @Query('tamanhoPagina', new ParseIntPipe({ optional: true })) tamanhoPagina = 50,
  ) {
    return this.musicasService.getAll(pagina, tamanhoPagina);
  }

  @Get('tags')
  @ApiOperation({ summary: 'Listar tags disponíveis' })
  getTags() {
    return this.musicasService.getTags();
  }

  @Get('tons')
  @ApiOperation({ summary: 'Listar tons disponíveis' })
  getTons() {
    return this.musicasService.getTons();
  }

  @Get('instrumentos')
  @ApiOperation({ summary: 'Listar instrumentos disponíveis' })
  getInstrumentos() {
    return this.musicasService.getInstrumentos();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar música por ID' })
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.musicasService.getById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar nova música' })
  create(@Body() dto: CreateMusicaDto, @CurrentUser() user: any) {
    return this.musicasService.create(dto, user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar música' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMusicaDto) {
    return this.musicasService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover música' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.musicasService.remove(id);
  }
}
