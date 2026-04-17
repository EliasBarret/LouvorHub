import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Musica {
  id: number;
  title: string;
  artist: string;
  tom: string;
  bpm: number;
  tags: string[];
  lastUsed?: string;
}

interface Repertorio {
  id: number;
  name: string;
  date: string;
  musicCount: number;
  status: 'confirmado' | 'pendente' | 'rascunho';
  musicas: Musica[];
}

@Component({
  selector: 'app-repertorios',
  imports: [FormsModule],
  templateUrl: './repertorios.component.html',
  styleUrl: './repertorios.component.scss'
})
export class RepertoriosComponent {
  searchQuery = '';
  activeTab: 'repertorios' | 'musicas' = 'repertorios';
  selectedRepertorio: Repertorio | null = null;

  repertorios: Repertorio[] = [
    {
      id: 1,
      name: 'Culto de Quarta — Oração',
      date: '23/04/2025',
      musicCount: 2,
      status: 'confirmado',
      musicas: [
        { id: 1, title: 'Deus de Promessas', artist: 'Toque no Altar', tom: 'G', bpm: 72, tags: ['Adoração', 'Lenta'] },
        { id: 2, title: 'Lugar Secreto', artist: 'Gabriela Rocha', tom: 'E', bpm: 68, tags: ['Adoração'] },
      ]
    },
    {
      id: 2,
      name: 'Culto de Domingo — Manhã',
      date: '20/04/2025',
      musicCount: 5,
      status: 'confirmado',
      musicas: [
        { id: 3, title: 'Goodness of God', artist: 'Bethel Music', tom: 'A', bpm: 63, tags: ['Adoração', 'Lenta'] },
        { id: 4, title: 'Way Maker', artist: 'Sinach', tom: 'E', bpm: 68, tags: ['Adoração'] },
        { id: 5, title: 'Grande é o Senhor', artist: 'Soraya Moraes', tom: 'D', bpm: 130, tags: ['Celebração'] },
        { id: 6, title: 'Eu Navegarei', artist: 'Ministério Vineyard', tom: 'G', bpm: 120, tags: ['Celebração'] },
        { id: 7, title: 'Meu Respirar', artist: 'Ministério Zoe', tom: 'C', bpm: 76, tags: ['Adoração', 'Lenta'] },
      ]
    },
    {
      id: 3,
      name: 'Culto de Domingo — Noite',
      date: '20/04/2025',
      musicCount: 4,
      status: 'pendente',
      musicas: [
        { id: 8, title: 'Reckless Love', artist: 'Cory Asbury', tom: 'C', bpm: 80, tags: ['Adoração'] },
        { id: 9, title: 'Águas Purificadoras', artist: 'Ministério Zoe', tom: 'E', bpm: 65, tags: ['Adoração', 'Lenta'] },
        { id: 10, title: 'Tua Graça Me Basta', artist: 'Davi Sacer', tom: 'A', bpm: 78, tags: ['Adoração'] },
        { id: 11, title: 'Ninguém Explica Deus', artist: 'Preto no Branco', tom: 'G', bpm: 85, tags: ['Celebração'] },
      ]
    },
    {
      id: 4,
      name: 'Ensaio Semanal',
      date: '18/04/2025',
      musicCount: 6,
      status: 'rascunho',
      musicas: []
    },
  ];

  allMusicas: Musica[] = [
    { id: 1, title: 'Deus de Promessas', artist: 'Toque no Altar', tom: 'G', bpm: 72, tags: ['Adoração', 'Lenta'], lastUsed: '23/04/2025' },
    { id: 2, title: 'Lugar Secreto', artist: 'Gabriela Rocha', tom: 'E', bpm: 68, tags: ['Adoração'], lastUsed: '23/04/2025' },
    { id: 3, title: 'Goodness of God', artist: 'Bethel Music', tom: 'A', bpm: 63, tags: ['Adoração', 'Lenta'], lastUsed: '20/04/2025' },
    { id: 4, title: 'Way Maker', artist: 'Sinach', tom: 'E', bpm: 68, tags: ['Adoração'], lastUsed: '20/04/2025' },
    { id: 5, title: 'Grande é o Senhor', artist: 'Soraya Moraes', tom: 'D', bpm: 130, tags: ['Celebração'], lastUsed: '20/04/2025' },
    { id: 6, title: 'Eu Navegarei', artist: 'Ministério Vineyard', tom: 'G', bpm: 120, tags: ['Celebração'], lastUsed: '20/04/2025' },
    { id: 7, title: 'Meu Respirar', artist: 'Ministério Zoe', tom: 'C', bpm: 76, tags: ['Adoração', 'Lenta'], lastUsed: '20/04/2025' },
    { id: 8, title: 'Reckless Love', artist: 'Cory Asbury', tom: 'C', bpm: 80, tags: ['Adoração'], lastUsed: '20/04/2025' },
    { id: 9, title: 'Águas Purificadoras', artist: 'Ministério Zoe', tom: 'E', bpm: 65, tags: ['Adoração', 'Lenta'], lastUsed: '20/04/2025' },
    { id: 10, title: 'Tua Graça Me Basta', artist: 'Davi Sacer', tom: 'A', bpm: 78, tags: ['Adoração'], lastUsed: '13/04/2025' },
    { id: 11, title: 'Ninguém Explica Deus', artist: 'Preto no Branco', tom: 'G', bpm: 85, tags: ['Celebração'], lastUsed: '13/04/2025' },
    { id: 12, title: 'Oceanos', artist: 'Hillsong United', tom: 'D', bpm: 66, tags: ['Adoração', 'Lenta'], lastUsed: '06/04/2025' },
    { id: 13, title: 'Teu Santo Nome', artist: 'Gabriela Rocha', tom: 'B', bpm: 70, tags: ['Adoração'], lastUsed: '06/04/2025' },
    { id: 14, title: 'Raridade', artist: 'Anderson Freire', tom: 'E', bpm: 75, tags: ['Adoração'] },
    { id: 15, title: 'Ousado Amor', artist: 'Isaías Saad', tom: 'C', bpm: 80, tags: ['Adoração'] },
  ];

  get filteredRepertorios(): Repertorio[] {
    if (!this.searchQuery) return this.repertorios;
    const query = this.searchQuery.toLowerCase();
    return this.repertorios.filter(r =>
      r.name.toLowerCase().includes(query)
    );
  }

  get filteredMusicas(): Musica[] {
    if (!this.searchQuery) return this.allMusicas;
    const query = this.searchQuery.toLowerCase();
    return this.allMusicas.filter(m =>
      m.title.toLowerCase().includes(query) ||
      m.artist.toLowerCase().includes(query)
    );
  }

  setTab(tab: 'repertorios' | 'musicas'): void {
    this.activeTab = tab;
    this.selectedRepertorio = null;
    this.searchQuery = '';
  }

  openRepertorio(rep: Repertorio): void {
    this.selectedRepertorio = rep;
  }

  closeRepertorio(): void {
    this.selectedRepertorio = null;
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      confirmado: 'Confirmado',
      pendente: 'Pendente',
      rascunho: 'Rascunho'
    };
    return labels[status] || status;
  }
}
