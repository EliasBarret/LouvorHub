import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Notificacao, ApiResponse, PageResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class NotificacaoService {
  private readonly api = `${environment.apiUrl}/notificacoes`;

  private readonly _naoLidas = new BehaviorSubject<number>(0);
  readonly naoLidas$ = this._naoLidas.asObservable();

  constructor(private http: HttpClient) {}

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
      tap((res) => this._naoLidas.next(res.data ?? 0)),
    );
  }

  /** Atualiza o contador local sem fazer requisição (ex.: após carregar a lista de notificações). */
  atualizarContadorLocal(count: number): void {
    this._naoLidas.next(count);
  }
}
