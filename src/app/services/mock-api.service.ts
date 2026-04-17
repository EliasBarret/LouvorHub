import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';

import mockData from '../data/mock-data.json';
import {
  Usuario,
  Escalacao,
  Stat,
  Tag,
  Musica,
  MusicaForm,
  Repertorio,
  RepertorioForm,
  ApiResponse,
  PageResponse,
} from '../models';

/**
 * MockApiService — simula as chamadas HTTP ao back-end Spring Boot.
 * Todos os dados vêm do arquivo mock-data.json.
 * Cada método retorna Observable<T> com delay de 300ms,
 * reproduzindo o comportamento real de uma API REST.
 */
@Injectable({ providedIn: 'root' })
export class MockApiService {

  private readonly DELAY_MS = 300;

  // ─── Estado em memória (simula o banco de dados) ───────────────────────────
  private musicas: Musica[] = mockData.musicas as Musica[];
  private repertorios: Repertorio[] = mockData.repertorios as unknown as Repertorio[];
  private nextMusicaId = this.musicas.length + 1;
  private nextRepertorioId = this.repertorios.length + 1;

  // ─── Utilitário interno ────────────────────────────────────────────────────
  private respond<T>(data: T): Observable<ApiResponse<T>> {
    const response: ApiResponse<T> = {
      data,
      sucesso: true,
      mensagem: 'OK',
      timestamp: new Date().toISOString(),
    };
    return of(response).pipe(delay(this.DELAY_MS));
  }

  // ─── Usuário ───────────────────────────────────────────────────────────────

  /** GET /api/usuarios/me */
  getUsuarioLogado(): Observable<ApiResponse<Usuario>> {
    return this.respond(mockData.usuario as Usuario);
  }

  // ─── Dashboard ────────────────────────────────────────────────────────────

  /** GET /api/dashboard/stats */
  getStats(): Observable<ApiResponse<Stat[]>> {
    const stats: Stat[] = [
      { icon: 'calendar_today', label: 'PRÓXIMOS CULTOS',        value: mockData.stats.proximosCultos,          color: '#8B5FC0' },
      { icon: 'music_note',    label: 'MÚSICAS ESCALADAS',       value: mockData.stats.musicasEscaladas,        color: '#8B5FC0' },
      { icon: 'schedule',      label: 'AGUARDANDO CONFIRMAÇÃO',  value: mockData.stats.aguardandoConfirmacao,   color: '#C9A84C' },
    ];
    return this.respond(stats);
  }

  /** GET /api/dashboard/escalacoes */
  getEscalacoes(): Observable<ApiResponse<Escalacao[]>> {
    return this.respond(mockData.escalacoes as Escalacao[]);
  }

  // ─── Músicas ──────────────────────────────────────────────────────────────

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
    if (!musica) {
      return of({ data: null as unknown as Musica, sucesso: false, mensagem: 'Música não encontrada', timestamp: new Date().toISOString() })
        .pipe(delay(this.DELAY_MS));
    }
    return this.respond(musica);
  }

  /** POST /api/musicas */
  createMusica(form: MusicaForm): Observable<ApiResponse<Musica>> {
    const novaMusica: Musica = {
      id: this.nextMusicaId++,
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
    this.musicas = [...this.musicas, novaMusica];
    return this.respond(novaMusica);
  }

  /** PUT /api/musicas/:id */
  updateMusica(id: number, form: MusicaForm): Observable<ApiResponse<Musica>> {
    const index = this.musicas.findIndex(m => m.id === id);
    if (index === -1) {
      return of({ data: null as unknown as Musica, sucesso: false, mensagem: 'Música não encontrada', timestamp: new Date().toISOString() })
        .pipe(delay(this.DELAY_MS));
    }
    const updated: Musica = { ...this.musicas[index], ...form, bpm: form.bpm ?? 0 };
    this.musicas = [...this.musicas.slice(0, index), updated, ...this.musicas.slice(index + 1)];
    return this.respond(updated);
  }

  /** DELETE /api/musicas/:id */
  deleteMusica(id: number): Observable<ApiResponse<void>> {
    this.musicas = this.musicas.filter(m => m.id !== id);
    return this.respond(undefined as unknown as void);
  }

  // ─── Repertórios ──────────────────────────────────────────────────────────

  /** GET /api/repertorios */
  getRepertorios(): Observable<ApiResponse<PageResponse<Repertorio>>> {
    const comMusicas = this.repertorios.map(r => this.enrichRepertorio(r));
    const page: PageResponse<Repertorio> = {
      conteudo: comMusicas,
      total: comMusicas.length,
      pagina: 0,
      tamanhoPagina: 50,
    };
    return this.respond(page);
  }

  /** GET /api/repertorios/:id */
  getRepertorioById(id: number): Observable<ApiResponse<Repertorio>> {
    const rep = this.repertorios.find(r => r.id === id);
    if (!rep) {
      return of({ data: null as unknown as Repertorio, sucesso: false, mensagem: 'Repertório não encontrado', timestamp: new Date().toISOString() })
        .pipe(delay(this.DELAY_MS));
    }
    return this.respond(this.enrichRepertorio(rep));
  }

  /** POST /api/repertorios */
  createRepertorio(form: RepertorioForm): Observable<ApiResponse<Repertorio>> {
    const novoRepertorio: Repertorio = {
      id: this.nextRepertorioId++,
      nome: form.nome,
      dataCulto: form.dataCulto,
      tipoCulto: form.tipoCulto,
      status: form.status,
      musicasIds: form.musicasIds,
      criadoEm: new Date().toLocaleDateString('pt-BR'),
    };
    this.repertorios = [...this.repertorios, novoRepertorio];
    return this.respond(this.enrichRepertorio(novoRepertorio));
  }

  /** PUT /api/repertorios/:id */
  updateRepertorio(id: number, form: RepertorioForm): Observable<ApiResponse<Repertorio>> {
    const index = this.repertorios.findIndex(r => r.id === id);
    if (index === -1) {
      return of({ data: null as unknown as Repertorio, sucesso: false, mensagem: 'Repertório não encontrado', timestamp: new Date().toISOString() })
        .pipe(delay(this.DELAY_MS));
    }
    const updated: Repertorio = { ...this.repertorios[index], ...form };
    this.repertorios = [...this.repertorios.slice(0, index), updated, ...this.repertorios.slice(index + 1)];
    return this.respond(this.enrichRepertorio(updated));
  }

  /** DELETE /api/repertorios/:id */
  deleteRepertorio(id: number): Observable<ApiResponse<void>> {
    this.repertorios = this.repertorios.filter(r => r.id !== id);
    return this.respond(undefined as unknown as void);
  }

  // ─── Metadados ────────────────────────────────────────────────────────────

  /** GET /api/tags */
  getTags(): Observable<ApiResponse<Tag[]>> {
    return this.respond(mockData.tags as Tag[]);
  }

  /** GET /api/tons */
  getTons(): Observable<ApiResponse<string[]>> {
    return this.respond(mockData.tons);
  }

  /** GET /api/tipos-culto */
  getTiposCulto(): Observable<ApiResponse<string[]>> {
    return this.respond(mockData.tiposCulto);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private enrichRepertorio(rep: Repertorio): Repertorio {
    return {
      ...rep,
      musicas: rep.musicasIds.map(id => this.musicas.find(m => m.id === id)).filter((m): m is Musica => !!m),
    };
  }
}
