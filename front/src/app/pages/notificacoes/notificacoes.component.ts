import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NotificacaoService } from '../../services/notificacao.service';
import { Notificacao, TipoNotificacao } from '../../models';

@Component({
  selector: 'app-notificacoes',
  imports: [CommonModule, DatePipe, RouterModule],
  templateUrl: './notificacoes.component.html',
  styleUrl: './notificacoes.component.scss',
})
export class NotificacoesComponent implements OnInit {
  notificacoes = signal<Notificacao[]>([]);
  carregando = signal(true);
  erro = signal<string | null>(null);

  unreadCount = computed(() => this.notificacoes().filter((n) => !n.lida).length);

  constructor(
    private notificacaoService: NotificacaoService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.notificacaoService.getNotificacoes(0, 50).subscribe({
      next: (res) => {
        const lista = res.data?.conteudo ?? [];
        this.notificacoes.set(lista);
        this.carregando.set(false);
        // Sincroniza o contador do topbar com a realidade da lista
        const naoLidas = lista.filter((n) => !n.lida).length;
        this.notificacaoService.atualizarContadorLocal(naoLidas);
      },
      error: () => {
        this.erro.set('Não foi possível carregar as notificações.');
        this.carregando.set(false);
      },
    });
  }

  /** Tipos de notificação cujo referenciaId aponta para um repertório. */
  private readonly TIPOS_REPERTORIO: TipoNotificacao[] = [
    'escalacao',
    'lembrete_culto',
    'lembrete_culto_hora',
    'repertorio_alterado',
    'repertorio_aprovado',
    'repertorio_reprovado',
    'repertorio_pendente_aprovacao',
    'confirmacao_pendente',
    'musico_confirmou',
  ];

  getLink(notif: Notificacao): string | null {
    if (!notif.referenciaId) return null;

    // Músico confirmando se conhece as músicas → detalhe do repertório
    if (notif.tipo === 'confirmacao_pendente') {
      return `/repertorios/${notif.referenciaId}`;
    }

    // Ministro/pastor vendo quem confirmou → tela de status de confirmações
    if (notif.tipo === 'musico_confirmou') {
      return `/repertorios/${notif.referenciaId}/confirmacoes`;
    }

    // Demais notificações de repertório → detalhe do repertório
    if (this.TIPOS_REPERTORIO.includes(notif.tipo)) {
      return `/repertorios/${notif.referenciaId}`;
    }

    return null;
  }

  clicar(notif: Notificacao): void {
    const link = this.getLink(notif);
    const marcar$ = notif.lida
      ? null
      : this.notificacaoService.marcarComoLida(notif.id);

    if (marcar$) {
      marcar$.subscribe({
        next: () => {
          this.notificacoes.update((lista) =>
            lista.map((n) => (n.id === notif.id ? { ...n, lida: true } : n)),
          );
          if (link) this.router.navigateByUrl(link);
        },
      });
    } else if (link) {
      this.router.navigateByUrl(link);
    }
  }

  marcarLida(notif: Notificacao): void {
    if (notif.lida) return;
    this.notificacaoService.marcarComoLida(notif.id).subscribe({
      next: () => {
        this.notificacoes.update((lista) =>
          lista.map((n) => (n.id === notif.id ? { ...n, lida: true } : n)),
        );
      },
    });
  }

  marcarTodasLidas(): void {
    this.notificacaoService.marcarTodasComoLidas().subscribe({
      next: () => {
        this.notificacoes.update((lista) => lista.map((n) => ({ ...n, lida: true })));
      },
    });
  }

  getIcon(tipo: TipoNotificacao): string {
    const icons: Record<TipoNotificacao, string> = {
      escalacao: 'event',
      confirmacao: 'check_circle',
      confirmacao_pendente: 'pending_actions',
      musico_confirmou: 'how_to_reg',
      aviso: 'campaign',
      sistema: 'info',
      lembrete_culto: 'event_available',
      lembrete_culto_hora: 'alarm',
      repertorio_alterado: 'edit_note',
      repertorio_aprovado: 'verified',
      repertorio_reprovado: 'cancel',
      repertorio_pendente_aprovacao: 'rate_review',
    };
    return icons[tipo] ?? 'notifications';
  }

  getIconColor(tipo: TipoNotificacao): string {
    const colors: Partial<Record<TipoNotificacao, string>> = {
      escalacao: 'primary',
      repertorio_aprovado: 'success',
      repertorio_reprovado: 'danger',
      repertorio_pendente_aprovacao: 'warning',
      lembrete_culto: 'warning',
      lembrete_culto_hora: 'danger',
      confirmacao_pendente: 'warning',
      musico_confirmou: 'info',
      repertorio_alterado: 'info',
    };
    return colors[tipo] ?? 'default';
  }
}
