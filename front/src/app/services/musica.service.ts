import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Musica, MusicaForm, MusicaHistoricoItem, Tag, ApiResponse, PageResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class MusicaService {
  private readonly api = `${environment.apiUrl}/musicas`;
  private tagsCache: Tag[] = [];

  constructor(private http: HttpClient) {}

  // ─── Músicas ─────────────────────────────────────────────────────────────

  getMusicas(pagina = 0, tamanhoPagina = 50): Observable<ApiResponse<PageResponse<Musica>>> {
    return this.http.get<ApiResponse<PageResponse<Musica>>>(
      `${this.api}?pagina=${pagina}&tamanhoPagina=${tamanhoPagina}`,
    );
  }

  buscarMusicas(q: string): Observable<ApiResponse<Musica[]>> {
    const params = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : '';
    return this.http.get<ApiResponse<Musica[]>>(`${this.api}/buscar${params}`);
  }

  getMusicaById(id: number): Observable<ApiResponse<Musica>> {
    return this.http.get<ApiResponse<Musica>>(`${this.api}/${id}`);
  }

  createMusica(form: MusicaForm): Observable<ApiResponse<Musica>> {
    const tagIds = this.resolveTagIds(form.tags);
    const payload = { ...form, tagIds };
    return this.http.post<ApiResponse<Musica>>(this.api, payload);
  }

  updateMusica(id: number, form: MusicaForm): Observable<ApiResponse<Musica>> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { tags, ...rest } = form;
    const payload = { ...rest };
    return this.http.put<ApiResponse<Musica>>(`${this.api}/${id}`, payload);
  }

  deleteMusica(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.api}/${id}`);
  }

  getMusicaHistorico(id: number): Observable<ApiResponse<MusicaHistoricoItem[]>> {
    return this.http.get<ApiResponse<MusicaHistoricoItem[]>>(`${this.api}/${id}/historico`);
  }

  // ─── Metadados ───────────────────────────────────────────────────────────

  getTags(): Observable<ApiResponse<Tag[]>> {
    return this.http.get<ApiResponse<Tag[]>>(`${this.api}/tags`).pipe(
      tap(res => { this.tagsCache = res.data; }),
    );
  }

  getTons(): Observable<ApiResponse<string[]>> {
    return this.http.get<ApiResponse<string[]>>(`${this.api}/tons`);
  }

  getInstrumentos(): Observable<ApiResponse<string[]>> {
    return this.http.get<ApiResponse<string[]>>(`${this.api}/instrumentos`);
  }

  getMusicasSnapshot(): Musica[] { return []; }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private resolveTagIds(tagNames: string[]): number[] {
    if (!tagNames?.length) return [];
    return tagNames
      .map(nome => this.tagsCache.find(t => t.nome === nome)?.id)
      .filter((id): id is number => id !== undefined);
  }
}


