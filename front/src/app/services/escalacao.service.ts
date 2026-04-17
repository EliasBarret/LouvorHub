import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

import mockData from '../data/mock-data.json';
import {
  Usuario,
  Musica,
  Repertorio,
  Escalacao,
  EscalacaoMusico,
  EscalacaoMusicoForm,
  ConfirmacaoMusica,
  ConfirmacaoForm,
  MusicaComConfirmacao,
  DetalheEscalacao,
  ConfirmacaoPorMusico,
  VisaoGeralConfirmacoes,
  StatusConfirmacao,
  ApiResponse,
} from '../models';

/**
 * EscalacaoService — responsável por toda a lógica de escalação de músicos
 * e pelo fluxo de confirmação de músicas.
 *
 * Endpoints cobertos:
 *   GET    /api/escalacoes/minhas                  → resumo das escalações do usuário logado
 *   GET    /api/escalacoes/detalhe/:repertorioId   → visão detalhada do músico com confirmações
 *   POST   /api/escalacoes                         → escalar um músico em um repertório
 *   DELETE /api/escalacoes/:id                     → remover um músico do repertório
 *   POST   /api/confirmacoes                       → confirmar/negar conhecimento de uma música
 *   GET    /api/confirmacoes/repertorio/:id        → visão geral das confirmações (para o líder)
 */
@Injectable({ providedIn: 'root' })
export class EscalacaoService {

  private readonly DELAY_MS = 300;

  private readonly usuarioLogadoId: number = mockData.usuario.id;

  private escalacoesMusicos: EscalacaoMusico[] =
    mockData.escalacoes_musicos as unknown as EscalacaoMusico[];

  private confirmacoes: ConfirmacaoMusica[] =
    mockData.confirmacoes as unknown as ConfirmacaoMusica[];

  private musicas: Musica[] = mockData.musicas as Musica[];
  private repertorios: Repertorio[] = mockData.repertorios as unknown as Repertorio[];
  private usuarios: Usuario[] = mockData.usuarios as Usuario[];

  private nextEscalacaoId = this.escalacoesMusicos.length + 1;
  private nextConfirmacaoId = this.confirmacoes.length + 1;

  // ─── Utilitário ──────────────────────────────────────────────────────────

  private respond<T>(data: T, mensagem = 'OK'): Observable<ApiResponse<T>> {
    return of({
      data,
      sucesso: true,
      mensagem,
      timestamp: new Date().toISOString(),
    }).pipe(delay(this.DELAY_MS));
  }

  private notFound<T>(mensagem: string): Observable<ApiResponse<T>> {
    return of({
      data: null as unknown as T,
      sucesso: false,
      mensagem,
      timestamp: new Date().toISOString(),
    }).pipe(delay(this.DELAY_MS));
  }

  private enrichRepertorio(rep: Repertorio): Repertorio {
    return {
      ...rep,
      musicas: rep.musicasIds
        .map(id => this.musicas.find(m => m.id === id))
        .filter((m): m is Musica => !!m),
    };
  }

  private buildMusicasComConfirmacao(
    escalacao: EscalacaoMusico,
  ): MusicaComConfirmacao[] {
    return escalacao.musicasEscaladas.map(item => {
      const musica = this.musicas.find(m => m.id === item.musicaId)!;
      const confirmacao = this.confirmacoes.find(
        c => c.escalacaoMusicoId === escalacao.id && c.musicaId === item.musicaId,
      );
      return {
        musica,
        instrumento: item.instrumento,
        confirmacao: (confirmacao?.status ?? 'pendente') as StatusConfirmacao,
      };
    });
  }

  // ─── Escalações (resumo para dashboard) ──────────────────────────────────

  /** GET /api/escalacoes/minhas — resumo das escalações do usuário logado */
  getMinhasEscalacoes(): Observable<ApiResponse<Escalacao[]>> {
    return this.respond(mockData.escalacoes as Escalacao[]);
  }

  // ─── Escalações (detalhe para confirmação) ────────────────────────────────

  /**
   * GET /api/escalacoes/detalhe/:repertorioId
   * Retorna a visão detalhada que o músico vê ao abrir um culto:
   * dados do repertório, suas músicas escaladas e o status de cada confirmação.
   */
  getDetalheEscalacao(repertorioId: number): Observable<ApiResponse<DetalheEscalacao>> {
    const escalacao = this.escalacoesMusicos.find(
      e => e.repertorioId === repertorioId && e.usuarioId === this.usuarioLogadoId,
    );
    if (!escalacao) return this.notFound('Você não está escalado(a) neste repertório.');

    const repertorio = this.repertorios.find(r => r.id === repertorioId);
    if (!repertorio) return this.notFound('Repertório não encontrado.');

    const detalhe: DetalheEscalacao = {
      repertorio: this.enrichRepertorio(repertorio),
      escalacaoMusico: { ...escalacao },
      musicasComConfirmacao: this.buildMusicasComConfirmacao(escalacao),
    };
    return this.respond(detalhe);
  }

  // ─── Gerenciamento de escalações (para o líder) ───────────────────────────

  /**
   * POST /api/escalacoes
   * Escala um músico em um repertório com os instrumentos por música.
   */
  escalarMusico(form: EscalacaoMusicoForm): Observable<ApiResponse<EscalacaoMusico>> {
    const jaEscalado = this.escalacoesMusicos.find(
      e => e.repertorioId === form.repertorioId && e.usuarioId === form.usuarioId,
    );
    if (jaEscalado) {
      return of({
        data: null as unknown as EscalacaoMusico,
        sucesso: false,
        mensagem: 'Este músico já está escalado neste repertório.',
        timestamp: new Date().toISOString(),
      }).pipe(delay(this.DELAY_MS));
    }

    const nova: EscalacaoMusico = {
      id: this.nextEscalacaoId++,
      repertorioId: form.repertorioId,
      usuarioId: form.usuarioId,
      musicasEscaladas: form.musicasEscaladas,
    };

    // Cria registros de confirmação pendentes para cada música escalada
    const novasConfirmacoes: ConfirmacaoMusica[] = form.musicasEscaladas.map(item => ({
      id: this.nextConfirmacaoId++,
      escalacaoMusicoId: nova.id,
      musicaId: item.musicaId,
      status: 'pendente' as StatusConfirmacao,
    }));

    this.escalacoesMusicos = [...this.escalacoesMusicos, nova];
    this.confirmacoes = [...this.confirmacoes, ...novasConfirmacoes];

    return this.respond(nova, 'Músico escalado com sucesso.');
  }

  /**
   * DELETE /api/escalacoes/:id
   * Remove um músico do repertório e apaga suas confirmações.
   */
  removerEscalacao(escalacaoId: number): Observable<ApiResponse<void>> {
    this.confirmacoes = this.confirmacoes.filter(
      c => c.escalacaoMusicoId !== escalacaoId,
    );
    this.escalacoesMusicos = this.escalacoesMusicos.filter(e => e.id !== escalacaoId);
    return this.respond(undefined as unknown as void, 'Músico removido do repertório.');
  }

  // ─── Confirmações ────────────────────────────────────────────────────────

  /**
   * POST /api/confirmacoes
   * O músico confirma (ou nega) que conhece uma música.
   * Cria o registro caso ainda não exista (upsert).
   */
  confirmarMusica(form: ConfirmacaoForm): Observable<ApiResponse<ConfirmacaoMusica>> {
    const index = this.confirmacoes.findIndex(
      c =>
        c.escalacaoMusicoId === form.escalacaoMusicoId &&
        c.musicaId === form.musicaId,
    );

    if (index === -1) {
      const nova: ConfirmacaoMusica = {
        id: this.nextConfirmacaoId++,
        escalacaoMusicoId: form.escalacaoMusicoId,
        musicaId: form.musicaId,
        status: form.status,
      };
      this.confirmacoes = [...this.confirmacoes, nova];
      return this.respond(nova, 'Confirmação registrada.');
    }

    const updated: ConfirmacaoMusica = { ...this.confirmacoes[index], status: form.status };
    this.confirmacoes = [
      ...this.confirmacoes.slice(0, index),
      updated,
      ...this.confirmacoes.slice(index + 1),
    ];
    return this.respond(updated, 'Confirmação atualizada.');
  }

  /**
   * GET /api/confirmacoes/repertorio/:id
   * Retorna a visão geral das confirmações de todos os músicos escalados
   * em um repertório — usado pelo líder para acompanhar o status.
   */
  getConfirmacoesRepertorio(
    repertorioId: number,
  ): Observable<ApiResponse<VisaoGeralConfirmacoes>> {
    const escalacoesDoCulto = this.escalacoesMusicos.filter(
      e => e.repertorioId === repertorioId,
    );

    let totalConhecem = 0;
    let totalNaoConhecem = 0;
    let totalPendentes = 0;

    const porMusico: ConfirmacaoPorMusico[] = escalacoesDoCulto.map(escalacao => {
      const usuario =
        this.usuarios.find(u => u.id === escalacao.usuarioId) ??
        (mockData.usuario as Usuario);

      const musicasComConfirmacao = this.buildMusicasComConfirmacao(escalacao);

      musicasComConfirmacao.forEach(mc => {
        if (mc.confirmacao === 'conhece') totalConhecem++;
        else if (mc.confirmacao === 'nao_conhece') totalNaoConhecem++;
        else totalPendentes++;
      });

      return { usuario, musicasComConfirmacao };
    });

    const visaoGeral: VisaoGeralConfirmacoes = {
      repertorioId,
      totalMusicos: escalacoesDoCulto.length,
      totalConhecem,
      totalNaoConhecem,
      totalPendentes,
      porMusico,
    };

    return this.respond(visaoGeral);
  }

  // ─── Helpers públicos ────────────────────────────────────────────────────

  /** Retorna quantas confirmações pendentes o usuário logado ainda possui. */
  getQuantidadeConfirmacoesPendentes(): number {
    const minhasEscalacoes = this.escalacoesMusicos.filter(
      e => e.usuarioId === this.usuarioLogadoId,
    );
    return this.confirmacoes.filter(
      c =>
        c.status === 'pendente' &&
        minhasEscalacoes.some(e => e.id === c.escalacaoMusicoId),
    ).length;
  }
}
