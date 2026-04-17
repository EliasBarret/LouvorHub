import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MockApiService } from '../../services/mock-api.service';
import { Repertorio, Tag } from '../../models';

@Component({
  selector: 'app-repertorios',
  imports: [CommonModule, FormsModule],
  templateUrl: './repertorios.component.html',
  styleUrl: './repertorios.component.scss',
})
export class RepertoriosComponent implements OnInit {
  searchQuery = '';
  activeTab: 'proximos' | 'passados' = 'proximos';
  tags: Tag[] = [];
  participacoesMap = new Map<number, number>();

  repertorios: Repertorio[] = [];
  isLoading = true;

  private readonly MESES = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];

  constructor(
    private api: MockApiService,
    private router: Router,
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
    this.router.navigate(['/repertorios', rep.id]);
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

