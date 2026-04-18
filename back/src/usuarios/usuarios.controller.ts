import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  ParseIntPipe,
  Query,
  ParseIntPipe as ParseInt,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service';
import { UpdatePerfilDto } from './dto/update-perfil.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Usuarios')
@ApiBearerAuth()
@Controller('api/usuarios')
export class UsuariosController {
  constructor(private usuariosService: UsuariosService) {}

  @Get('me')
  @ApiOperation({ summary: 'Retorna dados do usuário autenticado' })
  getMe(@CurrentUser() user: any) {
    return this.usuariosService.getMe(user.id);
  }

  @Put('me')
  @ApiOperation({ summary: 'Atualiza perfil do usuário autenticado' })
  updateMe(@CurrentUser() user: any, @Body() dto: UpdatePerfilDto) {
    return this.usuariosService.updateMe(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os membros' })
  getMembros(
    @Query('pagina', new ParseIntPipe({ optional: true })) pagina = 0,
    @Query('tamanhoPagina', new ParseIntPipe({ optional: true })) tamanhoPagina = 50,
  ) {
    return this.usuariosService.getMembros(pagina, tamanhoPagina);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca membro por ID' })
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.getById(id);
  }
}
