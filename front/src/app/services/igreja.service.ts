import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

import mockData from '../data/mock-data.json';
import { Igreja, MembroIgreja, Usuario, Perfil, ApiResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class IgrejaService {

  private readonly DELAY_MS = 300;

  private igrejas: Igreja[] = (mockData as unknown as { igrejas: Igreja[] }).igrejas;
  private membros: MembroIgreja[] = (mockData as unknown as { membros_igrejas: MembroIgreja[] }).membros_igrejas;
  private readonly usuarios: Usuario[] = mockData.usuarios as unknown as Usuario[];

  private nextIgrejaId = this.igrejas.length + 1;
  private nextMembroId = this.membros.length + 1;

  // ─── Utilitários ─────────────────────────────────────────────────────────

  private respond<T>(data: T, mensagem = 'OK'): Observable<ApiResponse<T>> {
    return of({ data, sucesso: true, mensagem, timestamp: new Date().toISOString() }).pipe(delay(this.DELAY_MS));
  }

  private notFound<T>(mensagem: string): Observable<ApiResponse<T>> {
    return of({ data: null as unknown as T, sucesso: false, mensagem, timestamp: new Date().toISOString() }).pipe(delay(this.DELAY_MS));
  }

  private enrichMembro(m: MembroIgreja): MembroIgreja {
    const usuario = this.usuarios.find(u => u.id === m.usuarioId);
    const igreja = this.igrejas.find(i => i.id === m.igrejaId);
    return { ...m, usuario, igreja };
  }

  // ─── CRUD Igrejas ─────────────────────────────────────────────────────────

  getIgrejas(): Observable<ApiResponse<Igreja[]>> {
    return this.respond([...this.igrejas]);
  }

  getIgrejaById(id: number): Observable<ApiResponse<Igreja>> {
    const igreja = this.igrejas.find(i => i.id === id);
    if (!igreja) return this.notFound('Igreja não encontrada.');
    return this.respond({ ...igreja });
  }

  createIgreja(form: { nome: string; cidade?: string; observacoes?: string }): Observable<ApiResponse<Igreja>> {
    const nova: Igreja = {
      id: this.nextIgrejaId++,
      nome: form.nome,
      ...(form.cidade ? { cidade: form.cidade } : {}),
      ...(form.observacoes ? { observacoes: form.observacoes } : {}),
    };
    this.igrejas = [...this.igrejas, nova];
    return this.respond(nova, 'Igreja criada com sucesso.');
  }

  updateIgreja(id: number, form: { nome: string; cidade?: string; observacoes?: string }): Observable<ApiResponse<Igreja>> {
    const index = this.igrejas.findIndex(i => i.id === id);
    if (index === -1) return this.notFound('Igreja não encontrada.');
    const updated: Igreja = {
      ...this.igrejas[index],
      nome: form.nome,
      cidade: form.cidade,
      observacoes: form.observacoes,
    };
    this.igrejas = [...this.igrejas.slice(0, index), updated, ...this.igrejas.slice(index + 1)];
    return this.respond(updated, 'Igreja atualizada com sucesso.');
  }

  deleteIgreja(id: number): Observable<ApiResponse<void>> {
    this.igrejas = this.igrejas.filter(i => i.id !== id);
    this.membros = this.membros.filter(m => m.igrejaId !== id);
    return this.respond(undefined as unknown as void, 'Igreja removida.');
  }

  // ─── Membros ─────────────────────────────────────────────────────────────

  getMembros(igrejaId: number): Observable<ApiResponse<MembroIgreja[]>> {
    const result = this.membros
      .filter(m => m.igrejaId === igrejaId)
      .map(m => this.enrichMembro(m));
    return this.respond(result);
  }

  /** Retorna todos os vínculos (igreja + perfil) do usuário. */
  getIgrejasByUsuarioId(usuarioId: number): Observable<ApiResponse<MembroIgreja[]>> {
    const result = this.membros
      .filter(m => m.usuarioId === usuarioId)
      .map(m => this.enrichMembro(m));
    return this.respond(result);
  }

  addMembro(igrejaId: number, usuarioId: number, perfil: Perfil): Observable<ApiResponse<MembroIgreja>> {
    const exists = this.membros.find(m => m.igrejaId === igrejaId && m.usuarioId === usuarioId);
    if (exists) {
      return of({
        data: null as unknown as MembroIgreja,
        sucesso: false,
        mensagem: 'Usuário já é membro desta igreja.',
        timestamp: new Date().toISOString(),
      }).pipe(delay(this.DELAY_MS));
    }
    const novo: MembroIgreja = { id: this.nextMembroId++, usuarioId, igrejaId, perfil };
    this.membros = [...this.membros, novo];
    return this.respond(this.enrichMembro(novo), 'Membro adicionado com sucesso.');
  }

  removeMembro(membroId: number): Observable<ApiResponse<void>> {
    this.membros = this.membros.filter(m => m.id !== membroId);
    return this.respond(undefined as unknown as void, 'Membro removido.');
  }
}
