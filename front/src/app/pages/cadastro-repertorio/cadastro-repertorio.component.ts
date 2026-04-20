import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { MockApiService } from '../../services/mock-api.service';
import { IgrejaService } from '../../services/igreja.service';
import { TiposCultoService } from '../../services/tipos-culto.service';
import { Musica, Tag, Igreja, MembroIgreja, Repertorio, TipoCulto } from '../../models';

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
export class CadastroRepertorioComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  tiposCulto: TipoCulto[] = [];
  tags: Tag[] = [];
  minhasIgrejas: Igreja[] = [];
  membrosIgreja: MembroIgreja[] = [];

  musicasBuscadas: Musica[] = [];
  musicasSelecionadas: Musica[] = [];
  buscaMusica = '';

  private buscaSubject = new Subject<string>();
  private buscaSub?: Subscription;

  // Map: musicaId -> MusicaAssignment
  musicaAssignments: Map<number, MusicaAssignment> = new Map();

  isSubmitting = false;
  submitError = '';
  submitSuccess = false;
  isLoadingMusicas = true;
  isLoadingMembros = false;

  // Modo edição
  modoEdicao = false;
  repertorioId: number | null = null;
  repertorioOriginal: Repertorio | null = null;
  isLoadingRepertorio = false;

  constructor(
    private fb: FormBuilder,
    private api: MockApiService,
    private igrejaService: IgrejaService,
    private tiposCultoService: TiposCultoService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadMetadata();
    this.buscaSub = this.buscaSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => {
        this.isLoadingMusicas = true;
        return this.api.buscarMusicas(q);
      }),
    ).subscribe(res => {
      this.musicasBuscadas = res.data.filter(
        m => !this.musicasSelecionadas.some(s => s.id === m.id),
      );
      this.isLoadingMusicas = false;
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.modoEdicao = true;
      this.repertorioId = Number(idParam);
      this.isLoadingRepertorio = true;
      this.api.getRepertorioById(this.repertorioId).subscribe(res => {
        this.repertorioOriginal = res.data;
        this.preencherFormulario(res.data);
        this.isLoadingRepertorio = false;
      });
    }
  }

  private preencherFormulario(rep: Repertorio): void {
    // dataCulto vem como dd/MM/yyyy, input[type=date] precisa de yyyy-MM-dd
    const dataCultoIso = this.brToIso(rep.dataCulto);

    this.form.patchValue({
      nome: rep.nome,
      dataCulto: dataCultoIso,
      tipoCulto: rep.tipoCulto,
      igrejaId: rep.igrejaId ?? null,
      horario: rep.horario ?? '',
      horarioFim: rep.horarioFim ?? '',
      localCulto: rep.localCulto ?? '',
      aviso: rep.aviso ?? '',
    });

    // Pré-seleciona músicas do repertório diretamente dos dados retornados
    (rep.musicas ?? []).forEach(mr => {
      if (!this.musicasSelecionadas.some(m => m.id === mr.id)) {
        this.musicasSelecionadas = [...this.musicasSelecionadas, mr];
        const cantoresMemb: MembroIgreja[] = mr.cantores.map(c => this.toMembro(c, rep.igrejaId));
        const musicosForm: MusicoForm[] = mr.musicos.map(mu => ({
          membro: this.toMembro(mu, rep.igrejaId),
          instrumento: mu.instrumento,
        }));
        this.musicaAssignments.set(mr.id, {
          cantores: cantoresMemb,
          musicos: musicosForm,
          searchCantor: '',
          searchMusico: '',
          instrumentoInput: '',
          showAssignment: false,
          membrosBuscadosCantores: [...this.membrosIgreja],
          membrosBuscadosMusicos: [...this.membrosIgreja],
        });
      }
    });
  }

  /** Converte CantorescaladoItem / MusicoEscaladoItem em MembroIgreja sintético */
  private toMembro(item: any, igrejaId?: number): MembroIgreja {
    return {
      id: item.id ?? 0,
      usuarioId: item.id ?? item.usuarioId,
      igrejaId: igrejaId ?? 0,
      perfil: item.perfil ?? 'Musico',
      usuario: {
        id: item.id ?? item.usuarioId,
        nome: item.nome ?? '',
        email: item.email ?? '',
        primeiroNome: (item.nome ?? '').split(' ')[0],
        iniciais: (item.nome ?? '').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
        funcao: '',
        ministerio: '',
        avatar: null,
        perfil: item.perfil,
        instrumentos: item.instrumentos ?? [],
      },
    };
  }

  /** Converte dd/MM/yyyy → yyyy-MM-dd para o input[type=date] */
  private brToIso(date: string): string {
    if (!date || !date.includes('/')) return date;
    const [d, m, y] = date.split('/');
    return `${y}-${m}-${d}`;
  }

  private buildForm(): void {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      dataCulto: ['', Validators.required],
      tipoCulto: ['', Validators.required],
      igrejaId: [null, Validators.required],
      horario: [''],
      horarioFim: [''],
    });

    this.form.get('igrejaId')?.valueChanges.subscribe(igrejaId => {
      if (igrejaId) this.loadMembros(Number(igrejaId));
    });
  }

  ngOnDestroy(): void {
    this.buscaSub?.unsubscribe();
  }

  private loadMetadata(): void {
    this.tiposCultoService.getAll().subscribe(res => {
      this.tiposCulto = res.data;
    });

    this.api.getTags().subscribe(res => {
      this.tags = res.data;
    });

    this.isLoadingMusicas = false;

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

  onTipoCultoChange(tipoNome: string): void {
    const nomeAtual = this.form.get('nome')?.value;
    if (!nomeAtual) {
      this.form.patchValue({ nome: tipoNome });
    }
    const tipo = this.tiposCulto.find(t => t.nome === tipoNome);
    if (tipo) {
      this.form.patchValue({
        horario: tipo.horario,
        horarioFim: tipo.horarioFim ?? '',
      });
    }
  }

  filtrarMusicas(): void {
    this.buscaSubject.next(this.buscaMusica);
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

    if (this.modoEdicao && this.repertorioId) {
      this.api.updateRepertorio(this.repertorioId, payload).subscribe({
        next: (res) => {
          if (res.sucesso) {
            this.submitSuccess = true;
            setTimeout(() => this.router.navigate(['/repertorios', this.repertorioId]), 1500);
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
    } else {
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
  }

  onCancel(): void {
    if (this.modoEdicao && this.repertorioId) {
      this.router.navigate(['/repertorios', this.repertorioId]);
    } else {
      this.router.navigate(['/repertorios']);
    }
  }
}
