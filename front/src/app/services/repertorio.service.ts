import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  Musica,
  Repertorio,
  RepertorioForm,
  AprovacaoRepertorio,
  ApiResponse,
  PageResponse,
} from '../models';

function isoToBr(iso: string | null | undefined): string {
  if (!iso) return '';
  const part = iso.substring(0, 10);
  const [y, m, d] = part.split('-');
  return `${d}/${m}/${y}`;
}

function formatRepertorio(r: any): Repertorio {
  return {
    ...r,
    dataCulto: isoToBr(r.dataCulto),
    criadoEm: isoToBr(r.criadoEm),
    musicasIds: r.musicasIds ?? r.musicas?.map((m: any) => m.id) ?? [],
    musicas: r.musicas ?? [],
  };
}

@Injectable({ providedIn: 'root' })
export class RepertorioService {
  private readonly api = `${environment.apiUrl}/repertorios`;

  constructor(private http: HttpClient) {}

  getRepertorios(pagina = 0, tamanhoPagina = 50): Observable<ApiResponse<PageResponse<Repertorio>>> {
    return this.http
      .get<ApiResponse<PageResponse<any>>>(`${this.api}?pagina=${pagina}&tamanhoPagina=${tamanhoPagina}`)
      .pipe(map(res => ({ ...res, data: { ...res.data, conteudo: res.data.conteudo.map(formatRepertorio) } })));
  }

  getRepertorioById(id: number): Observable<ApiResponse<Repertorio>> {
    return this.http.get<ApiResponse<any>>(`${this.api}/${id}`)
      .pipe(map(res => ({ ...res, data: formatRepertorio(res.data) })));
  }

  createRepertorio(form: RepertorioForm): Observable<ApiResponse<Repertorio>> {
    return this.http.post<ApiResponse<any>>(this.api, form)
      .pipe(map(res => ({ ...res, data: formatRepertorio(res.data) })));
  }

  updateRepertorio(id: number, form: RepertorioForm): Observable<ApiResponse<Repertorio>> {
    return this.http.put<ApiResponse<any>>(`${this.api}/${id}`, form)
      .pipe(map(res => ({ ...res, data: formatRepertorio(res.data) })));
  }

  deleteRepertorio(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.api}/${id}`);
  }

  publicarRepertorio(id: number): Observable<ApiResponse<Repertorio>> {
    return this.http.patch<ApiResponse<any>>(`${this.api}/${id}/publicar`, {})
      .pipe(map(res => ({ ...res, data: formatRepertorio(res.data) })));
  }

  enviarParaAprovacao(id: number): Observable<ApiResponse<Repertorio>> {
    return this.publicarRepertorio(id);
  }

  getRepertoriosPendentesAprovacao(_igrejaIds?: number[]): Observable<ApiResponse<Repertorio[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.api}/pendentes`)
      .pipe(map(res => ({ ...res, data: res.data.map(formatRepertorio) })));
  }

  getRepertoriosByIgrejas(igrejaIds: number[]): Observable<ApiResponse<PageResponse<Repertorio>>> {
    return this.getRepertorios().pipe(
      map(res => ({
        ...res,
        data: {
          ...res.data,
          conteudo: res.data.conteudo.filter(r => !r.igrejaId || igrejaIds.includes(r.igrejaId)),
        },
      })),
    );
  }

  aprovarRepertorio(repertorioId: number, _pastorId: number): Observable<ApiResponse<Repertorio>> {
    return this.http.patch<ApiResponse<any>>(`${this.api}/${repertorioId}/aprovar`, {})
      .pipe(map(res => ({ ...res, data: formatRepertorio(res.data) })));
  }

  reprovarRepertorio(repertorioId: number, _pastorId: number, motivo: string): Observable<ApiResponse<Repertorio>> {
    return this.http.patch<ApiResponse<any>>(`${this.api}/${repertorioId}/reprovar`, { motivo })
      .pipe(map(res => ({ ...res, data: formatRepertorio(res.data) })));
  }

  getTiposCulto(): Observable<ApiResponse<string[]>> {
    return this.http.get<ApiResponse<string[]>>(`${this.api}/tipos-culto`);
  }

  getRepertoriosSnapshot(): Repertorio[] { return []; }
}
