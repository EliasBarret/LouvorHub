import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificacoesService } from '../notificacoes/notificacoes.service';
import { CreateRepertorioDto, UpdateRepertorioDto, MusicaRepertorioDto } from './dto/create-repertorio.dto';
import { ReprovacaoDto } from './dto/aprovacao.dto';
import { StatusRepertorio } from '@prisma/client';

@Injectable()
export class RepertoriosService {
  constructor(
    private prisma: PrismaService,
    private notificacoes: NotificacoesService,
  ) {}

  private include = {
    musicas: { include: { musica: { include: { tags: { include: { tag: true } } } } }, orderBy: { ordem: 'asc' as const } },
    aprovacao: { include: { pastor: { select: { id: true, nome: true, email: true } } } },
    criador: { select: { id: true, nome: true, email: true } },
    igreja: true,
    escalacoes: {
      include: {
        usuario: { select: { id: true, nome: true, email: true, perfil: true, instrumentos: true } },
        musicasEscaladas: true,
      },
    },
  };

  async getAll(page = 0, size = 50, igrejaIds?: number[]) {
    const where = igrejaIds?.length ? { igrejaId: { in: igrejaIds } } : {};
    const [repertorios, total] = await this.prisma.$transaction([
      this.prisma.repertorio.findMany({
        skip: page * size,
        take: size,
        where,
        include: this.include,
        orderBy: { dataCulto: 'desc' },
      }),
      this.prisma.repertorio.count({ where }),
    ]);
    return { conteudo: repertorios.map(this.format), total, pagina: page, tamanhoPagina: size };
  }

  async getById(id: number) {
    const rep = await this.prisma.repertorio.findUnique({ where: { id }, include: this.include });
    if (!rep) throw new NotFoundException('Repertório não encontrado.');
    return this.format(rep);
  }

  async getPendentes(igrejaIds?: number[]) {
    const where: any = { status: StatusRepertorio.aguardando_aprovacao };
    if (igrejaIds?.length) where.igrejaId = { in: igrejaIds };
    const reps = await this.prisma.repertorio.findMany({ where, include: this.include, orderBy: { dataCulto: 'asc' } });
    return reps.map(this.format);
  }

  async create(dto: CreateRepertorioDto, userId: number) {
    const rep = await this.prisma.repertorio.create({
      data: {
        nome: dto.nome,
        dataCulto: new Date(dto.dataCulto),
        horario: dto.horario,
        horarioFim: dto.horarioFim,
        tipoCulto: dto.tipoCulto,
        localCulto: dto.localCulto,
        aviso: dto.aviso,
        status: dto.status ?? StatusRepertorio.aguardando_aprovacao,
        criadorId: userId,
        igrejaId: dto.igrejaId,
        musicas: {
          create: dto.musicas.map((m, ordem) => ({ musicaId: m.musicaId, ordem })),
        },
      },
      select: { id: true },
    });

    await this.criarEscalacoes(rep.id, dto.musicas);

    // Notificar músicos escalados
    const escaladosIds = await this.notificacoes.getEscaladosPorRepertorio(rep.id);
    const repertorioCompleto = await this.getById(rep.id);
    const dataCulto = new Date(dto.dataCulto);
    await Promise.all(
      escaladosIds.map((uid) =>
        this.notificacoes.notificarEscalacao(uid, rep.id, dto.nome, dataCulto),
      ),
    );

    // Notificar pastores/ADMs
    if (dto.igrejaId) {
      const pastoresIds = await this.notificacoes.getPastoresAdmsPorIgreja(dto.igrejaId);
      await this.notificacoes.notificarRepertorioPendenteAprovacao(pastoresIds, rep.id, dto.nome);
    }

    return repertorioCompleto;
  }

  async update(id: number, dto: UpdateRepertorioDto) {
    await this.getById(id);

    // Capturar escalados antes de deletar, para notificá-los sobre a alteração
    const escaladosAntes = await this.notificacoes.getEscaladosPorRepertorio(id);

    // Ao editar, volta para aguardando_aprovacao e limpa aprovação anterior
    await this.prisma.aprovacaoRepertorio.deleteMany({ where: { repertorioId: id } });
    // Remove escalações existentes (MusicaEscalada é em cascade)
    await this.prisma.escalacaoMusico.deleteMany({ where: { repertorioId: id } });
    await this.prisma.repertorioMusica.deleteMany({ where: { repertorioId: id } });
    const rep = await this.prisma.repertorio.update({
      where: { id },
      data: {
        nome: dto.nome,
        dataCulto: new Date(dto.dataCulto),
        horario: dto.horario,
        horarioFim: dto.horarioFim,
        tipoCulto: dto.tipoCulto,
        localCulto: dto.localCulto,
        aviso: dto.aviso,
        igrejaId: dto.igrejaId,
        status: StatusRepertorio.aguardando_aprovacao,
        musicas: {
          create: dto.musicas.map((m, ordem) => ({ musicaId: m.musicaId, ordem })),
        },
      },
      select: { id: true, igrejaId: true },
    });

    await this.criarEscalacoes(rep.id, dto.musicas);

    // Notificar usuários que estavam escalados antes sobre a alteração
    if (escaladosAntes.length > 0) {
      await this.notificacoes.notificarAlteracaoRepertorio(escaladosAntes, id, dto.nome);
    }

    // Notificar novos escalados
    const novosEscalados = await this.notificacoes.getEscaladosPorRepertorio(id);
    const dataCulto = new Date(dto.dataCulto);
    await Promise.all(
      novosEscalados.map((uid) =>
        this.notificacoes.notificarEscalacao(uid, id, dto.nome, dataCulto),
      ),
    );

    // Notificar pastores/ADMs que há nova versão aguardando aprovação
    if (rep.igrejaId) {
      const pastoresIds = await this.notificacoes.getPastoresAdmsPorIgreja(rep.igrejaId);
      await this.notificacoes.notificarRepertorioPendenteAprovacao(pastoresIds, id, dto.nome);
    }

    return this.getById(id);
  }

  async remove(id: number) {
    await this.getById(id);
    await this.prisma.repertorio.delete({ where: { id } });
  }

  async publicar(id: number) {
    await this.getById(id);
    const rep = await this.prisma.repertorio.update({
      where: { id },
      data: { status: StatusRepertorio.aguardando_aprovacao },
      include: this.include,
    });
    return this.format(rep);
  }

  async aprovar(id: number, pastorId: number) {
    const rep = await this.getById(id);
    await this.prisma.$transaction([
      this.prisma.aprovacaoRepertorio.upsert({
        where: { repertorioId: id },
        create: { repertorioId: id, pastorId, status: 'aprovado' },
        update: { pastorId, status: 'aprovado', motivo: null },
      }),
      this.prisma.repertorio.update({
        where: { id },
        data: { status: StatusRepertorio.aprovado },
      }),
    ]);

    // Notificar criador e todos os escalados
    const notificarIds = new Set<number>([rep.criadorId]);
    const escalados = await this.notificacoes.getEscaladosPorRepertorio(id);
    escalados.forEach((uid) => notificarIds.add(uid));
    await this.notificacoes.notificarRepertorioAprovado([...notificarIds], id, rep.nome);

    return this.getById(id);
  }

  async reprovar(id: number, pastorId: number, dto: ReprovacaoDto) {
    const rep = await this.getById(id);
    await this.prisma.$transaction([
      this.prisma.aprovacaoRepertorio.upsert({
        where: { repertorioId: id },
        create: { repertorioId: id, pastorId, status: 'reprovado', motivo: dto.motivo },
        update: { pastorId, status: 'reprovado', motivo: dto.motivo },
      }),
      this.prisma.repertorio.update({
        where: { id },
        data: { status: StatusRepertorio.reprovado },
      }),
    ]);

    // Notificar criador e todos os escalados
    const notificarIds = new Set<number>([rep.criadorId]);
    const escalados = await this.notificacoes.getEscaladosPorRepertorio(id);
    escalados.forEach((uid) => notificarIds.add(uid));
    await this.notificacoes.notificarRepertorioReprovado([...notificarIds], id, rep.nome, dto.motivo);

    return this.getById(id);
  }

  getTiposCulto() {
    return this.prisma.tipoCulto.findMany({
      orderBy: [{ horario: 'asc' }, { nome: 'asc' }],
    });
  }

  private async criarEscalacoes(repertorioId: number, musicas: MusicaRepertorioDto[]) {
    for (const musicaDto of musicas) {
      for (const cantorId of musicaDto.cantores ?? []) {
        await this.upsertMusicaEscalada(repertorioId, cantorId, musicaDto.musicaId, 'Cantor');
      }
      for (const musico of musicaDto.musicos ?? []) {
        await this.upsertMusicaEscalada(repertorioId, musico.usuarioId, musicaDto.musicaId, musico.instrumento);
      }
    }
  }

  private async upsertMusicaEscalada(repertorioId: number, usuarioId: number, musicaId: number, instrumento: string) {
    const escalacao = await this.prisma.escalacaoMusico.upsert({
      where: { repertorioId_usuarioId: { repertorioId, usuarioId } },
      create: { repertorioId, usuarioId },
      update: {},
    });
    await this.prisma.musicaEscalada.upsert({
      where: { escalacaoId_musicaId: { escalacaoId: escalacao.id, musicaId } },
      create: { escalacaoId: escalacao.id, musicaId, instrumento },
      update: { instrumento },
    });
  }

  private format(rep: any) {
    return {
      ...rep,
      musicasIds: rep.musicas?.map((rm: any) => rm.musicaId) ?? [],
      musicas: rep.musicas?.map((rm: any) => {
        const musicaId = rm.musicaId;
        const cantores: any[] = [];
        const musicos: any[] = [];
        for (const escalacao of rep.escalacoes ?? []) {
          const me = escalacao.musicasEscaladas?.find((m: any) => m.musicaId === musicaId);
          if (me) {
            if (me.instrumento === 'Cantor') {
              cantores.push(escalacao.usuario);
            } else {
              musicos.push({ ...escalacao.usuario, instrumento: me.instrumento });
            }
          }
        }
        return {
          ...rm.musica,
          tags: rm.musica?.tags?.map((mt: any) => mt.tag?.nome) ?? [],
          cantores,
          musicos,
        };
      }) ?? [],
    };
  }
}
