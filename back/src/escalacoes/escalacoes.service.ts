import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEscalacaoDto } from './dto/create-escalacao.dto';
import { ConfirmacaoDto } from './dto/confirmacao.dto';
import { StatusConfirmacao } from '@prisma/client';

@Injectable()
export class EscalacoesService {
  constructor(private prisma: PrismaService) {}

  async getMinhasEscalacoes(userId: number) {
    const escalacoes = await this.prisma.escalacaoMusico.findMany({
      where: { usuarioId: userId },
      include: {
        repertorio: true,
        musicasEscaladas: {
          include: {
            musica: true,
            confirmacao: true,
          },
        },
      },
    });

    return escalacoes.map((e) => ({
      id: e.id,
      repertorioId: e.repertorioId,
      mes: new Date(e.repertorio.dataCulto)
        .toLocaleString('pt-BR', { month: 'short' })
        .toUpperCase()
        .replace('.', ''),
      dia: new Date(e.repertorio.dataCulto).getDate(),
      titulo: e.repertorio.tipoCulto,
      totalMusicas: e.musicasEscaladas.length,
      totalParticipacoes: e.musicasEscaladas.length,
      horario: e.repertorio.horario ?? '',
    }));
  }

  async getDetalhe(repertorioId: number, userId: number) {
    const escalacao = await this.prisma.escalacaoMusico.findUnique({
      where: { repertorioId_usuarioId: { repertorioId, usuarioId: userId } },
      include: {
        musicasEscaladas: {
          include: {
            musica: { include: { tags: { include: { tag: true } } } },
            confirmacao: true,
          },
        },
      },
    });
    if (!escalacao) throw new NotFoundException('Você não está escalado(a) neste repertório.');

    const repertorio = await this.prisma.repertorio.findUnique({
      where: { id: repertorioId },
      include: {
        musicas: { include: { musica: true } },
        aprovacao: { include: { pastor: true } },
      },
    });
    if (!repertorio) throw new NotFoundException('Repertório não encontrado.');

    return {
      repertorio: {
        ...repertorio,
        musicasIds: repertorio.musicas.map((m) => m.musicaId),
        musicas: repertorio.musicas.map((m) => m.musica),
      },
      escalacaoMusico: {
        id: escalacao.id,
        repertorioId: escalacao.repertorioId,
        usuarioId: escalacao.usuarioId,
        musicasEscaladas: escalacao.musicasEscaladas.map((me) => ({
          musicaId: me.musicaId,
          instrumento: me.instrumento,
        })),
      },
      musicasComConfirmacao: escalacao.musicasEscaladas.map((me) => ({
        musica: {
          ...me.musica,
          tags: (me.musica as any).tags?.map((mt: any) => mt.tag?.nome) ?? [],
        },
        instrumento: me.instrumento,
        confirmacao: me.confirmacao?.status ?? StatusConfirmacao.pendente,
      })),
    };
  }

  async escalar(dto: CreateEscalacaoDto) {
    const exists = await this.prisma.escalacaoMusico.findUnique({
      where: {
        repertorioId_usuarioId: {
          repertorioId: dto.repertorioId,
          usuarioId: dto.usuarioId,
        },
      },
    });
    if (exists) throw new ConflictException('Este músico já está escalado neste repertório.');

    const escalacao = await this.prisma.escalacaoMusico.create({
      data: {
        repertorioId: dto.repertorioId,
        usuarioId: dto.usuarioId,
        musicasEscaladas: {
          create: dto.musicasEscaladas.map((me) => ({
            musicaId: me.musicaId,
            instrumento: me.instrumento,
            confirmacao: { create: { musicaId: me.musicaId, status: StatusConfirmacao.pendente } },
          })),
        },
      },
      include: {
        musicasEscaladas: { include: { confirmacao: true } },
      },
    });
    return escalacao;
  }

  async remover(escalacaoId: number) {
    const escalacao = await this.prisma.escalacaoMusico.findUnique({
      where: { id: escalacaoId },
    });
    if (!escalacao) throw new NotFoundException('Escalação não encontrada.');
    await this.prisma.escalacaoMusico.delete({ where: { id: escalacaoId } });
  }

  async confirmar(dto: ConfirmacaoDto) {
    const musicaEscalada = await this.prisma.musicaEscalada.findUnique({
      where: {
        escalacaoId_musicaId: {
          escalacaoId: dto.escalacaoMusicoId,
          musicaId: dto.musicaId,
        },
      },
    });
    if (!musicaEscalada) throw new NotFoundException('Música escalada não encontrada.');

    const status = dto.status as unknown as StatusConfirmacao;
    return this.prisma.confirmacaoMusica.upsert({
      where: { musicaEscaladaId: musicaEscalada.id },
      create: { musicaEscaladaId: musicaEscalada.id, musicaId: dto.musicaId, status },
      update: { status },
    });
  }

  async getConfirmacoesRepertorio(repertorioId: number) {
    const escalacoes = await this.prisma.escalacaoMusico.findMany({
      where: { repertorioId },
      include: {
        usuario: { select: { id: true, nome: true, email: true, funcao: true, avatar: true } },
        musicasEscaladas: {
          include: {
            musica: { include: { tags: { include: { tag: true } } } },
            confirmacao: true,
          },
        },
      },
    });

    let totalConhecem = 0;
    let totalNaoConhecem = 0;
    let totalPendentes = 0;

    const porMusico = escalacoes.map((e) => {
      const musicasComConfirmacao = e.musicasEscaladas.map((me) => {
        const status = me.confirmacao?.status ?? StatusConfirmacao.pendente;
        if (status === StatusConfirmacao.conhece) totalConhecem++;
        else if (status === StatusConfirmacao.nao_conhece) totalNaoConhecem++;
        else totalPendentes++;
        return {
          musica: { ...me.musica, tags: (me.musica as any).tags?.map((mt: any) => mt.tag?.nome) ?? [] },
          instrumento: me.instrumento,
          confirmacao: status,
        };
      });
      return { usuario: e.usuario, musicasComConfirmacao };
    });

    return {
      repertorioId,
      totalMusicos: escalacoes.length,
      totalConhecem,
      totalNaoConhecem,
      totalPendentes,
      porMusico,
    };
  }

  async getPendentesCount(userId: number, fromDate?: Date): Promise<number> {
    const date = fromDate ?? (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();
    const result = await this.prisma.confirmacaoMusica.count({
      where: {
        status: StatusConfirmacao.pendente,
        musicaEscalada: { escalacao: { usuarioId: userId, repertorio: { dataCulto: { gte: date } } } },
      },
    });
    return result;
  }
}
