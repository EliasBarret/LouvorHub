import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

import mockData from '../data/mock-data.json';
import {
  Musica,
  MusicaForm,
  Tag,
  ApiResponse,
  PageResponse,
} from '../models';

/**
 * MusicaService — responsável por todas as operações de músicas,
 * tags e tons disponíveis. Simula endpoints REST do back-end.
 *
 * Endpoints cobertos:
 *   GET    /api/musicas
 *   GET    /api/musicas/:id
 *   POST   /api/musicas
 *   PUT    /api/musicas/:id
 *   DELETE /api/musicas/:id
 *   GET    /api/tags
 *   GET    /api/tons
 *   GET    /api/instrumentos
 */
@Injectable({ providedIn: 'root' })
export class MusicaService {

  private readonly DELAY_MS = 300;

  private musicas: Musica[] = mockData.musicas as Musica[];
  private nextId = this.musicas.length + 1;

  // ─── Utilitário ──────────────────────────────────────────────────────────

  private respond<T>(data: T, mensagem = 'OK'): Observable<ApiResponse<T>> {
    return of({
      data,
      sucesso: true,
      mensagem,
      timestamp: new Date().toISOString(),
    }).pipe(delay(this.DELAY_MS));
  }

  private notFound<T>(mensagem: string): Observable<ApiResponse<T>> {
    return of({
      data: null as unknown as T,
      sucesso: false,
      mensagem,
      timestamp: new Date().toISOString(),
    }).pipe(delay(this.DELAY_MS));
  }

  // ─── Músicas ─────────────────────────────────────────────────────────────

  /** GET /api/musicas */
  getMusicas(): Observable<ApiResponse<PageResponse<Musica>>> {
    const page: PageResponse<Musica> = {
      conteudo: [...this.musicas],
      total: this.musicas.length,
      pagina: 0,
      tamanhoPagina: 50,
    };
    return this.respond(page);
  }

  /** GET /api/musicas/:id */
  getMusicaById(id: number): Observable<ApiResponse<Musica>> {
    const musica = this.musicas.find(m => m.id === id);
    if (!musica) return this.notFound('Música não encontrada.');
    return this.respond(musica);
  }

  /** POST /api/musicas */
  createMusica(form: MusicaForm): Observable<ApiResponse<Musica>> {
    const nova: Musica = {
      id: this.nextId++,
      titulo: form.titulo,
      artista: form.artista,
      tom: form.tom,
      bpm: form.bpm ?? 0,
      tags: form.tags,
      linkYoutube: form.linkYoutube,
      linkSpotify: form.linkSpotify,
      observacoes: form.observacoes,
      ultimoUso: null,
      criadoEm: new Date().toLocaleDateString('pt-BR'),
    };
    this.musicas = [...this.musicas, nova];
    return this.respond(nova, 'Música criada com sucesso.');
  }

  /** PUT /api/musicas/:id */
  updateMusica(id: number, form: MusicaForm): Observable<ApiResponse<Musica>> {
    const index = this.musicas.findIndex(m => m.id === id);
    if (index === -1) return this.notFound('Música não encontrada.');
    const updated: Musica = { ...this.musicas[index], ...form, bpm: form.bpm ?? 0 };
    this.musicas = [
      ...this.musicas.slice(0, index),
      updated,
      ...this.musicas.slice(index + 1),
    ];
    return this.respond(updated, 'Música atualizada com sucesso.');
  }

  /** DELETE /api/musicas/:id */
  deleteMusica(id: number): Observable<ApiResponse<void>> {
    this.musicas = this.musicas.filter(m => m.id !== id);
    return this.respond(undefined as unknown as void, 'Música removida com sucesso.');
  }

  // ─── Metadados ───────────────────────────────────────────────────────────

  /** GET /api/tags */
  getTags(): Observable<ApiResponse<Tag[]>> {
    return this.respond(mockData.tags as Tag[]);
  }

  /** GET /api/tons */
  getTons(): Observable<ApiResponse<string[]>> {
    return this.respond(mockData.tons);
  }

  /** GET /api/instrumentos */
  getInstrumentos(): Observable<ApiResponse<string[]>> {
    return this.respond(mockData.instrumentos);
  }

  // ─── Acesso direto (usado internamente por outros services) ──────────────

  getMusicasSnapshot(): Musica[] {
    return [...this.musicas];
  }
}
