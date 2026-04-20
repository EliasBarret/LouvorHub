import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Usuario, UpdatePerfilForm, ApiResponse, PageResponse, PerfilStats } from '../models';

function enrich(u: any): Usuario {
  if (!u) return u;
  const partes = (u.nome || '').trim().split(/\s+/);
  return {
    ...u,
    primeiroNome: partes[0] || '',
    iniciais: partes.length >= 2
      ? (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
      : (partes[0]?.[0] || '').toUpperCase(),
  };
}

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly api = `${environment.apiUrl}/usuarios`;

  constructor(private http: HttpClient) {}

  getUsuarioLogado(): Observable<ApiResponse<Usuario>> {
    return this.http.get<ApiResponse<any>>(`${this.api}/me`)
      .pipe(map(res => ({ ...res, data: enrich(res.data) })));
  }

  getUsuarios(pagina = 0, tamanhoPagina = 50): Observable<ApiResponse<PageResponse<Usuario>>> {
    return this.http
      .get<ApiResponse<PageResponse<any>>>(`${this.api}?pagina=${pagina}&tamanhoPagina=${tamanhoPagina}`)
      .pipe(map(res => ({ ...res, data: { ...res.data, conteudo: res.data.conteudo.map(enrich) } })));
  }

  getUsuarioById(id: number): Observable<ApiResponse<Usuario>> {
    return this.http.get<ApiResponse<any>>(`${this.api}/${id}`)
      .pipe(map(res => ({ ...res, data: enrich(res.data) })));
  }

  updatePerfil(form: UpdatePerfilForm): Observable<ApiResponse<Usuario>> {
    return this.http.put<ApiResponse<any>>(`${this.api}/me`, form)
      .pipe(map(res => ({ ...res, data: enrich(res.data) })));
  }

  updatePerfilEditavel(id: number, changes: Partial<Usuario>): Observable<ApiResponse<Usuario>> {
    return this.updatePerfil(changes as UpdatePerfilForm);
  }

  getPerfilStats(): Observable<PerfilStats> {
    return this.http.get<PerfilStats>(`${this.api}/me/stats`);
  }
}
