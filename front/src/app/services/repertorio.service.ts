import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

import mockData from '../data/mock-data.json';
import {
  Musica,
  Repertorio,
  RepertorioForm,
  AprovacaoRepertorio,
  ApiResponse,
  PageResponse,
} from '../models';

/**
 * RepertorioService — responsável por todas as operações de repertórios
 * e tipos de culto. Simula endpoints REST do back-end.
 *
 * Endpoints cobertos:
 *   GET    /api/repertorios
 *   GET    /api/repertorios/:id
 *   POST   /api/repertorios
 *   PUT    /api/repertorios/:id
 *   DELETE /api/repertorios/:id
 *   PATCH  /api/repertorios/:id/publicar
 *   GET    /api/tipos-culto
 */
@Injectable({ providedIn: 'root' })
export class RepertorioService {

  private readonly DELAY_MS = 300;

  private repertorios: Repertorio[] = mockData.repertorios as unknown as Repertorio[];
  private musicas: Musica[] = mockData.musicas as Musica[];
  private aprovacoes: AprovacaoRepertorio[] = [];
  private nextId = this.repertorios.length + 1;
  private nextAprovacaoId = 1;

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

  private enrichRepertorio(rep: Repertorio): Repertorio {
    return {
      ...rep,
      musicas: rep.musicasIds
        .map(id => this.musicas.find(m => m.id === id))
        .filter((m): m is Musica => !!m),
    };
  }

  // ─── Repertórios ─────────────────────────────────────────────────────────

  /** GET /api/repertorios */
  getRepertorios(): Observable<ApiResponse<PageResponse<Repertorio>>> {
    const enriquecidos = this.repertorios.map(r => this.enrichRepertorio(r));
    const page: PageResponse<Repertorio> = {
      conteudo: enriquecidos,
      total: enriquecidos.length,
      pagina: 0,
      tamanhoPagina: 50,
    };
    return this.respond(page);
  }

  /** GET /api/repertorios/:id */
  getRepertorioById(id: number): Observable<ApiResponse<Repertorio>> {
    const rep = this.repertorios.find(r => r.id === id);
    if (!rep) return this.notFound('Repertório não encontrado.');
    return this.respond(this.enrichRepertorio(rep));
  }

  /** POST /api/repertorios */
  createRepertorio(form: RepertorioForm): Observable<ApiResponse<Repertorio>> {
    const novo: Repertorio = {
      id: this.nextId++,
      nome: form.nome,
      dataCulto: form.dataCulto,
      horario: form.horario,
      tipoCulto: form.tipoCulto,
      localCulto: form.localCulto,
      aviso: form.aviso,
      status: form.status,
      musicasIds: form.musicasIds,
      criadoEm: new Date().toLocaleDateString('pt-BR'),
    };
    this.repertorios = [...this.repertorios, novo];
    return this.respond(this.enrichRepertorio(novo), 'Repertório criado com sucesso.');
  }

  /** PUT /api/repertorios/:id */
  updateRepertorio(id: number, form: RepertorioForm): Observable<ApiResponse<Repertorio>> {
    const index = this.repertorios.findIndex(r => r.id === id);
    if (index === -1) return this.notFound('Repertório não encontrado.');
    const updated: Repertorio = { ...this.repertorios[index], ...form };
    this.repertorios = [
      ...this.repertorios.slice(0, index),
      updated,
      ...this.repertorios.slice(index + 1),
    ];
    return this.respond(this.enrichRepertorio(updated), 'Repertório atualizado com sucesso.');
  }

  /** DELETE /api/repertorios/:id */
  deleteRepertorio(id: number): Observable<ApiResponse<void>> {
    this.repertorios = this.repertorios.filter(r => r.id !== id);
    return this.respond(undefined as unknown as void, 'Repertório removido com sucesso.');
  }

  /**
   * PATCH /api/repertorios/:id/publicar
   * Publica o repertório, tornando-o visível aos músicos escalados
   * para que possam confirmar o conhecimento das músicas.
   */
  publicarRepertorio(id: number): Observable<ApiResponse<Repertorio>> {
    const index = this.repertorios.findIndex(r => r.id === id);
    if (index === -1) return this.notFound('Repertório não encontrado.');
    const updated: Repertorio = { ...this.repertorios[index], status: 'publicado' };
    this.repertorios = [
      ...this.repertorios.slice(0, index),
      updated,
      ...this.repertorios.slice(index + 1),
    ];
    return this.respond(this.enrichRepertorio(updated), 'Repertório publicado. Os músicos já podem confirmar as músicas.');
  }

  // ─── Metadados ───────────────────────────────────────────────────────────

  /** GET /api/tipos-culto */
  getTiposCulto(): Observable<ApiResponse<string[]>> {
    return this.respond(mockData.tiposCulto);
  }

  // ─── Acesso direto (usado internamente por outros services) ──────────────

  getRepertoriosSnapshot(): Repertorio[] {
    return [...this.repertorios];
  }

  // ─── Fluxo de Aprovação ───────────────────────────────────────────────────

  /** Ministro envia o repertório para aprovação pastoral. */
  enviarParaAprovacao(id: number): Observable<ApiResponse<Repertorio>> {
    const index = this.repertorios.findIndex(r => r.id === id);
    if (index === -1) return this.notFound('Repertório não encontrado.');
    const updated: Repertorio = { ...this.repertorios[index], status: 'aguardando_aprovacao' };
    this.repertorios = [...this.repertorios.slice(0, index), updated, ...this.repertorios.slice(index + 1)];
    return this.respond(this.enrichRepertorio(updated), 'Repertório enviado para aprovação do pastor.');
  }

  /**
   * Retorna os repertórios aguardando aprovação.
   * Se filialId for fornecido, filtra pela filial do pastor.
   */
  getRepertoriosPendentesAprovacao(filialId?: number): Observable<ApiResponse<Repertorio[]>> {
    const pendentes = this.repertorios
      .filter(r => r.status === 'aguardando_aprovacao')
      .filter(r => !filialId || r.filialId === filialId)
      .map(r => this.enrichRepertorio(r));
    return this.respond(pendentes);
  }

  /** Pastor aprova um repertório. */
  aprovarRepertorio(repertorioId: number, pastorId: number): Observable<ApiResponse<Repertorio>> {
    const index = this.repertorios.findIndex(r => r.id === repertorioId);
    if (index === -1) return this.notFound('Repertório não encontrado.');
    const aprovacao: AprovacaoRepertorio = {
      id: this.nextAprovacaoId++,
      repertorioId,
      pastorId,
      status: 'aprovado',
      data: new Date().toLocaleDateString('pt-BR'),
    };
    this.aprovacoes = [...this.aprovacoes, aprovacao];
    const updated: Repertorio = { ...this.repertorios[index], status: 'aprovado', aprovacao };
    this.repertorios = [...this.repertorios.slice(0, index), updated, ...this.repertorios.slice(index + 1)];
    return this.respond(this.enrichRepertorio(updated), 'Repertório aprovado com sucesso.');
  }

  /** Pastor reprova um repertório com motivo obrigatório. */
  reprovarRepertorio(repertorioId: number, pastorId: number, motivo: string): Observable<ApiResponse<Repertorio>> {
    const index = this.repertorios.findIndex(r => r.id === repertorioId);
    if (index === -1) return this.notFound('Repertório não encontrado.');
    const aprovacao: AprovacaoRepertorio = {
      id: this.nextAprovacaoId++,
      repertorioId,
      pastorId,
      status: 'reprovado',
      motivo,
      data: new Date().toLocaleDateString('pt-BR'),
    };
    this.aprovacoes = [...this.aprovacoes, aprovacao];
    const updated: Repertorio = { ...this.repertorios[index], status: 'reprovado', aprovacao };
    this.repertorios = [...this.repertorios.slice(0, index), updated, ...this.repertorios.slice(index + 1)];
    return this.respond(this.enrichRepertorio(updated), 'Repertório reprovado.');
  }
}
