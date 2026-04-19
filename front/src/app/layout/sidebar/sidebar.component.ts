import { Component, OnInit, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MockApiService } from '../../services/mock-api.service';
import { AuthService } from '../../services/auth.service';
import { Perfil, Usuario } from '../../models';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  perfisPermitidos?: Perfil[];
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
  isOpen = input(false);
  closed = output<void>();

  private readonly allNavItems: NavItem[] = [
    { label: 'Início',       icon: 'home',               route: '/inicio' },
    { label: 'Repertórios',  icon: 'queue_music',        route: '/repertorios' },
    { label: 'Aprovações',   icon: 'approval',           route: '/aprovacoes',   perfisPermitidos: ['ADM', 'Pastor'] },
    { label: 'Igrejas',      icon: 'church',             route: '/igrejas',      perfisPermitidos: ['ADM'] },
    { label: 'Notificações', icon: 'notifications_none', route: '/notificacoes' },
    { label: 'Meu Perfil',   icon: 'person_outline',     route: '/meu-perfil' },
  ];

  usuario: Usuario | null = null;

  constructor(private api: MockApiService, private authService: AuthService) {}

  ngOnInit(): void {
    this.api.getUsuarioLogado().subscribe(res => {
      this.usuario = res.data;
    });
  }

  get navItems(): NavItem[] {
    return this.allNavItems.filter(item =>
      !item.perfisPermitidos ||
      (this.usuario?.perfil && item.perfisPermitidos.includes(this.usuario.perfil))
    );
  }

  get perfilLabel(): string {
    const labels: Record<Perfil, string> = {
      ADM: 'Administrador',
      Pastor: 'Pastor',
      Ministro: 'Ministro de Louvor',
      Musico: 'Músico',
      Cantor: 'Cantor(a)',
    };
    return this.usuario?.perfil ? (labels[this.usuario.perfil] ?? this.usuario.funcao) : (this.usuario?.funcao ?? '');
  }

  logout(): void {
    this.authService.logout();
  }
}
