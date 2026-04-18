import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Escalacao,
  EscalacaoMusico,
  EscalacaoMusicoForm,
  ConfirmacaoMusica,
  ConfirmacaoForm,
  DetalheEscalacao,
  VisaoGeralConfirmacoes,
  ApiResponse,
} from '../models';

@Injectable({ providedIn: 'root' })
export class EscalacaoService {
  private readonly apiEsc = `${environment.apiUrl}/escalacoes`;
  private readonly apiConf = `${environment.apiUrl}/confirmacoes`;

  constructor(private http: HttpClient) {}

  getMinhasEscalacoes(): Observable<ApiResponse<Escalacao[]>> {
    return this.http.get<ApiResponse<Escalacao[]>>(`${this.apiEsc}/minhas`);
  }

  getDetalheEscalacao(repertorioId: number): Observable<ApiResponse<DetalheEscalacao>> {
    return this.http.get<ApiResponse<DetalheEscalacao>>(`${this.apiEsc}/detalhe/${repertorioId}`);
  }

  escalarMusico(form: EscalacaoMusicoForm): Observable<ApiResponse<EscalacaoMusico>> {
    return this.http.post<ApiResponse<EscalacaoMusico>>(this.apiEsc, form);
  }

  removerEscalacao(escalacaoId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiEsc}/${escalacaoId}`);
  }

  confirmarMusica(form: ConfirmacaoForm): Observable<ApiResponse<ConfirmacaoMusica>> {
    return this.http.post<ApiResponse<ConfirmacaoMusica>>(this.apiConf, form);
  }

  getConfirmacoesRepertorio(repertorioId: number): Observable<ApiResponse<VisaoGeralConfirmacoes>> {
    return this.http.get<ApiResponse<VisaoGeralConfirmacoes>>(`${this.apiConf}/repertorio/${repertorioId}`);
  }

  getQuantidadeConfirmacoesPendentes(): number { return 0; }
}
