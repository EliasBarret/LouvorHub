import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificacoesService } from './notificacoes.service';

@Injectable()
export class NotificacoesScheduler {
  private readonly logger = new Logger(NotificacoesScheduler.name);

  constructor(
    private prisma: PrismaService,
    private notificacoes: NotificacoesService,
  ) {}

  /**
   * A cada 30 minutos verifica se há cultos acontecendo entre 23h e 25h a partir de agora.
   * Envia lembrete "1 dia antes" para todos os escalados.
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async lembreteUmDiaAntes() {
    const agora = new Date();
    const de = new Date(agora.getTime() + 23 * 60 * 60 * 1000);
    const ate = new Date(agora.getTime() + 25 * 60 * 60 * 1000);

    const repertorios = await this.prisma.repertorio.findMany({
      where: { dataCulto: { gte: de, lte: ate } },
      include: {
        escalacoes: { select: { usuarioId: true } },
      },
    });

    for (const rep of repertorios) {
      for (const escalacao of rep.escalacoes) {
        await this.notificacoes.notificarLembreteCulto(
          escalacao.usuarioId,
          rep.id,
          rep.nome,
          rep.dataCulto,
        );
      }
    }

    if (repertorios.length > 0) {
      this.logger.log(`Lembretes 1 dia antes enviados para ${repertorios.length} repertório(s).`);
    }
  }

  /**
   * A cada 10 minutos verifica se há cultos acontecendo entre 55min e 65min a partir de agora.
   * Envia lembrete "1 hora antes" para todos os escalados.
   */
  @Cron('*/10 * * * *')
  async lembreteUmaHoraAntes() {
    const agora = new Date();
    const de = new Date(agora.getTime() + 55 * 60 * 1000);
    const ate = new Date(agora.getTime() + 65 * 60 * 1000);

    const repertorios = await this.prisma.repertorio.findMany({
      where: { dataCulto: { gte: de, lte: ate } },
      include: {
        escalacoes: { select: { usuarioId: true } },
      },
    });

    for (const rep of repertorios) {
      const horario = rep.horario ?? rep.dataCulto.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      for (const escalacao of rep.escalacoes) {
        await this.notificacoes.notificarLembreteCultoHora(
          escalacao.usuarioId,
          rep.id,
          rep.nome,
          horario,
        );
      }
    }

    if (repertorios.length > 0) {
      this.logger.log(`Lembretes 1 hora antes enviados para ${repertorios.length} repertório(s).`);
    }
  }

  /**
   * Uma vez ao dia (às 08h) envia lembrete de confirmações pendentes para músicos
   * com cultos nos próximos 3 dias.
   */
  @Cron('0 8 * * *')
  async lembreteConfirmacoesPendentes() {
    const agora = new Date();
    const limite = new Date(agora.getTime() + 3 * 24 * 60 * 60 * 1000);

    const confirmacoesPendentes = await this.prisma.confirmacaoMusica.findMany({
      where: {
        status: 'pendente',
        musicaEscalada: {
          escalacao: {
            repertorio: {
              dataCulto: { gte: agora, lte: limite },
            },
          },
        },
      },
      include: {
        musicaEscalada: {
          include: {
            escalacao: {
              include: {
                repertorio: { select: { id: true, nome: true } },
              },
            },
          },
        },
      },
    });

    // Agrupar por usuário + repertório para evitar múltiplos lembretes
    const agrupado = new Map<string, { usuarioId: number; repertorioId: number; repertorioNome: string }>();
    for (const c of confirmacoesPendentes) {
      const esc = c.musicaEscalada.escalacao;
      const key = `${esc.usuarioId}-${esc.repertorioId}`;
      if (!agrupado.has(key)) {
        agrupado.set(key, {
          usuarioId: esc.usuarioId,
          repertorioId: esc.repertorioId,
          repertorioNome: esc.repertorio.nome,
        });
      }
    }

    for (const item of agrupado.values()) {
      await this.notificacoes.notificarConfirmacaoPendente(
        item.usuarioId,
        item.repertorioId,
        item.repertorioNome,
      );
    }

    if (agrupado.size > 0) {
      this.logger.log(`Lembretes de confirmação pendente enviados: ${agrupado.size}`);
    }
  }
}
