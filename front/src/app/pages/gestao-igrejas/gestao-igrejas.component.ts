import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IgrejaService } from '../../services/igreja.service';
import { UsuarioService } from '../../services/usuario.service';
import { Igreja, MembroIgreja, Usuario, Perfil } from '../../models';

@Component({
  selector: 'app-gestao-igrejas',
  imports: [CommonModule, FormsModule],
  templateUrl: './gestao-igrejas.component.html',
  styleUrl: './gestao-igrejas.component.scss',
})
export class GestaoIgrejasComponent implements OnInit {

  view: 'lista' | 'detalhe' = 'lista';

  // ─── List state ──────────────────────────────────────────────────────────
  igrejas: Igreja[] = [];
  isLoading = true;
  private membrosCountMap = new Map<number, number>();

  // ─── Detail state ────────────────────────────────────────────────────────
  selectedIgreja: Igreja | null = null;
  editando = false;
  activeTab: 'dados' | 'membros' = 'dados';

  // Form (create / edit)
  formNome = '';
  formCidade = '';
  formObservacoes = '';
  saving = false;
  formErro = '';
  formSucesso = '';

  // Members
  membros: MembroIgreja[] = [];
  loadingMembros = false;
  todosUsuarios: Usuario[] = [];
  novoMembroUsuarioId: number | null = null;
  novoMembroPerfil: Perfil = 'Musico';
  addingMembro = false;
  membroErro = '';
  removendoId: number | null = null;

  constructor(
    private igrejaService: IgrejaService,
    private usuarioService: UsuarioService,
  ) {}

  ngOnInit(): void {
    this.igrejaService.getIgrejas().subscribe(res => {
      this.igrejas = res.data;
      this.igrejas.forEach(ig => {
        this.igrejaService.getMembros(ig.id).subscribe(m => {
          this.membrosCountMap.set(ig.id, m.data.length);
        });
      });
      this.isLoading = false;
    });

    this.usuarioService.getUsuarios().subscribe(res => {
      this.todosUsuarios = res.data.conteudo;
    });
  }

  getMembrosCount(igrejaId: number): number {
    return this.membrosCountMap.get(igrejaId) ?? 0;
  }

  // ─── Navigation ──────────────────────────────────────────────────────────

  abrirDetalhe(igreja: Igreja): void {
    this.selectedIgreja = { ...igreja };
    this.editando = false;
    this.activeTab = 'membros';
    this.formErro = '';
    this.formSucesso = '';
    this.view = 'detalhe';
    this.loadMembros(igreja.id);
  }

  private loadMembros(igrejaId: number): void {
    this.loadingMembros = true;
    this.igrejaService.getMembros(igrejaId).subscribe(res => {
      this.membros = res.data;
      this.loadingMembros = false;
    });
  }

  novaIgreja(): void {
    this.selectedIgreja = null;
    this.editando = true;
    this.activeTab = 'dados';
    this.formNome = '';
    this.formCidade = '';
    this.formObservacoes = '';
    this.formErro = '';
    this.formSucesso = '';
    this.membros = [];
    this.view = 'detalhe';
  }

  iniciarEdicao(): void {
    if (!this.selectedIgreja) return;
    this.formNome = this.selectedIgreja.nome;
    this.formCidade = this.selectedIgreja.cidade ?? '';
    this.formObservacoes = this.selectedIgreja.observacoes ?? '';
    this.editando = true;
    this.formErro = '';
    this.formSucesso = '';
    this.activeTab = 'dados';
  }

  cancelarEdicao(): void {
    if (!this.selectedIgreja) {
      this.view = 'lista';
    } else {
      this.editando = false;
    }
    this.formErro = '';
  }

  voltarLista(): void {
    this.view = 'lista';
    this.selectedIgreja = null;
    this.editando = false;
    this.membros = [];
    this.formErro = '';
    this.formSucesso = '';
  }

  // ─── CRUD Igreja ─────────────────────────────────────────────────────────

  salvarIgreja(): void {
    if (!this.formNome.trim()) {
      this.formErro = 'O nome da igreja é obrigatório.';
      return;
    }
    this.saving = true;
    this.formErro = '';
    const form = {
      nome: this.formNome.trim(),
      cidade: this.formCidade.trim() || undefined,
      observacoes: this.formObservacoes.trim() || undefined,
    };

    if (this.selectedIgreja) {
      this.igrejaService.updateIgreja(this.selectedIgreja.id, form).subscribe(res => {
        this.saving = false;
        if (res.sucesso) {
          this.selectedIgreja = res.data;
          const idx = this.igrejas.findIndex(i => i.id === res.data.id);
          if (idx >= 0) this.igrejas = [...this.igrejas.slice(0, idx), res.data, ...this.igrejas.slice(idx + 1)];
          this.editando = false;
          this.formSucesso = 'Igreja atualizada com sucesso!';
        } else {
          this.formErro = res.mensagem;
        }
      });
    } else {
      this.igrejaService.createIgreja(form).subscribe(res => {
        this.saving = false;
        if (res.sucesso) {
          this.igrejas = [...this.igrejas, res.data];
          this.membrosCountMap.set(res.data.id, 0);
          this.selectedIgreja = res.data;
          this.editando = false;
          this.activeTab = 'membros';
          this.formSucesso = 'Igreja criada! Agora adicione os membros.';
        } else {
          this.formErro = res.mensagem;
        }
      });
    }
  }

  // ─── Membros ─────────────────────────────────────────────────────────────

  get usuariosDisponiveis(): Usuario[] {
    const membroIds = new Set(this.membros.map(m => m.usuarioId));
    return this.todosUsuarios.filter(u => !membroIds.has(u.id) && u.perfil !== 'ADM');
  }

  adicionarMembro(): void {
    if (!this.novoMembroUsuarioId || !this.selectedIgreja) return;
    this.addingMembro = true;
    this.membroErro = '';
    this.igrejaService
      .addMembro(this.selectedIgreja.id, Number(this.novoMembroUsuarioId), this.novoMembroPerfil)
      .subscribe(res => {
        this.addingMembro = false;
        if (res.sucesso) {
          this.membros = [...this.membros, res.data];
          this.membrosCountMap.set(
            this.selectedIgreja!.id,
            (this.membrosCountMap.get(this.selectedIgreja!.id) ?? 0) + 1,
          );
          this.novoMembroUsuarioId = null;
          this.novoMembroPerfil = 'Musico';
        } else {
          this.membroErro = res.mensagem;
        }
      });
  }

  removerMembro(membroId: number): void {
    this.removendoId = membroId;
    this.igrejaService.removeMembro(membroId).subscribe(() => {
      this.membros = this.membros.filter(m => m.id !== membroId);
      if (this.selectedIgreja) {
        this.membrosCountMap.set(
          this.selectedIgreja.id,
          Math.max(0, (this.membrosCountMap.get(this.selectedIgreja.id) ?? 0) - 1),
        );
      }
      this.removendoId = null;
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  perfilLabel(perfil: Perfil): string {
    const labels: Record<Perfil, string> = {
      ADM: 'Administrador',
      Pastor: 'Pastor',
      Ministro: 'Ministro de Louvor',
      Musico: 'Músico',
      Cantor: 'Cantor(a)',
    };
    return labels[perfil] ?? perfil;
  }
}
