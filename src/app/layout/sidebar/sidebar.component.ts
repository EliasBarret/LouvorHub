import { Component, OnInit, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MockApiService } from '../../services/mock-api.service';
import { Usuario } from '../../models';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
  isOpen = input(false);
  closed = output<void>();

  navItems = [
    { label: 'Início', icon: 'home', route: '/inicio' },
    { label: 'Repertórios', icon: 'calendar_today', route: '/repertorios' },
    { label: 'Notificações', icon: 'notifications_none', route: '/notificacoes' },
    { label: 'Meu Perfil', icon: 'settings', route: '/meu-perfil' },
  ];

  usuario: Usuario | null = null;

  constructor(private api: MockApiService) {}

  ngOnInit(): void {
    this.api.getUsuarioLogado().subscribe(res => {
      this.usuario = res.data;
    });
  }
}
