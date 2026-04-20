import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TomDisplayPipe } from '../../pipes/tom-display.pipe';
import { Router, ActivatedRoute } from '@angular/router';
import { MockApiService } from '../../services/mock-api.service';
import { EscalacaoService } from '../../services/escalacao.service';
import { DetalheEscalacao, Repertorio, Tag, Usuario } from '../../models';

@Component({
  selector: 'app-repertorio-detail',
  imports: [CommonModule, TomDisplayPipe],
  templateUrl: './repertorio-detail.component.html',
  styleUrl: './repertorio-detail.component.scss',
})
export class RepertorioDetailComponent implements OnInit {
  repertorio: Repertorio | null = null;
  detalheEscalacao: DetalheEscalacao | null = null;
  confirmandoMap = new Map<number, boolean>();
  tags: Tag[] = [];
  usuarioLogado: Usuario | null = null;
  isLoading = true;
  escalacaoRecolhido = false;
  openMenuMusicaId: number | null = null;

  @HostListener('document:click')
  onDocumentClick(): void {
    this.openMenuMusicaId = null;
  }

  toggleMusicMenu(id: number, event: MouseEvent): void {
    event.stopPropagation();
    this.openMenuMusicaId = this.openMenuMusicaId === id ? null : id;
  }

  constructor(
    private api: MockApiService,
    private escalacaoService: EscalacaoService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.api.getUsuarioLogado().subscribe(res => {
      this.usuarioLogado = res.data;
    });

    this.api.getTags().subscribe(res => {
      this.tags = res.data;
    });

    this.api.getRepertorioById(id).subscribe(res => {
      this.repertorio = res.data;
      this.isLoading = false;

      this.escalacaoService.getDetalheEscalacao(id).subscribe(det => {
        if (det.sucesso) {
          this.detalheEscalacao = det.data;
        }
      });
    });
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
        const atualizadas = this.detalheEscalacao.musicasComConfirmacao.map(mc =>
          mc.musica.id === musicaId ? { ...mc, confirmacao: status } : mc,
        );
        this.detalheEscalacao = {
          ...this.detalheEscalacao,
          musicasComConfirmacao: atualizadas,
        };
      }
    });
  }

  todasMusicasConfirmadas(): boolean {
    return !!this.detalheEscalacao?.musicasComConfirmacao.every(mc => mc.confirmacao !== 'pendente');
  }

  toggleEscalacaoCard(): void {
    if (!this.escalacaoRecolhido && !this.todasMusicasConfirmadas()) return;
    this.escalacaoRecolhido = !this.escalacaoRecolhido;
  }

  goBack(): void {
    this.router.navigate(['/repertorios']);
  }

  goToEditarMusica(musicaId: number): void {
    this.router.navigate(['/musicas', musicaId, 'editar']);
  }

  goToNovaMusica(): void {
    this.router.navigate(['/musicas/nova']);
  }

  goToEditar(): void {
    if (!this.repertorio) return;
    this.router.navigate(['/repertorios', this.repertorio.id, 'editar']);
  }

  podeEditar(): boolean {
    const perfil = this.usuarioLogado?.perfil;
    return perfil === 'ADM' || perfil === 'Pastor' || perfil === 'Ministro';
  }

  goToConfirmacoes(): void {
    if (!this.repertorio) return;
    this.router.navigate(['/repertorios', this.repertorio.id, 'confirmacoes']);
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      aguardando_aprovacao: 'Aguardando Aprovação',
      aprovado: 'Aprovado',
      reprovado: 'Reprovado',
    };
    return labels[status] ?? status;
  }

  getTagCor(tagNome: string): string {
    return this.tags.find(t => t.nome === tagNome)?.cor ?? '#6B7280';
  }
}
