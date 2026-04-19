import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TipoCulto, ApiResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class TiposCultoService {
  private readonly api = `${environment.apiUrl}/tipos-culto`;

  constructor(private http: HttpClient) {}

  getAll(igrejaId?: number): Observable<ApiResponse<TipoCulto[]>> {
    const params = igrejaId ? `?igrejaId=${igrejaId}` : '';
    return this.http.get<ApiResponse<TipoCulto[]>>(`${this.api}${params}`);
  }

  create(dados: { nome: string; horario: string; igrejaId?: number }): Observable<ApiResponse<TipoCulto>> {
    return this.http.post<ApiResponse<TipoCulto>>(this.api, dados);
  }

  update(id: number, dados: { nome: string; horario: string; igrejaId?: number }): Observable<ApiResponse<TipoCulto>> {
    return this.http.put<ApiResponse<TipoCulto>>(`${this.api}/${id}`, dados);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.api}/${id}`);
  }
}
