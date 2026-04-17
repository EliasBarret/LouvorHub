import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MockApiService } from '../../services/mock-api.service';
import { EscalacaoService } from '../../services/escalacao.service';
import { DetalheEscalacao, MusicaComConfirmacao, Musica, Repertorio, Tag } from '../../models';

@Component({
  selector: 'app-repertorios',
  imports: [CommonModule, FormsModule],
  templateUrl: './repertorios.component.html',
  styleUrl: './repertorios.component.scss',
})
export class RepertoriosComponent implements OnInit {
  searchQuery = '';
  activeTab: 'proximos' | 'passados' = 'proximos';
  selectedRepertorio: Repertorio | null = null;
  detalheEscalacao: DetalheEscalacao | null = null;
  confirmandoMap = new Map<number, boolean>();
  tags: Tag[] = [];
  participacoesMap = new Map<number, number>();

  repertorios: Repertorio[] = [];
  isLoading = true;

  private readonly MESES = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];

  constructor(
    private api: MockApiService,
    private escalacaoService: EscalacaoService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  private parseDatePt(date: string): Date {
    const [day, month, year] = date.split('/').map(Number);
    return new Date(year, month - 1, day);
  }

  private loadData(): void {
    this.participacoesMap = this.api.getParticipacoesPorRepertorio();

    this.api.getTags().subscribe(res => {
      this.tags = res.data;
    });

    this.api.getRepertorios().subscribe(res => {
      this.repertorios = res.data.conteudo;
      this.isLoading = false;

      const idParam = this.route.snapshot.paramMap.get('id');
      if (idParam) {
        const id = Number(idParam);
        this.api.getRepertorioById(id).subscribe(r => {
          this.selectedRepertorio = r.data;
        });
      }
    });
  }

  private get hoje(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  get proximosCount(): number {
    const hoje = this.hoje;
    return this.repertorios.filter(r => this.parseDatePt(r.dataCulto) >= hoje).length;
  }

  get passadosCount(): number {
    const hoje = this.hoje;
    return this.repertorios.filter(r => this.parseDatePt(r.dataCulto) < hoje).length;
  }

  get filteredRepertorios(): Repertorio[] {
    const hoje = this.hoje;
    const list = this.repertorios.filter(r => {
      const data = this.parseDatePt(r.dataCulto);
      return this.activeTab === 'proximos' ? data >= hoje : data < hoje;
    });
    if (!this.searchQuery) return list;
    const query = this.searchQuery.toLowerCase();
    return list.filter(r => r.nome.toLowerCase().includes(query));
  }

  getDateParts(dataCulto: string): { mes: string; dia: number; ano: number } {
    const d = this.parseDatePt(dataCulto);
    return { mes: this.MESES[d.getMonth()], dia: d.getDate(), ano: d.getFullYear() };
  }

  getParticipacoes(repertorioId: number): number {
    return this.participacoesMap.get(repertorioId) ?? 0;
  }

  setTab(tab: 'proximos' | 'passados'): void {
    this.activeTab = tab;
    this.searchQuery = '';
  }

  openRepertorio(rep: Repertorio): void {
    this.api.getRepertorioById(rep.id).subscribe(res => {
      this.selectedRepertorio = res.data;
      this.detalheEscalacao = null;
      this.confirmandoMap.clear();
      this.escalacaoService.getDetalheEscalacao(rep.id).subscribe(det => {
        if (det.sucesso) this.detalheEscalacao = det.data;
      });
    });
  }

  closeRepertorio(): void {
    this.selectedRepertorio = null;
    this.detalheEscalacao = null;
    this.confirmandoMap.clear();
  }

  confirmarMusica(musicaId: number, status: 'conhece' | 'nao_conhece'): void {
    if (!this.detalheEscalacao) return;
    this.confirmandoMap.set(musicaId, true);
    const form = {
      escalacaoMusicoId: this.detalheEscalacao.escalacaoMusico.id,
      musicaId,
      status,
    };
    this.escalacaoService.confirmarMusica(form).subscribe(res => {
      this.confirmandoMap.set(musicaId, false);
      if (res.sucesso && this.detalheEscalacao) {
        this.detalheEscalacao = {
          ...this.detalheEscalacao,
          musicasComConfirmacao: this.detalheEscalacao.musicasComConfirmacao.map(mc =>
            mc.musica.id === musicaId ? { ...mc, confirmacao: status } : mc,
          ),
        };
      }
    });
  }

  goToNovoRepertorio(): void {
    this.router.navigate(['/repertorios/novo']);
  }

  goToNovaMusica(): void {
    this.router.navigate(['/musicas/nova']);
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      confirmado: 'Confirmado',
      pendente: 'Pendente',
      rascunho: 'Rascunho',
      publicado: 'Publicado',
    };
    return labels[status] ?? status;
  }

  getTagCor(tagNome: string): string {
    return this.tags.find(t => t.nome === tagNome)?.cor ?? '#6B7280';
  }
}

