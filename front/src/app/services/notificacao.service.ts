import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, Subscription, timer } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Notificacao, ApiResponse, PageResponse } from '../models';

export interface NovasNotificacoesEvento {
  /** Notificações a exibir no toast (vazio = usar mensagem genérica com `count`). */
  notificacoes: Notificacao[];
  /** Quantidade total a exibir quando `notificacoes` está vazio. */
  count: number;
  /** true = notificações já existiam ao entrar na app; false = chegaram durante a sessão. */
  isInicial: boolean;
}

const POLLING_INTERVAL_MS = 30_000;

@Injectable({ providedIn: 'root' })
export class NotificacaoService {
  private readonly api = `${environment.apiUrl}/notificacoes`;

  private readonly _naoLidas = new BehaviorSubject<number>(0);
  readonly naoLidas$ = this._naoLidas.asObservable();

  private readonly _novas$ = new Subject<NovasNotificacoesEvento>();
  /** Emite quando notificações novas (ou iniciais) são detectadas. */
  readonly novasNotificacoes$ = this._novas$.asObservable();

  private _prevCount = 0;
  private _initialized = false;
  private _pollingSub?: Subscription;

  constructor(private http: HttpClient) {}

  /** Inicia o polling periódico. Chamar no ngOnInit do layout autenticado. */
  iniciarPolling(): void {
    if (this._pollingSub) return;
    this._initialized = false;
    this._prevCount = 0;
    this._pollingSub = timer(0, POLLING_INTERVAL_MS)
      .pipe(switchMap(() => this.getContadorNaoLidas()))
      .subscribe({ error: () => {} });
  }

  /** Para o polling. Chamar no ngOnDestroy do layout autenticado. */
  pararPolling(): void {
    this._pollingSub?.unsubscribe();
    this._pollingSub = undefined;
    this._initialized = false;
    this._prevCount = 0;
  }

  getNotificacoes(pagina = 0, tamanhoPagina = 20): Observable<ApiResponse<PageResponse<Notificacao>>> {
    return this.http.get<ApiResponse<PageResponse<Notificacao>>>(
      `${this.api}?pagina=${pagina}&tamanhoPagina=${tamanhoPagina}`,
    );
  }

  marcarComoLida(id: number): Observable<ApiResponse<Notificacao>> {
    return this.http.patch<ApiResponse<Notificacao>>(`${this.api}/${id}/lida`, {}).pipe(
      tap(() => this._naoLidas.next(Math.max(0, this._naoLidas.value - 1))),
    );
  }

  marcarTodasComoLidas(): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.api}/marcar-todas-lidas`, {}).pipe(
      tap(() => this._naoLidas.next(0)),
    );
  }

  getContadorNaoLidas(): Observable<ApiResponse<number>> {
    return this.http.get<ApiResponse<number>>(`${this.api}/nao-lidas/count`).pipe(
      tap((res) => this._handleNovoContador(res.data ?? 0)),
    );
  }

  /** Atualiza o contador local sem fazer requisição (ex.: após carregar a lista de notificações). */
  atualizarContadorLocal(count: number): void {
    this._naoLidas.next(count);
    // Sincroniza _prevCount para não disparar toast falso no próximo poll
    this._prevCount = count;
  }

  private _handleNovoContador(count: number): void {
    this._naoLidas.next(count);

    if (!this._initialized) {
      this._initialized = true;
      this._prevCount = count;
      if (count > 0) {
        this._emitirToast(count, true);
      }
      return;
    }

    if (count > this._prevCount) {
      const qtdNovas = count - this._prevCount;
      this._emitirToast(qtdNovas, false);
    }

    this._prevCount = count;
  }

  /**
   * Emite o evento de toast. Para 1 notificação tenta buscar os detalhes para
   * exibir título/mensagem específicos; para múltiplas emite imediatamente com
   * mensagem genérica. Nunca depende de filtrar por `!n.lida` para disparar.
   */
  private _emitirToast(count: number, isInicial: boolean): void {
    if (count > 1) {
      // Múltiplas → toast genérico imediato, sem segunda chamada
      this._novas$.next({ notificacoes: [], count, isInicial });
      return;
    }

    // Tenta enriquecer com detalhes da notificação única
    this.getNotificacoes(0, 5).subscribe({
      next: (res) => {
        const candidatas = (res.data?.conteudo ?? []).filter((n) => !n.lida);
        if (candidatas.length > 0) {
          this._novas$.next({ notificacoes: [candidatas[0]], count: 1, isInicial });
        } else {
          // Fallback: o contador subiu mas não conseguimos identificar qual → genérico
          this._novas$.next({ notificacoes: [], count: 1, isInicial });
        }
      },
      error: () => {
        this._novas$.next({ notificacoes: [], count: 1, isInicial });
      },
    });
  }
}
