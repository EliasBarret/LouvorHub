import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MockApiService } from '../../services/mock-api.service';
import { TipoMusica, MusicaHistoricoItem } from '../../models';

@Component({
  selector: 'app-cadastro-musica',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cadastro-musica.component.html',
  styleUrl: './cadastro-musica.component.scss',
})
export class CadastroMusicaComponent implements OnInit {
  form!: FormGroup;
  tons: string[] = [];
  isSubmitting = false;
  isLoading = false;
  submitError = '';
  submitSuccess = false;

  modoEdicao = false;
  musicaId: number | null = null;
  historico: MusicaHistoricoItem[] = [];
  historicoLoading = false;

  readonly tiposMusica: { valor: TipoMusica; label: string }[] = [
    { valor: 'Adoracao',              label: 'Adoração' },
    { valor: 'Solo',                  label: 'Solo' },
    { valor: 'Ofertorio',             label: 'Ofertório' },
    { valor: 'Abertura',              label: 'Abertura' },
    { valor: 'DistribuicaoElementos', label: 'Distribuição dos Elementos' },
    { valor: 'Apelo',                 label: 'Apelo' },
  ];

  constructor(
    private fb: FormBuilder,
    private api: MockApiService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadMetadata();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.modoEdicao = true;
      this.musicaId = Number(id);
      this.carregarMusica(this.musicaId);
      this.carregarHistorico(this.musicaId);
    }
  }

  private buildForm(): void {
    this.form = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(2)]],
      artista: ['', [Validators.required, Validators.minLength(2)]],
      tomFeminino: ['', Validators.required],
      tom: [''],
      bpm: [null, [Validators.min(20), Validators.max(300)]],
      linkYoutube: [''],
      linkSpotify: [''],
      observacoes: [''],
    });
  }

  private loadMetadata(): void {
    this.api.getTons().subscribe(res => {
      this.tons = res.data;
    });
  }

  private carregarMusica(id: number): void {
    this.isLoading = true;
    this.api.getMusicaById(id).subscribe({
      next: (res) => {
        const m = res.data;
        this.form.patchValue({
          titulo: m.titulo,
          artista: m.artista,
          tomFeminino: m.tomFeminino,
          tom: m.tom,
          bpm: m.bpm || null,
          linkYoutube: m.linkYoutube,
          linkSpotify: m.linkSpotify,
          observacoes: m.observacoes,
        });
        this.selectedTipos = new Set<TipoMusica>(m.tipos ?? []);
        this.isLoading = false;
      },
      error: () => {
        this.submitError = 'Erro ao carregar os dados da música.';
        this.isLoading = false;
      },
    });
  }

  private carregarHistorico(id: number): void {
    this.historicoLoading = true;
    this.api.getMusicaHistorico(id).subscribe({
      next: (res) => {
        this.historico = res.data;
        this.historicoLoading = false;
      },
      error: () => { this.historicoLoading = false; },
    });
  }

  selectedTipos = new Set<TipoMusica>();

  toggleTipo(tipo: TipoMusica): void {
    if (this.selectedTipos.has(tipo)) {
      this.selectedTipos.delete(tipo);
    } else {
      this.selectedTipos.add(tipo);
    }
  }

  isTipoSelected(tipo: TipoMusica): boolean {
    return this.selectedTipos.has(tipo);
  }

  get f() {
    return this.form.controls;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.submitError = '';

    const payload = {
      ...this.form.value,
      tipos: Array.from(this.selectedTipos),
    };

    const request$ = this.modoEdicao && this.musicaId
      ? this.api.updateMusica(this.musicaId, payload)
      : this.api.createMusica(payload);

    request$.subscribe({
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
        this.submitError = 'Erro ao salvar a música. Tente novamente.';
        this.isSubmitting = false;
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/repertorios']);
  }
}
