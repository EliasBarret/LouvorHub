import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { TomDisplayPipe } from '../../pipes/tom-display.pipe';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { MockApiService } from '../../services/mock-api.service';
import { IgrejaService } from '../../services/igreja.service';
import { TiposCultoService } from '../../services/tipos-culto.service';
import { Musica, Tag, Igreja, MembroIgreja, Repertorio, TipoCulto } from '../../models';

export const BLOCOS_PREDEFINIDOS = [
  'Abertura',
  'Adorações',
  'Ofertório',
  'Solo',
  'Apelo',
  'Pós Ceia',
  'Distribuição dos Elementos',
  'EBD',
  'Pré-culto',
  'Encerramento',
];

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

export interface BlocoMusicaItem {
  musica: Musica;
  tomOverride: string;
  assignment: MusicaAssignment;
}

export interface Bloco {
  id: string;
  nome: string;
  descricao: string;
  musicas: BlocoMusicaItem[];
  buscaMusica: string;
  musicasBuscadas: Musica[];
  isLoadingMusicas: boolean;
  showBuscaPanel: boolean;
}

@Component({
  selector: 'app-cadastro-repertorio',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TomDisplayPipe],
  templateUrl: './cadastro-repertorio.component.html',
  styleUrl: './cadastro-repertorio.component.scss',
})
export class CadastroRepertorioComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  tiposCulto: TipoCulto[] = [];
  tags: Tag[] = [];
  minhasIgrejas: Igreja[] = [];
  membrosIgreja: MembroIgreja[] = [];

  blocos: Bloco[] = [];
  blocosPredefinidos = BLOCOS_PREDEFINIDOS;

  private buscaSubjects = new Map<string, Subject<string>>();
  private buscaSubs: Subscription[] = [];

  isSubmitting = false;
  submitError = '';
  submitSuccess = false;
  isLoadingMembros = false;

  modoEdicao = false;
  repertorioId: number | null = null;
  repertorioOriginal: Repertorio | null = null;
  isLoadingRepertorio = false;

  novoNomeBloco = '';
  showAddBloco = false;

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

  private buildForm(): void {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      dataCulto: ['', Validators.required],
      tipoCulto: ['', Validators.required],
      igrejaId: [null, Validators.required],
      horario: [''],
      horarioFim: [''],
      localCulto: [''],
      aviso: [''],
    });

    this.form.get('igrejaId')?.valueChanges.subscribe(igrejaId => {
      if (igrejaId) this.loadMembros(Number(igrejaId));
    });
  }

  private loadMetadata(): void {
    this.tiposCultoService.getAll().subscribe(res => { this.tiposCulto = res.data; });
    this.api.getTags().subscribe(res => { this.tags = res.data; });
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
        this.blocos.forEach(b => b.musicas.forEach(bm => {
          bm.assignment.membrosBuscadosCantores = this.filtrarMembros(bm.assignment.searchCantor, bm.assignment.cantores.map(c => c.usuarioId));
          bm.assignment.membrosBuscadosMusicos = this.filtrarMembros(bm.assignment.searchMusico, bm.assignment.musicos.map(m => m.membro.usuarioId));
        }));
      },
      error: () => { this.isLoadingMembros = false; },
    });
  }

  private preencherFormulario(rep: Repertorio): void {
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

    if (rep.blocos?.length) {
      this.blocos = rep.blocos.map(b => {
        const bloco = this.criarBlocoVazio(b.nome);
        bloco.descricao = b.descricao ?? '';
        bloco.musicas = b.musicas.map(mr => ({
          musica: mr,
          tomOverride: mr.tomOverride ?? mr.tom,
          assignment: {
            cantores: mr.cantores.map(c => this.toMembro(c, rep.igrejaId)),
            musicos: mr.musicos.map(mu => ({ membro: this.toMembro(mu, rep.igrejaId), instrumento: mu.instrumento })),
            searchCantor: '', searchMusico: '', instrumentoInput: '', showAssignment: false,
            membrosBuscadosCantores: [...this.membrosIgreja],
            membrosBuscadosMusicos: [...this.membrosIgreja],
          },
        }));
        return bloco;
      });
    } else if (rep.musicas?.length) {
      const bloco = this.criarBlocoVazio('Músicas');
      bloco.musicas = rep.musicas.map(mr => ({
        musica: mr,
        tomOverride: mr.tomOverride ?? mr.tom,
        assignment: {
          cantores: mr.cantores.map(c => this.toMembro(c, rep.igrejaId)),
          musicos: mr.musicos.map(mu => ({ membro: this.toMembro(mu, rep.igrejaId), instrumento: mu.instrumento })),
          searchCantor: '', searchMusico: '', instrumentoInput: '', showAssignment: false,
          membrosBuscadosCantores: [...this.membrosIgreja],
          membrosBuscadosMusicos: [...this.membrosIgreja],
        },
      }));
      this.blocos = [bloco];
    }
  }

  private brToIso(date: string): string {
    if (!date || !date.includes('/')) return date;
    const [d, m, y] = date.split('/');
    return `${y}-${m}-${d}`;
  }

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
        funcao: '', ministerio: '', avatar: null,
        perfil: item.perfil,
        instrumentos: item.instrumentos ?? [],
      },
    };
  }

  get f() { return this.form.controls; }

  onTipoCultoChange(tipoNome: string): void {
    const nomeAtual = this.form.get('nome')?.value;
    if (!nomeAtual) this.form.patchValue({ nome: tipoNome });
    const tipo = this.tiposCulto.find(t => t.nome === tipoNome);
    if (tipo) this.form.patchValue({ horario: tipo.horario, horarioFim: tipo.horarioFim ?? '' });
  }

  // ─── Blocos ───────────────────────────────────────────────────────────────

  private gerarId(): string {
    return Math.random().toString(36).slice(2, 10);
  }

  private criarBlocoVazio(nome: string): Bloco {
    const id = this.gerarId();
    const subject = new Subject<string>();
    this.buscaSubjects.set(id, subject);
    const sub = subject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => {
        const b = this.blocos.find(bl => bl.id === id);
        if (b) b.isLoadingMusicas = true;
        return this.api.buscarMusicas(q);
      }),
    ).subscribe(res => {
      const b = this.blocos.find(bl => bl.id === id);
      if (b) {
        const jaAdicionados = new Set(this.todasMusicasIds());
        b.musicasBuscadas = res.data.filter(m => !jaAdicionados.has(m.id));
        b.isLoadingMusicas = false;
      }
    });
    this.buscaSubs.push(sub);
    return { id, nome, descricao: '', musicas: [], buscaMusica: '', musicasBuscadas: [], isLoadingMusicas: false, showBuscaPanel: false };
  }

  adicionarBloco(nome?: string): void {
    const nomeBloco = nome ?? this.novoNomeBloco.trim();
    if (!nomeBloco) return;
    this.blocos = [...this.blocos, this.criarBlocoVazio(nomeBloco)];
    this.novoNomeBloco = '';
    this.showAddBloco = false;
  }

  removerBloco(blocoId: string): void {
    this.blocos = this.blocos.filter(b => b.id !== blocoId);
    const subj = this.buscaSubjects.get(blocoId);
    if (subj) { subj.complete(); this.buscaSubjects.delete(blocoId); }
  }

  moverBloco(index: number, direction: 'up' | 'down'): void {
    const list = [...this.blocos];
    const t = direction === 'up' ? index - 1 : index + 1;
    if (t < 0 || t >= list.length) return;
    [list[index], list[t]] = [list[t], list[index]];
    this.blocos = list;
  }

  private todasMusicasIds(): number[] {
    return this.blocos.flatMap(b => b.musicas.map(bm => bm.musica.id));
  }

  filtrarMusicasBloco(bloco: Bloco): void {
    const subject = this.buscaSubjects.get(bloco.id);
    if (subject) subject.next(bloco.buscaMusica);
    bloco.showBuscaPanel = bloco.buscaMusica.length > 0;
  }

  adicionarMusicaAoBloco(bloco: Bloco, musica: Musica): void {
    if (bloco.musicas.some(bm => bm.musica.id === musica.id)) return;
    bloco.musicas = [
      ...bloco.musicas,
      {
        musica,
        tomOverride: musica.tom,
        assignment: {
          cantores: [], musicos: [], searchCantor: '', searchMusico: '',
          instrumentoInput: '', showAssignment: false,
          membrosBuscadosCantores: [...this.membrosIgreja],
          membrosBuscadosMusicos: [...this.membrosIgreja],
        },
      },
    ];
    bloco.buscaMusica = '';
    bloco.musicasBuscadas = [];
    bloco.showBuscaPanel = false;
  }

  removerMusicaDoBloco(bloco: Bloco, musicaId: number): void {
    bloco.musicas = bloco.musicas.filter(bm => bm.musica.id !== musicaId);
  }

  moverMusicaNoBloco(bloco: Bloco, index: number, direction: 'up' | 'down'): void {
    const list = [...bloco.musicas];
    const t = direction === 'up' ? index - 1 : index + 1;
    if (t < 0 || t >= list.length) return;
    [list[index], list[t]] = [list[t], list[index]];
    bloco.musicas = list;
  }

  toggleAssignment(bm: BlocoMusicaItem): void {
    bm.assignment.showAssignment = !bm.assignment.showAssignment;
  }

  // ─── Cantores ─────────────────────────────────────────────────────────────

  onSearchCantorInput(bm: BlocoMusicaItem, query: string): void {
    bm.assignment.searchCantor = query;
    bm.assignment.membrosBuscadosCantores = this.filtrarMembros(query, bm.assignment.cantores.map(c => c.usuarioId));
  }

  adicionarCantor(bm: BlocoMusicaItem, membro: MembroIgreja): void {
    if (bm.assignment.cantores.some(c => c.usuarioId === membro.usuarioId)) return;
    bm.assignment.cantores = [...bm.assignment.cantores, membro];
    bm.assignment.searchCantor = '';
    bm.assignment.membrosBuscadosCantores = this.filtrarMembros('', bm.assignment.cantores.map(c => c.usuarioId));
  }

  removerCantor(bm: BlocoMusicaItem, usuarioId: number): void {
    bm.assignment.cantores = bm.assignment.cantores.filter(c => c.usuarioId !== usuarioId);
    bm.assignment.membrosBuscadosCantores = this.filtrarMembros(bm.assignment.searchCantor, bm.assignment.cantores.map(c => c.usuarioId));
  }

  // ─── Músicos ──────────────────────────────────────────────────────────────

  onSearchMusicoInput(bm: BlocoMusicaItem, query: string): void {
    bm.assignment.searchMusico = query;
    bm.assignment.membrosBuscadosMusicos = this.filtrarMembros(query, bm.assignment.musicos.map(m => m.membro.usuarioId));
  }

  adicionarMusico(bm: BlocoMusicaItem, membro: MembroIgreja): void {
    if (bm.assignment.musicos.some(m => m.membro.usuarioId === membro.usuarioId)) return;
    const instrumento = membro.usuario?.instrumentos?.[0] ?? '';
    bm.assignment.musicos = [...bm.assignment.musicos, { membro, instrumento }];
    bm.assignment.searchMusico = '';
    bm.assignment.membrosBuscadosMusicos = this.filtrarMembros('', bm.assignment.musicos.map(m => m.membro.usuarioId));
  }

  removerMusico(bm: BlocoMusicaItem, usuarioId: number): void {
    bm.assignment.musicos = bm.assignment.musicos.filter(m => m.membro.usuarioId !== usuarioId);
    bm.assignment.membrosBuscadosMusicos = this.filtrarMembros(bm.assignment.searchMusico, bm.assignment.musicos.map(m => m.membro.usuarioId));
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private filtrarMembros(query: string, excluirIds: number[]): MembroIgreja[] {
    const q = query.toLowerCase().trim();
    return this.membrosIgreja.filter(m =>
      !excluirIds.includes(m.usuarioId) &&
      (q === '' || (m.usuario?.nome ?? '').toLowerCase().includes(q))
    );
  }

  getTagCor(tagNome: string): string {
    return this.tags.find(t => t.nome === tagNome)?.cor ?? '#6B7280';
  }

  getTotalEscalados(bm: BlocoMusicaItem): number {
    return bm.assignment.cantores.length + bm.assignment.musicos.length;
  }

  getNomeUsuario(membro: MembroIgreja): string {
    return membro.usuario?.nome ?? `Usuário #${membro.usuarioId}`;
  }

  getInstrumentos(membro: MembroIgreja): string[] {
    return membro.usuario?.instrumentos ?? [];
  }

  getTotalMusicas(): number {
    return this.blocos.reduce((acc, b) => acc + b.musicas.length, 0);
  }

  // ─── Submit ───────────────────────────────────────────────────────────────

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
      blocos: this.blocos.map(b => ({
        nome: b.nome,
        descricao: b.descricao || undefined,
        musicas: b.musicas.map(bm => ({
          musicaId: bm.musica.id,
          tomOverride: bm.tomOverride !== bm.musica.tom ? bm.tomOverride : undefined,
          cantores: bm.assignment.cantores.map(c => c.usuarioId),
          musicos: bm.assignment.musicos.map(mf => ({ usuarioId: mf.membro.usuarioId, instrumento: mf.instrumento })),
        })),
      })),
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

  ngOnDestroy(): void {
    this.buscaSubs.forEach(s => s.unsubscribe());
    this.buscaSubjects.forEach(s => s.complete());
  }
}
