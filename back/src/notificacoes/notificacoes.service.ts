import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TipoNotificacao } from '@prisma/client';

@Injectable()
export class NotificacoesService {
  constructor(private prisma: PrismaService) {}

  async getAll(userId: number, page = 0, size = 50) {
    const [notificacoes, total] = await this.prisma.$transaction([
      this.prisma.notificacao.findMany({
        where: { usuarioId: userId },
        skip: page * size,
        take: size,
        orderBy: { criadoEm: 'desc' },
      }),
      this.prisma.notificacao.count({ where: { usuarioId: userId } }),
    ]);
    return { conteudo: notificacoes, total, pagina: page, tamanhoPagina: size };
  }

  async marcarComoLida(id: number, userId: number) {
    const notif = await this.prisma.notificacao.findFirst({
      where: { id, usuarioId: userId },
    });
    if (!notif) throw new NotFoundException('Notificação não encontrada.');
    return this.prisma.notificacao.update({ where: { id }, data: { lida: true } });
  }

  async marcarTodasLidas(userId: number) {
    await this.prisma.notificacao.updateMany({
      where: { usuarioId: userId, lida: false },
      data: { lida: true },
    });
  }

  async getNaoLidasCount(userId: number) {
    return this.prisma.notificacao.count({
      where: { usuarioId: userId, lida: false },
    });
  }

  async criar(
    usuarioId: number,
    titulo: string,
    mensagem: string,
    tipo: TipoNotificacao,
    referenciaId?: number,
    referenciaTipo?: string,
  ) {
    return this.prisma.notificacao.create({
      data: { usuarioId, titulo, mensagem, tipo, referenciaId, referenciaTipo },
    });
  }
}
