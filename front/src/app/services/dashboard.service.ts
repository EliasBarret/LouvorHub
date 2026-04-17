import { Injectable } from '@angular/core';
import { Observable, of, combineLatest } from 'rxjs';
import { delay, map } from 'rxjs/operators';

import mockData from '../data/mock-data.json';
import { Escalacao, Stat, ApiResponse } from '../models';
import { EscalacaoService } from './escalacao.service';

/**
 * DashboardService — responsável pelos dados agregados exibidos na tela inicial:
 * cards de estatísticas e lista de próximas escalações.
 *
 * Endpoints cobertos:
 *   GET /api/dashboard/stats      → cards de estatísticas
 *   GET /api/dashboard/escalacoes → próximas escalações do usuário logado
 */
@Injectable({ providedIn: 'root' })
export class DashboardService {

  private readonly DELAY_MS = 300;

  constructor(private escalacaoService: EscalacaoService) {}

  // ─── Utilitário ──────────────────────────────────────────────────────────

  private respond<T>(data: T, mensagem = 'OK'): Observable<ApiResponse<T>> {
    return of({
      data,
      sucesso: true,
      mensagem,
      timestamp: new Date().toISOString(),
    }).pipe(delay(this.DELAY_MS));
  }

  // ─── Dashboard ───────────────────────────────────────────────────────────

  /**
   * GET /api/dashboard/stats
   * Retorna os cards de estatísticas do usuário logado.
   * O valor de "aguardando confirmação" é calculado dinamicamente
   * a partir das confirmações pendentes em EscalacaoService.
   */
  getStats(): Observable<ApiResponse<Stat[]>> {
    const aguardando = this.escalacaoService.getQuantidadeConfirmacoesPendentes();

    const stats: Stat[] = [
      {
        icon: 'calendar_today',
        label: 'PRÓXIMOS CULTOS',
        value: mockData.stats.proximosCultos,
        color: '#8B5FC0',
      },
      {
        icon: 'music_note',
        label: 'MÚSICAS ESCALADAS',
        value: mockData.stats.musicasEscaladas,
        color: '#8B5FC0',
      },
      {
        icon: 'schedule',
        label: 'AGUARDANDO CONFIRMAÇÃO',
        value: aguardando,
        color: aguardando > 0 ? '#C9A84C' : '#10B981',
      },
    ];

    return this.respond(stats);
  }

  /**
   * GET /api/dashboard/escalacoes
   * Retorna o resumo das próximas escalações do usuário logado.
   */
  getEscalacoesRecentes(): Observable<ApiResponse<Escalacao[]>> {
    return this.escalacaoService.getMinhasEscalacoes();
  }
}
