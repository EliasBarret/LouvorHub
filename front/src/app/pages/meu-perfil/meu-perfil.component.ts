import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MockApiService } from '../../services/mock-api.service';
import { Usuario } from '../../models';

@Component({
  selector: 'app-meu-perfil',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './meu-perfil.component.html',
  styleUrl: './meu-perfil.component.scss'
})
export class MeuPerfilComponent implements OnInit {
  usuario: Usuario | null = null;
  editMode = false;
  isSaving = false;
  saveSuccess = false;
  noInstrumentoError = false;
  form!: FormGroup;

  readonly INSTRUMENTOS_DISPONIVEIS = [
    'Violão', 'Guitarra', 'Baixo', 'Bateria', 'Teclado',
    'Voz', 'Flauta', 'Saxofone', 'Trompete', 'Violino', 'Percussão',
  ];

  readonly stats = [
    { label: 'Cultos participados', value: 42 },
    { label: 'Músicas confirmadas', value: 128 },
    { label: 'Repertórios', value: 15 },
  ];

  constructor(private api: MockApiService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.api.getUsuarioLogado().subscribe(res => {
      this.usuario = res.data;
      this.buildForm();
    });
  }

  private buildForm(): void {
    this.form = this.fb.group({
      dataMembro: [this.usuario?.dataMembro ?? '', Validators.required],
    });
  }

  get selectedInstrumentos(): Set<string> {
    if (!this.usuario) return new Set();
    return new Set(this.usuario.instrumentos ?? []);
  }

  // Cópia temporária dos instrumentos durante a edição
  private _editInstrumentos = new Set<string>();

  get editInstrumentos(): Set<string> {
    return this._editInstrumentos;
  }

  enterEditMode(): void {
    this._editInstrumentos = new Set(this.usuario?.instrumentos ?? []);
    this.form.patchValue({ dataMembro: this.usuario?.dataMembro ?? '' });
    this.saveSuccess = false;
    this.noInstrumentoError = false;
    this.editMode = true;
  }

  cancelEdit(): void {
    this.editMode = false;
  }

  toggleInstrumento(inst: string): void {
    if (this._editInstrumentos.has(inst)) {
      this._editInstrumentos.delete(inst);
    } else {
      this._editInstrumentos.add(inst);
    }
    if (this._editInstrumentos.size > 0) this.noInstrumentoError = false;
  }

  saveEdit(): void {
    this.noInstrumentoError = this._editInstrumentos.size === 0;
    if (this.form.invalid || this.noInstrumentoError) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSaving = true;
    this.api.updatePerfilEditavel({
      instrumentos: Array.from(this._editInstrumentos),
      dataMembro: this.form.value.dataMembro,
    }).subscribe(res => {
      this.isSaving = false;
      this.usuario = res.data;
      this.editMode = false;
      this.saveSuccess = true;
      setTimeout(() => (this.saveSuccess = false), 3000);
    });
  }

  formatDataMembro(iso: string | undefined): string {
    if (!iso) return '—';
    const [year, month] = iso.split('-').map(Number);
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ];
    return `${meses[month - 1]} ${year}`;
  }
}

