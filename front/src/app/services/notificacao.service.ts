import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Notificacao, ApiResponse, PageResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class NotificacaoService {
  private readonly api = `${environment.apiUrl}/notificacoes`;

  constructor(private http: HttpClient) {}

  getNotificacoes(pagina = 0, tamanhoPagina = 20): Observable<ApiResponse<PageResponse<Notificacao>>> {
    return this.http.get<ApiResponse<PageResponse<Notificacao>>>(
      `${this.api}?pagina=${pagina}&tamanhoPagina=${tamanhoPagina}`,
    );
  }

  marcarComoLida(id: number): Observable<ApiResponse<Notificacao>> {
    return this.http.patch<ApiResponse<Notificacao>>(`${this.api}/${id}/lida`, {});
  }

  marcarTodasComoLidas(): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.api}/marcar-todas-lidas`, {});
  }

  getContadorNaoLidas(): Observable<ApiResponse<number>> {
    return this.http.get<ApiResponse<number>>(`${this.api}/nao-lidas/count`);
  }
}
