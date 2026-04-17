import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MockApiService } from '../../services/mock-api.service';
import { Musica, Tag } from '../../models';

@Component({
  selector: 'app-cadastro-repertorio',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './cadastro-repertorio.component.html',
  styleUrl: './cadastro-repertorio.component.scss',
})
export class CadastroRepertorioComponent implements OnInit {
  form!: FormGroup;
  tiposCulto: string[] = [];
  todasMusicas: Musica[] = [];
  tags: Tag[] = [];

  musicasBuscadas: Musica[] = [];
  musicasSelecionadas: Musica[] = [];
  buscaMusica = '';

  isSubmitting = false;
  submitError = '';
  submitSuccess = false;
  isLoadingMusicas = true;

  constructor(
    private fb: FormBuilder,
    private api: MockApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadMetadata();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      dataCulto: ['', Validators.required],
      tipoCulto: ['', Validators.required],
      status: ['rascunho', Validators.required],
    });
  }

  private loadMetadata(): void {
    this.api.getTiposCulto().subscribe(res => {
      this.tiposCulto = res.data;
    });

    this.api.getTags().subscribe(res => {
      this.tags = res.data;
    });

    this.api.getMusicas().subscribe(res => {
      this.todasMusicas = res.data.conteudo;
      this.musicasBuscadas = [...this.todasMusicas];
      this.isLoadingMusicas = false;
    });
  }

  get f() {
    return this.form.controls;
  }

  onTipoCultoChange(tipo: string): void {
    const nomeAtual = this.form.get('nome')?.value;
    if (!nomeAtual) {
      this.form.patchValue({ nome: tipo });
    }
  }

  filtrarMusicas(): void {
    const query = this.buscaMusica.toLowerCase().trim();
    this.musicasBuscadas = this.todasMusicas.filter(m =>
      !this.musicasSelecionadas.some(s => s.id === m.id) &&
      (query === '' ||
        m.titulo.toLowerCase().includes(query) ||
        m.artista.toLowerCase().includes(query) ||
        m.tom.toLowerCase().includes(query))
    );
  }

  adicionarMusica(musica: Musica): void {
    if (!this.musicasSelecionadas.some(m => m.id === musica.id)) {
      this.musicasSelecionadas = [...this.musicasSelecionadas, musica];
      this.buscaMusica = '';
      this.filtrarMusicas();
    }
  }

  removerMusica(id: number): void {
    this.musicasSelecionadas = this.musicasSelecionadas.filter(m => m.id !== id);
    this.filtrarMusicas();
  }

  moverMusica(index: number, direction: 'up' | 'down'): void {
    const list = [...this.musicasSelecionadas];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    [list[index], list[targetIndex]] = [list[targetIndex], list[index]];
    this.musicasSelecionadas = list;
  }

  getTagCor(tagNome: string): string {
    return this.tags.find(t => t.nome === tagNome)?.cor ?? '#6B7280';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.submitError = '';

    const rawDate: string = this.form.value.dataCulto;
    const [year, month, day] = rawDate.split('-');
    const dataCultoFormatada = `${day}/${month}/${year}`;

    const payload = {
      ...this.form.value,
      dataCulto: dataCultoFormatada,
      musicasIds: this.musicasSelecionadas.map(m => m.id),
    };

    this.api.createRepertorio(payload).subscribe({
      next: (res) => {
        if (res.sucesso) {
          this.submitSuccess = true;
          setTimeout(() => this.router.navigate(['/repertorios']), 1500);
        } else {
          this.submitError = res.mensagem;
        }
        this.isSubmitting = false;
      },
      error: () => {
        this.submitError = 'Erro ao salvar o repertório. Tente novamente.';
        this.isSubmitting = false;
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/repertorios']);
  }
}
