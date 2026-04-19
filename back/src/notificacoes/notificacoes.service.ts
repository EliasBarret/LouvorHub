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

  /** Cria notificação apenas se ainda não existe uma do mesmo tipo+repertório para o usuário (evita duplicatas). */
  private async criarDeduplicado(
    usuarioId: number,
    titulo: string,
    mensagem: string,
    tipo: TipoNotificacao,
    referenciaId: number,
    referenciaTipo = 'repertorio',
  ) {
    const existe = await this.prisma.notificacao.findFirst({
      where: { usuarioId, tipo, referenciaId, referenciaTipo },
    });
    if (existe) return null;
    return this.criar(usuarioId, titulo, mensagem, tipo, referenciaId, referenciaTipo);
  }

  // ─── Helpers de domínio ──────────────────────────────────────────────────────

  /** Músico/cantor escalado para um repertório. */
  async notificarEscalacao(usuarioId: number, repertorioId: number, repertorioNome: string, dataCulto: Date) {
    const data = dataCulto.toLocaleDateString('pt-BR');
    return this.criarDeduplicado(
      usuarioId,
      'Você foi escalado!',
      `Você foi escalado para o repertório "${repertorioNome}" em ${data}. Confirme se conhece as músicas.`,
      TipoNotificacao.escalacao,
      repertorioId,
    );
  }

  /** Notifica múltiplos usuários que o repertório foi alterado. */
  async notificarAlteracaoRepertorio(usuarioIds: number[], repertorioId: number, repertorioNome: string) {
    await Promise.all(
      usuarioIds.map((uid) =>
        this.criar(
          uid,
          'Repertório atualizado',
          `O repertório "${repertorioNome}" foi alterado. Verifique se as músicas e escalações ainda estão corretas.`,
          TipoNotificacao.repertorio_alterado,
          repertorioId,
          'repertorio',
        ),
      ),
    );
  }

  /** Notifica pastores/ADMs que há um repertório aguardando aprovação. */
  async notificarRepertorioPendenteAprovacao(usuarioIds: number[], repertorioId: number, repertorioNome: string) {
    await Promise.all(
      usuarioIds.map((uid) =>
        this.criarDeduplicado(
          uid,
          'Repertório aguardando aprovação',
          `O repertório "${repertorioNome}" está aguardando sua aprovação.`,
          TipoNotificacao.repertorio_pendente_aprovacao,
          repertorioId,
        ),
      ),
    );
  }

  /** Notifica músicos/ministro que o pastor aprovou o repertório. */
  async notificarRepertorioAprovado(usuarioIds: number[], repertorioId: number, repertorioNome: string) {
    await Promise.all(
      usuarioIds.map((uid) =>
        this.criar(
          uid,
          'Repertório aprovado ✓',
          `O repertório "${repertorioNome}" foi aprovado pelo pastor.`,
          TipoNotificacao.repertorio_aprovado,
          repertorioId,
          'repertorio',
        ),
      ),
    );
  }

  /** Notifica músicos/ministro que o pastor reprovou o repertório. */
  async notificarRepertorioReprovado(usuarioIds: number[], repertorioId: number, repertorioNome: string, motivo?: string | null) {
    const detalhe = motivo ? ` Motivo: ${motivo}` : '';
    await Promise.all(
      usuarioIds.map((uid) =>
        this.criar(
          uid,
          'Repertório reprovado',
          `O repertório "${repertorioNome}" foi reprovado pelo pastor.${detalhe}`,
          TipoNotificacao.repertorio_reprovado,
          repertorioId,
          'repertorio',
        ),
      ),
    );
  }

  /** Lembrete ao músico de confirmações pendentes em um repertório. */
  async notificarConfirmacaoPendente(usuarioId: number, repertorioId: number, repertorioNome: string) {
    return this.criarDeduplicado(
      usuarioId,
      'Confirmação pendente',
      `Você tem confirmações pendentes no repertório "${repertorioNome}". Informe se conhece as músicas.`,
      TipoNotificacao.confirmacao_pendente,
      repertorioId,
    );
  }

  /** Notifica o ministro que um músico informou se conhece ou não uma música. */
  async notificarMusicoConfirmou(
    ministroId: number,
    nomeMusico: string,
    nomeMusica: string,
    status: string,
    repertorioId: number,
    repertorioNome: string,
  ) {
    const acao = status === 'conhece' ? 'conhece' : 'NÃO conhece';
    return this.criar(
      ministroId,
      'Confirmação recebida',
      `${nomeMusico} informou que ${acao} a música "${nomeMusica}" (${repertorioNome}).`,
      TipoNotificacao.musico_confirmou,
      repertorioId,
      'repertorio',
    );
  }

  /** Lembrete de culto 1 dia antes — para todos os escalados. */
  async notificarLembreteCulto(usuarioId: number, repertorioId: number, repertorioNome: string, dataCulto: Date) {
    const data = dataCulto.toLocaleDateString('pt-BR');
    return this.criarDeduplicado(
      usuarioId,
      'Culto amanhã!',
      `O culto "${repertorioNome}" acontece amanhã (${data}). Não se esqueça de se preparar.`,
      TipoNotificacao.lembrete_culto,
      repertorioId,
    );
  }

  /** Lembrete de culto 1 hora antes — para todos os escalados. */
  async notificarLembreteCultoHora(usuarioId: number, repertorioId: number, repertorioNome: string, horario: string) {
    return this.criarDeduplicado(
      usuarioId,
      'Culto em 1 hora!',
      `O culto "${repertorioNome}" começa em aproximadamente 1 hora (${horario}). Esteja pronto!`,
      TipoNotificacao.lembrete_culto_hora,
      repertorioId,
    );
  }

  // ─── Busca auxiliar ──────────────────────────────────────────────────────────

  /** Retorna IDs dos pastores e ADMs de uma igreja. */
  async getPastoresAdmsPorIgreja(igrejaId: number): Promise<number[]> {
    const membros = await this.prisma.membroIgreja.findMany({
      where: {
        igrejaId,
        perfil: { in: ['Pastor', 'ADM'] },
      },
      select: { usuarioId: true },
    });
    return membros.map((m) => m.usuarioId);
  }

  /** Retorna IDs de todos os usuários escalados em um repertório. */
  async getEscaladosPorRepertorio(repertorioId: number): Promise<number[]> {
    const escalacoes = await this.prisma.escalacaoMusico.findMany({
      where: { repertorioId },
      select: { usuarioId: true },
    });
    return escalacoes.map((e) => e.usuarioId);
  }
}
