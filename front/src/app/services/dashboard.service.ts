import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Stat, Escalacao, ApiResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  getStats(): Observable<ApiResponse<Stat[]>> {
    return this.http.get<ApiResponse<Stat[]>>(`${this.api}/stats`);
  }

  getEscalacoes(): Observable<ApiResponse<Escalacao[]>> {
    return this.http.get<ApiResponse<Escalacao[]>>(`${this.api}/escalacoes`);
  }
}
