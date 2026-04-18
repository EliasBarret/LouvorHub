import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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
  PerfilEditavel,
} from '../models';
import { MusicaService } from './musica.service';
import { RepertorioService } from './repertorio.service';
import { UsuarioService } from './usuario.service';
import { DashboardService } from './dashboard.service';

@Injectable({ providedIn: 'root' })
export class MockApiService {
  constructor(
    private musicaService: MusicaService,
    private repertorioService: RepertorioService,
    private usuarioService: UsuarioService,
    private dashboardService: DashboardService,
  ) {}

  // ─── Usuário ──────────────────────────────────────────────────────────────

  getUsuarioLogado(): Observable<ApiResponse<Usuario>> {
    return this.usuarioService.getUsuarioLogado();
  }

  updatePerfilEditavel(form: PerfilEditavel): Observable<ApiResponse<Usuario>> {
    return this.usuarioService.updatePerfilEditavel(0, form as any);
  }

  // ─── Dashboard ────────────────────────────────────────────────────────────

  getStats(): Observable<ApiResponse<Stat[]>> {
    return this.dashboardService.getStats();
  }

  getEscalacoes(): Observable<ApiResponse<Escalacao[]>> {
    return this.dashboardService.getEscalacoes();
  }

  // ─── Músicas ──────────────────────────────────────────────────────────────

  getMusicas(): Observable<ApiResponse<PageResponse<Musica>>> {
    return this.musicaService.getMusicas();
  }

  getMusicaById(id: number): Observable<ApiResponse<Musica>> {
    return this.musicaService.getMusicaById(id);
  }

  createMusica(form: MusicaForm): Observable<ApiResponse<Musica>> {
    return this.musicaService.createMusica(form);
  }

  updateMusica(id: number, form: MusicaForm): Observable<ApiResponse<Musica>> {
    return this.musicaService.updateMusica(id, form);
  }

  deleteMusica(id: number): Observable<ApiResponse<void>> {
    return this.musicaService.deleteMusica(id);
  }

  // ─── Repertórios ──────────────────────────────────────────────────────────

  getRepertorios(): Observable<ApiResponse<PageResponse<Repertorio>>> {
    return this.repertorioService.getRepertorios();
  }

  getRepertorioById(id: number): Observable<ApiResponse<Repertorio>> {
    return this.repertorioService.getRepertorioById(id);
  }

  createRepertorio(form: RepertorioForm): Observable<ApiResponse<Repertorio>> {
    return this.repertorioService.createRepertorio(form);
  }

  updateRepertorio(id: number, form: RepertorioForm): Observable<ApiResponse<Repertorio>> {
    return this.repertorioService.updateRepertorio(id, form);
  }

  deleteRepertorio(id: number): Observable<ApiResponse<void>> {
    return this.repertorioService.deleteRepertorio(id);
  }

  // ─── Metadados ────────────────────────────────────────────────────────────

  getTags(): Observable<ApiResponse<Tag[]>> {
    return this.musicaService.getTags();
  }

  getTons(): Observable<ApiResponse<string[]>> {
    return this.musicaService.getTons();
  }

  getTiposCulto(): Observable<ApiResponse<string[]>> {
    return this.repertorioService.getTiposCulto();
  }

  /** @deprecated Use EscalacaoService.getMinhasEscalacoes() instead */
  getParticipacoesPorRepertorio(): Map<number, number> {
    return new Map();
  }
}
