import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Igreja, MembroIgreja, ApiResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class IgrejaService {
  private readonly api = `${environment.apiUrl}/igrejas`;

  constructor(private http: HttpClient) {}

  getIgrejas(): Observable<ApiResponse<Igreja[]>> {
    return this.http.get<ApiResponse<Igreja[]>>(this.api);
  }

  getIgrejaById(id: number): Observable<ApiResponse<Igreja>> {
    return this.http.get<ApiResponse<Igreja>>(`${this.api}/${id}`);
  }

  createIgreja(dados: Partial<Igreja>): Observable<ApiResponse<Igreja>> {
    return this.http.post<ApiResponse<Igreja>>(this.api, dados);
  }

  updateIgreja(id: number, dados: Partial<Igreja>): Observable<ApiResponse<Igreja>> {
    return this.http.put<ApiResponse<Igreja>>(`${this.api}/${id}`, dados);
  }

  deleteIgreja(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.api}/${id}`);
  }

  getMembros(igrejaId: number): Observable<ApiResponse<MembroIgreja[]>> {
    return this.http.get<ApiResponse<MembroIgreja[]>>(`${this.api}/${igrejaId}/membros`);
  }

  addMembro(igrejaId: number, usuarioId: number, perfil: string): Observable<ApiResponse<MembroIgreja>> {
    return this.http.post<ApiResponse<MembroIgreja>>(`${this.api}/${igrejaId}/membros`, { usuarioId, perfil });
  }

  removeMembro(membroId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.api}/membros/${membroId}`);
  }

  getIgrejasByUsuarioId(usuarioId: number): Observable<ApiResponse<Igreja[]>> {
    return this.http
      .get<ApiResponse<any[]>>(`${this.api}/usuario/${usuarioId}`)
      .pipe(map(res => ({ ...res, data: res.data.map((m: any) => m.igreja ?? m) })));
  }
}
