import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

import mockData from '../data/mock-data.json';
import { Usuario, PerfilForm, ApiResponse, PageResponse } from '../models';

/**
 * UsuarioService — responsável pelas operações de perfil do usuário logado
 * e consulta de outros membros do ministério. Simula endpoints REST.
 *
 * Endpoints cobertos:
 *   GET   /api/usuarios/me          → dados do usuário logado
 *   PUT   /api/usuarios/me          → atualizar perfil
 *   GET   /api/usuarios             → listar membros do ministério
 *   GET   /api/usuarios/:id         → buscar membro por ID
 */
@Injectable({ providedIn: 'root' })
export class UsuarioService {

  private readonly DELAY_MS = 300;

  private usuarioLogado: Usuario = mockData.usuario as Usuario;
  private membros: Usuario[] = mockData.usuarios as Usuario[];

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

  // ─── Usuário logado ──────────────────────────────────────────────────────

  /** GET /api/usuarios/me */
  getUsuarioLogado(): Observable<ApiResponse<Usuario>> {
    return this.respond({ ...this.usuarioLogado });
  }

  /**
   * PUT /api/usuarios/me
   * Atualiza o perfil do usuário logado.
   */
  updatePerfil(form: PerfilForm): Observable<ApiResponse<Usuario>> {
    const iniciais = form.nome
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(p => p[0].toUpperCase())
      .join('');

    this.usuarioLogado = {
      ...this.usuarioLogado,
      nome: form.nome,
      primeiroNome: form.nome.split(' ')[0],
      email: form.email,
      funcao: form.funcao,
      ministerio: form.ministerio,
      iniciais,
      ...(form.avatar !== undefined ? { avatar: form.avatar ?? null } : {}),
    };

    // Sincroniza na lista de membros
    const index = this.membros.findIndex(m => m.id === this.usuarioLogado.id);
    if (index !== -1) {
      this.membros = [
        ...this.membros.slice(0, index),
        { ...this.usuarioLogado },
        ...this.membros.slice(index + 1),
      ];
    }

    return this.respond({ ...this.usuarioLogado }, 'Perfil atualizado com sucesso.');
  }

  // ─── Membros do ministério ────────────────────────────────────────────────

  /** GET /api/usuarios — lista todos os membros do ministério */
  getMembros(): Observable<ApiResponse<PageResponse<Usuario>>> {
    const page: PageResponse<Usuario> = {
      conteudo: [...this.membros],
      total: this.membros.length,
      pagina: 0,
      tamanhoPagina: 50,
    };
    return this.respond(page);
  }

  /** GET /api/usuarios/:id */
  getMembroById(id: number): Observable<ApiResponse<Usuario>> {
    const membro = this.membros.find(m => m.id === id);
    if (!membro) return this.notFound('Membro não encontrado.');
    return this.respond({ ...membro });
  }
}
