import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MockApiService } from '../../services/mock-api.service';
import { Musica, Repertorio, Tag } from '../../models';

@Component({
  selector: 'app-repertorios',
  imports: [CommonModule, FormsModule],
  templateUrl: './repertorios.component.html',
  styleUrl: './repertorios.component.scss',
})
export class RepertoriosComponent implements OnInit {
  searchQuery = '';
  activeTab: 'repertorios' | 'musicas' = 'repertorios';
  selectedRepertorio: Repertorio | null = null;
  tags: Tag[] = [];

  repertorios: Repertorio[] = [];
  allMusicas: Musica[] = [];
  isLoading = true;

  constructor(private api: MockApiService, private router: Router) {}

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.api.getTags().subscribe(res => {
      this.tags = res.data;
    });

    this.api.getRepertorios().subscribe(res => {
      this.repertorios = res.data.conteudo;
      this.isLoading = false;
    });

    this.api.getMusicas().subscribe(res => {
      this.allMusicas = res.data.conteudo;
    });
  }

  get filteredRepertorios(): Repertorio[] {
    if (!this.searchQuery) return this.repertorios;
    const query = this.searchQuery.toLowerCase();
    return this.repertorios.filter(r =>
      r.nome.toLowerCase().includes(query)
    );
  }

  get filteredMusicas(): Musica[] {
    if (!this.searchQuery) return this.allMusicas;
    const query = this.searchQuery.toLowerCase();
    return this.allMusicas.filter(m =>
      m.titulo.toLowerCase().includes(query) ||
      m.artista.toLowerCase().includes(query)
    );
  }

  setTab(tab: 'repertorios' | 'musicas'): void {
    this.activeTab = tab;
    this.selectedRepertorio = null;
    this.searchQuery = '';
  }

  openRepertorio(rep: Repertorio): void {
    this.api.getRepertorioById(rep.id).subscribe(res => {
      this.selectedRepertorio = res.data;
    });
  }

  closeRepertorio(): void {
    this.selectedRepertorio = null;
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
    };
    return labels[status] ?? status;
  }

  getTagCor(tagNome: string): string {
    return this.tags.find(t => t.nome === tagNome)?.cor ?? '#6B7280';
  }
}
