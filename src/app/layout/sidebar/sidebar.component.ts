import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  navItems = [
    { label: 'Início', icon: 'home', route: '/inicio' },
    { label: 'Repertórios', icon: 'calendar_today', route: '/repertorios' },
    { label: 'Notificações', icon: 'notifications_none', route: '/notificacoes' },
    { label: 'Meu Perfil', icon: 'settings', route: '/meu-perfil' },
  ];

  user = {
    name: 'Elias Barreto',
    email: 'eliaspensador@gmail.com',
    initials: 'E'
  };
}
