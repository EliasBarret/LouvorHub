import { Component, OnDestroy, OnInit, output, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ThemeService } from '../../services/theme.service';
import { NotificacaoService } from '../../services/notificacao.service';

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
    this.subs.add(
      this.notificacaoService.naoLidas$.subscribe(
        (count) => this.notificationCount.set(count),
      ),
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }
}
