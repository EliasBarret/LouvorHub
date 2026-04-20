import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MockApiService } from '../../services/mock-api.service';
import { Musica } from '../../models';

interface LetraGroup {
  letra: string;
  musicas: Musica[];
}

@Component({
  selector: 'app-musicas',
  imports: [CommonModule, FormsModule],
  templateUrl: './musicas.component.html',
  styleUrl: './musicas.component.scss',
})
export class MusicasComponent implements OnInit {
  isLoading = true;
  busca = '';
  todasMusicas: Musica[] = [];
  grupos: LetraGroup[] = [];

  constructor(private api: MockApiService, private router: Router) {}

  ngOnInit(): void {
    this.api.buscarMusicas('').subscribe({
      next: (res) => {
        this.todasMusicas = res.data.sort((a, b) =>
          a.titulo.localeCompare(b.titulo, 'pt', { sensitivity: 'base' })
        );
        this.agrupar();
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; },
    });
  }

  onBusca(): void {
    const termo = this.busca.trim().toLowerCase();
    const filtradas = this.todasMusicas.filter(m =>
      m.titulo.toLowerCase().includes(termo) ||
      m.artista.toLowerCase().includes(termo)
    );
    this.agrupar(filtradas);
  }

  private agrupar(musicas: Musica[] = this.todasMusicas): void {
    const map = new Map<string, Musica[]>();
    for (const m of musicas) {
      const letra = m.titulo[0]?.toUpperCase() ?? '#';
      if (!map.has(letra)) map.set(letra, []);
      map.get(letra)!.push(m);
    }
    this.grupos = Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([letra, ms]) => ({ letra, musicas: ms }));
  }

  editarMusica(id: number): void {
    this.router.navigate(['/musicas', id, 'editar']);
  }

  novaMusica(): void {
    this.router.navigate(['/musicas/nova']);
  }
}
