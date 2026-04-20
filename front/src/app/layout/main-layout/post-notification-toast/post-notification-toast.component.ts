import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificacaoService, NovasNotificacoesEvento } from '../../../services/notificacao.service';
import { Notificacao, TipoNotificacao } from '../../../models';

interface ToastData {
  titulo: string;
  mensagem: string;
  link: string;
}

/** Tipos de notificação cujo referenciaId aponta para um repertório. */
const TIPOS_REPERTORIO: TipoNotificacao[] = [
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

function getLinkNotificacao(notif: Notificacao): string {
  if (!notif.referenciaId) return '/notificacoes';
  if (notif.tipo === 'confirmacao_pendente') return `/repertorios/${notif.referenciaId}`;
  if (notif.tipo === 'musico_confirmou') return `/repertorios/${notif.referenciaId}/confirmacoes`;
  if (TIPOS_REPERTORIO.includes(notif.tipo)) return `/repertorios/${notif.referenciaId}`;
  return '/notificacoes';
}

@Component({
  selector: 'app-post-notification-toast',
  imports: [],
  templateUrl: './post-notification-toast.component.html',
  styleUrl: './post-notification-toast.component.scss',
})
export class PostNotificationToastComponent implements OnInit, OnDestroy {
  visivel = signal(false);
  animado = signal(false);
  toast = signal<ToastData | null>(null);

  private link = '/notificacoes';
  private dismissTimer: ReturnType<typeof setTimeout> | null = null;
  private subs = new Subscription();

  constructor(
    private notificacaoService: NotificacaoService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.subs.add(
      this.notificacaoService.novasNotificacoes$.subscribe((evento) =>
        this.exibir(evento),
      ),
    );
  }

  ngOnDestroy(): void {
    this._limparTimer();
    this.subs.unsubscribe();
  }

  navegar(): void {
    this.router.navigate([this.link]);
    this.dispensar();
  }

  dispensar(event?: MouseEvent): void {
    event?.stopPropagation();
    this._limparTimer();
    this.animado.set(false);
    setTimeout(() => this.visivel.set(false), 320);
  }

  private exibir(evento: NovasNotificacoesEvento): void {
    this._limparTimer();
    this.animado.set(false);

    const { notificacoes, count, isInicial } = evento;

    if (notificacoes.length === 1) {
      // Detalhes da notificação única
      const n = notificacoes[0];
      this.link = getLinkNotificacao(n);
      this.toast.set({ titulo: n.titulo, mensagem: n.mensagem, link: this.link });
    } else {
      // Genérico: múltiplas ou fallback
      const total = count;
      const label = isInicial ? 'não lidas' : 'novas';
      this.link = '/notificacoes';
      this.toast.set({
        titulo: 'Notificações',
        mensagem: `Você tem ${total} notificaç${total === 1 ? 'ão' : 'ões'} ${label}`,
        link: '/notificacoes',
      });
    }

    this.visivel.set(true);
    // Ativa a animação de entrada no próximo frame
    requestAnimationFrame(() => this.animado.set(true));

    // Auto-dismiss após 6s
    this.dismissTimer = setTimeout(() => this.dispensar(), 6000);
  }

  private _limparTimer(): void {
    if (this.dismissTimer !== null) {
      clearTimeout(this.dismissTimer);
      this.dismissTimer = null;
    }
  }
}
