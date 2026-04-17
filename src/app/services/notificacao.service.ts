import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

import mockData from '../data/mock-data.json';
import { Notificacao, ApiResponse, PageResponse } from '../models';

/**
 * NotificacaoService — responsável por todas as operações de notificações
 * do usuário logado. Simula endpoints REST do back-end.
 *
 * Endpoints cobertos:
 *   GET   /api/notificacoes                  → lista de notificações do usuário
 *   PATCH /api/notificacoes/:id/lida         → marcar uma notificação como lida
 *   PATCH /api/notificacoes/marcar-todas-lidas → marcar todas como lidas
 *   GET   /api/notificacoes/nao-lidas/count  → quantidade de notificações não lidas
 */
@Injectable({ providedIn: 'root' })
export class NotificacaoService {

  private readonly DELAY_MS = 300;

  private notificacoes: Notificacao[] = mockData.notificacoes as unknown as Notificacao[];
  private readonly usuarioLogadoId: number = mockData.usuario.id;

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

  // ─── Notificações ────────────────────────────────────────────────────────

  /**
   * GET /api/notificacoes
   * Retorna todas as notificações do usuário logado,
   * ordenadas da mais recente para a mais antiga.
   */
  getNotificacoes(): Observable<ApiResponse<PageResponse<Notificacao>>> {
    const minhas = this.notificacoes
      .filter(n => n.usuarioId === this.usuarioLogadoId)
      .slice()
      .reverse();

    const page: PageResponse<Notificacao> = {
      conteudo: minhas,
      total: minhas.length,
      pagina: 0,
      tamanhoPagina: 50,
    };
    return this.respond(page);
  }

  /**
   * PATCH /api/notificacoes/:id/lida
   * Marca uma notificação específica como lida.
   */
  marcarComoLida(id: number): Observable<ApiResponse<Notificacao>> {
    const index = this.notificacoes.findIndex(
      n => n.id === id && n.usuarioId === this.usuarioLogadoId,
    );
    if (index === -1) return this.notFound('Notificação não encontrada.');

    const updated: Notificacao = { ...this.notificacoes[index], lida: true };
    this.notificacoes = [
      ...this.notificacoes.slice(0, index),
      updated,
      ...this.notificacoes.slice(index + 1),
    ];
    return this.respond(updated, 'Notificação marcada como lida.');
  }

  /**
   * PATCH /api/notificacoes/marcar-todas-lidas
   * Marca todas as notificações do usuário como lidas.
   */
  marcarTodasComoLidas(): Observable<ApiResponse<void>> {
    this.notificacoes = this.notificacoes.map(n =>
      n.usuarioId === this.usuarioLogadoId ? { ...n, lida: true } : n,
    );
    return this.respond(undefined as unknown as void, 'Todas as notificações foram marcadas como lidas.');
  }

  /**
   * GET /api/notificacoes/nao-lidas/count
   * Retorna a quantidade de notificações não lidas.
   */
  getQuantidadeNaoLidas(): Observable<ApiResponse<number>> {
    const count = this.notificacoes.filter(
      n => n.usuarioId === this.usuarioLogadoId && !n.lida,
    ).length;
    return this.respond(count);
  }
}
