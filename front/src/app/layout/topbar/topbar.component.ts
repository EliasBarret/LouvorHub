import { Component, OnDestroy, OnInit, output, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Subscription, timer, switchMap } from 'rxjs';
import { ThemeService } from '../../services/theme.service';
import { NotificacaoService } from '../../services/notificacao.service';

/** Intervalo de polling para novas notificações (30 segundos). */
const POLLING_INTERVAL_MS = 30_000;

@Component({
  selector: 'app-topbar',
  imports: [RouterModule],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss',
})
export class TopbarComponent implements OnInit, OnDestroy {
  notificationCount = signal(0);
  toggleSidebar = output<void>();

  private subs = new Subscription();

  constructor(
    public themeService: ThemeService,
    private notificacaoService: NotificacaoService,
  ) {}

  ngOnInit(): void {
    // Reflete qualquer mudança no BehaviorSubject (ex.: usuário marcou como lida)
    this.subs.add(
      this.notificacaoService.naoLidas$.subscribe(
        (count) => this.notificationCount.set(count),
      ),
    );

    // Polling automático: dispara imediatamente e repete a cada 30s
    this.subs.add(
      timer(0, POLLING_INTERVAL_MS)
        .pipe(switchMap(() => this.notificacaoService.getContadorNaoLidas()))
        .subscribe({ error: () => {} }),
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }
}
