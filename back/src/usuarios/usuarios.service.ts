import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePerfilDto } from './dto/update-perfil.dto';

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  async getMe(userId: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: userId },
    });
    if (!usuario) throw new NotFoundException('Usuário não encontrado.');
    return this.sanitize(usuario);
  }

  async updateMe(userId: number, dto: UpdatePerfilDto) {
    const usuario = await this.prisma.usuario.update({
      where: { id: userId },
      data: {
        ...(dto.nome && { nome: dto.nome }),
        ...(dto.email && { email: dto.email }),
        ...(dto.funcao !== undefined && { funcao: dto.funcao }),
        ...(dto.ministerio !== undefined && { ministerio: dto.ministerio }),
        ...(dto.avatar !== undefined && { avatar: dto.avatar }),
        ...(dto.instrumentos && { instrumentos: dto.instrumentos }),
        ...(dto.dataMembro && { dataMembro: new Date(dto.dataMembro) }),
      },
    });
    return this.sanitize(usuario);
  }

  async getMembros(page = 0, size = 50) {
    const [membros, total] = await this.prisma.$transaction([
      this.prisma.usuario.findMany({
        skip: page * size,
        take: size,
        orderBy: { nome: 'asc' },
      }),
      this.prisma.usuario.count(),
    ]);
    return {
      conteudo: membros.map((u) => this.sanitize(u)),
      total,
      pagina: page,
      tamanhoPagina: size,
    };
  }

  async getById(id: number) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id } });
    if (!usuario) throw new NotFoundException('Usuário não encontrado.');
    return this.sanitize(usuario);
  }

  private sanitize(usuario: any) {
    const { senhaHash: _, ...rest } = usuario;
    const primeiroNome = rest.nome?.split(' ')[0] ?? '';
    const iniciais = rest.nome
      ?.split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p: string) => p[0].toUpperCase())
      .join('') ?? '';
    return { ...rest, primeiroNome, iniciais };
  }
}
