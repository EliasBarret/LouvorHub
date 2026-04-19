import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TiposCultoService } from '../../services/tipos-culto.service';
import { IgrejaService } from '../../services/igreja.service';
import { TipoCulto, Igreja } from '../../models';

@Component({
  selector: 'app-gestao-cultos',
  imports: [CommonModule, FormsModule],
  templateUrl: './gestao-cultos.component.html',
  styleUrl: './gestao-cultos.component.scss',
})
export class GestaoCultosComponent implements OnInit {

  tiposCulto: TipoCulto[] = [];
  igrejas: Igreja[] = [];
  isLoading = true;

  // Form state
  showForm = false;
  editingId: number | null = null;

  formNome = '';
  formHorario = '';
  formHorarioFim = '';
  formIgrejaId: number | null = null;

  saving = false;
  formErro = '';
  formSucesso = '';
  removendoId: number | null = null;

  constructor(
    private tiposCultoService: TiposCultoService,
    private igrejaService: IgrejaService,
  ) {}

  ngOnInit(): void {
    this.load();
    this.igrejaService.getIgrejas().subscribe(res => {
      this.igrejas = res.data;
    });
  }

  private load(): void {
    this.isLoading = true;
    this.tiposCultoService.getAll().subscribe({
      next: res => {
        this.tiposCulto = res.data;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; },
    });
  }

  // ─── Form ──────────────────────────────────────────────────────────────

  abrirNovo(): void {
    this.editingId = null;
    this.formNome = '';
    this.formHorario = '';
    this.formHorarioFim = '';
    this.formIgrejaId = null;
    this.formErro = '';
    this.formSucesso = '';
    this.showForm = true;
  }

  abrirEdicao(tipo: TipoCulto): void {
    this.editingId = tipo.id;
    this.formNome = tipo.nome;
    this.formHorario = tipo.horario;
    this.formHorarioFim = tipo.horarioFim ?? '';
    this.formIgrejaId = tipo.igrejaId ?? null;
    this.formErro = '';
    this.formSucesso = '';
    this.showForm = true;
  }

  cancelarForm(): void {
    this.showForm = false;
    this.editingId = null;
    this.formErro = '';
  }

  salvar(): void {
    if (!this.formNome.trim()) {
      this.formErro = 'O nome do tipo de culto é obrigatório.';
      return;
    }
    if (!this.formHorario || !/^\d{2}:\d{2}$/.test(this.formHorario)) {
      this.formErro = 'Informe o horário no formato HH:MM.';
      return;
    }

    this.saving = true;
    this.formErro = '';

    const payload = {
      nome: this.formNome.trim(),
      horario: this.formHorario,
      horarioFim: this.formHorarioFim || undefined,
      igrejaId: this.formIgrejaId ? Number(this.formIgrejaId) : undefined,
    };

    if (this.editingId !== null) {
      this.tiposCultoService.update(this.editingId, payload).subscribe({
        next: res => {
          this.saving = false;
          if (res.sucesso) {
            const idx = this.tiposCulto.findIndex(t => t.id === res.data.id);
            if (idx >= 0) {
              this.tiposCulto = [
                ...this.tiposCulto.slice(0, idx),
                res.data,
                ...this.tiposCulto.slice(idx + 1),
              ];
            }
            this.showForm = false;
            this.editingId = null;
            this.formSucesso = 'Tipo de culto atualizado!';
            setTimeout(() => { this.formSucesso = ''; }, 3000);
          } else {
            this.formErro = res.mensagem;
          }
        },
        error: () => {
          this.saving = false;
          this.formErro = 'Erro ao atualizar. Tente novamente.';
        },
      });
    } else {
      this.tiposCultoService.create(payload).subscribe({
        next: res => {
          this.saving = false;
          if (res.sucesso) {
            this.tiposCulto = [...this.tiposCulto, res.data];
            this.showForm = false;
            this.formSucesso = 'Tipo de culto criado!';
            setTimeout(() => { this.formSucesso = ''; }, 3000);
          } else {
            this.formErro = res.mensagem;
          }
        },
        error: () => {
          this.saving = false;
          this.formErro = 'Erro ao criar. Tente novamente.';
        },
      });
    }
  }

  remover(tipo: TipoCulto): void {
    if (!confirm(`Remover o tipo "${tipo.nome}"?`)) return;
    this.removendoId = tipo.id;
    this.tiposCultoService.delete(tipo.id).subscribe({
      next: () => {
        this.tiposCulto = this.tiposCulto.filter(t => t.id !== tipo.id);
        this.removendoId = null;
      },
      error: () => { this.removendoId = null; },
    });
  }

  getNomeIgreja(igrejaId?: number): string {
    if (!igrejaId) return '—';
    return this.igrejas.find(i => i.id === igrejaId)?.nome ?? '—';
  }
}
