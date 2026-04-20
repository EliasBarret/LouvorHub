import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { RouterOutlet } from '@angular/router';
import { NotificacaoService } from '../../services/notificacao.service';
import { PostNotificationToastComponent } from './post-notification-toast/post-notification-toast.component';

@Component({
  selector: 'app-main-layout',
  imports: [SidebarComponent, TopbarComponent, RouterOutlet, PostNotificationToastComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  sidebarOpen = signal(false);

  constructor(private notificacaoService: NotificacaoService) {}

  ngOnInit(): void {
    this.notificacaoService.iniciarPolling();
  }

  ngOnDestroy(): void {
    this.notificacaoService.pararPolling();
  }

  toggleSidebar() {
    this.sidebarOpen.update(v => !v);
  }

  closeSidebar() {
    this.sidebarOpen.set(false);
  }
}
