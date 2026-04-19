import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MockApiService } from '../../services/mock-api.service';
import { IgrejaService } from '../../services/igreja.service';
import { Musica, Tag, Igreja, MembroIgreja } from '../../models';

interface MusicoForm {
  membro: MembroIgreja;
  instrumento: string;
}

interface MusicaAssignment {
  cantores: MembroIgreja[];
  musicos: MusicoForm[];
  searchCantor: string;
  searchMusico: string;
  instrumentoInput: string;
  showAssignment: boolean;
  membrosBuscadosCantores: MembroIgreja[];
  membrosBuscadosMusicos: MembroIgreja[];
}

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
  minhasIgrejas: Igreja[] = [];
  membrosIgreja: MembroIgreja[] = [];

  musicasBuscadas: Musica[] = [];
  musicasSelecionadas: Musica[] = [];
  buscaMusica = '';

  // Map: musicaId -> MusicaAssignment
  musicaAssignments: Map<number, MusicaAssignment> = new Map();

  isSubmitting = false;
  submitError = '';
  submitSuccess = false;
  isLoadingMusicas = true;
  isLoadingMembros = false;

  constructor(
    private fb: FormBuilder,
    private api: MockApiService,
    private igrejaService: IgrejaService,
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
      igrejaId: [null, Validators.required],
    });

    this.form.get('igrejaId')?.valueChanges.subscribe(igrejaId => {
      if (igrejaId) this.loadMembros(Number(igrejaId));
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

    this.api.getUsuarioLogado().subscribe(userRes => {
      if (userRes.data.perfil === 'ADM') {
        this.igrejaService.getIgrejas().subscribe(res => {
          this.minhasIgrejas = res.data;
          if (res.data.length === 1) this.form.patchValue({ igrejaId: res.data[0].id });
        });
      } else {
        this.igrejaService.getIgrejasByUsuarioId(userRes.data.id).subscribe(membRes => {
          this.minhasIgrejas = membRes.data;
          if (this.minhasIgrejas.length === 1) this.form.patchValue({ igrejaId: this.minhasIgrejas[0].id });
        });
      }
    });
  }

  private loadMembros(igrejaId: number): void {
    this.isLoadingMembros = true;
    this.igrejaService.getMembros(igrejaId).subscribe({
      next: res => {
        this.membrosIgreja = res.data;
        this.isLoadingMembros = false;
        // Atualiza sugestões nos assignments existentes
        this.musicaAssignments.forEach(a => {
          a.membrosBuscadosCantores = this.filtrarMembrosDisponiveis(a.searchCantor, a.cantores.map(c => c.usuarioId));
          a.membrosBuscadosMusicos = this.filtrarMembrosDisponiveis(a.searchMusico, a.musicos.map(m => m.membro.usuarioId));
        });
      },
      error: () => { this.isLoadingMembros = false; },
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
      this.musicaAssignments.set(musica.id, {
        cantores: [],
        musicos: [],
        searchCantor: '',
        searchMusico: '',
        instrumentoInput: '',
        showAssignment: false,
        membrosBuscadosCantores: [...this.membrosIgreja],
        membrosBuscadosMusicos: [...this.membrosIgreja],
      });
      this.buscaMusica = '';
      this.filtrarMusicas();
    }
  }

  removerMusica(id: number): void {
    this.musicasSelecionadas = this.musicasSelecionadas.filter(m => m.id !== id);
    this.musicaAssignments.delete(id);
    this.filtrarMusicas();
  }

  moverMusica(index: number, direction: 'up' | 'down'): void {
    const list = [...this.musicasSelecionadas];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    [list[index], list[targetIndex]] = [list[targetIndex], list[index]];
    this.musicasSelecionadas = list;
  }

  toggleAssignment(musicaId: number): void {
    const a = this.musicaAssignments.get(musicaId);
    if (a) a.showAssignment = !a.showAssignment;
  }

  getAssignment(musicaId: number): MusicaAssignment {
    return this.musicaAssignments.get(musicaId)!;
  }

  // ─── Cantores ─────────────────────────────────────────────────────────────

  onSearchCantorInput(musicaId: number, query: string): void {
    const a = this.musicaAssignments.get(musicaId);
    if (!a) return;
    a.searchCantor = query;
    const excluidos = a.cantores.map(c => c.usuarioId);
    a.membrosBuscadosCantores = this.filtrarMembrosDisponiveis(query, excluidos);
  }

  adicionarCantor(musicaId: number, membro: MembroIgreja): void {
    const a = this.musicaAssignments.get(musicaId);
    if (!a || a.cantores.some(c => c.usuarioId === membro.usuarioId)) return;
    a.cantores = [...a.cantores, membro];
    a.searchCantor = '';
    const excluidos = a.cantores.map(c => c.usuarioId);
    a.membrosBuscadosCantores = this.filtrarMembrosDisponiveis('', excluidos);
  }

  removerCantor(musicaId: number, usuarioId: number): void {
    const a = this.musicaAssignments.get(musicaId);
    if (!a) return;
    a.cantores = a.cantores.filter(c => c.usuarioId !== usuarioId);
    a.membrosBuscadosCantores = this.filtrarMembrosDisponiveis(a.searchCantor, a.cantores.map(c => c.usuarioId));
  }

  // ─── Músicos ──────────────────────────────────────────────────────────────

  onSearchMusicoInput(musicaId: number, query: string): void {
    const a = this.musicaAssignments.get(musicaId);
    if (!a) return;
    a.searchMusico = query;
    const excluidos = a.musicos.map(m => m.membro.usuarioId);
    a.membrosBuscadosMusicos = this.filtrarMembrosDisponiveis(query, excluidos);
  }

  adicionarMusico(musicaId: number, membro: MembroIgreja): void {
    const a = this.musicaAssignments.get(musicaId);
    if (!a || a.musicos.some(m => m.membro.usuarioId === membro.usuarioId)) return;
    const instrumento = membro.usuario?.instrumentos?.[0] ?? '';
    a.musicos = [...a.musicos, { membro, instrumento }];
    a.searchMusico = '';
    const excluidos = a.musicos.map(m => m.membro.usuarioId);
    a.membrosBuscadosMusicos = this.filtrarMembrosDisponiveis('', excluidos);
  }

  removerMusico(musicaId: number, usuarioId: number): void {
    const a = this.musicaAssignments.get(musicaId);
    if (!a) return;
    a.musicos = a.musicos.filter(m => m.membro.usuarioId !== usuarioId);
    a.membrosBuscadosMusicos = this.filtrarMembrosDisponiveis(a.searchMusico, a.musicos.map(m => m.membro.usuarioId));
  }

  getInstrumentos(membro: MembroIgreja): string[] {
    return membro.usuario?.instrumentos ?? [];
  }

  getNomeUsuario(membro: MembroIgreja): string {
    return membro.usuario?.nome ?? `Usuário #${membro.usuarioId}`;
  }

  private filtrarMembrosDisponiveis(query: string, excluirIds: number[]): MembroIgreja[] {
    const q = query.toLowerCase().trim();
    return this.membrosIgreja.filter(m =>
      !excluirIds.includes(m.usuarioId) &&
      (q === '' || (m.usuario?.nome ?? '').toLowerCase().includes(q))
    );
  }

  getTagCor(tagNome: string): string {
    return this.tags.find(t => t.nome === tagNome)?.cor ?? '#6B7280';
  }

  getTotalEscalados(musicaId: number): number {
    const a = this.musicaAssignments.get(musicaId);
    return (a?.cantores.length ?? 0) + (a?.musicos.length ?? 0);
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
      status: 'aguardando_aprovacao' as const,
      musicas: this.musicasSelecionadas.map(m => {
        const a = this.musicaAssignments.get(m.id);
        return {
          musicaId: m.id,
          cantores: a?.cantores.map(c => c.usuarioId) ?? [],
          musicos: a?.musicos.map(mf => ({ usuarioId: mf.membro.usuarioId, instrumento: mf.instrumento })) ?? [],
        };
      }),
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
