import { Component, OnInit, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Router } from '@angular/router';
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
    { label: 'Repertórios', icon: 'queue_music', route: '/repertorios' },
    { label: 'Notificações', icon: 'notifications_none', route: '/notificacoes' },
    { label: 'Meu Perfil', icon: 'person_outline', route: '/meu-perfil' },
  ];

  usuario: Usuario | null = null;

  constructor(private api: MockApiService, private router: Router) {}

  ngOnInit(): void {
    this.api.getUsuarioLogado().subscribe(res => {
      this.usuario = res.data;
    });
  }

  logout(): void {
    this.router.navigate(['/login']);
  }
}
