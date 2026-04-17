import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { HomeComponent } from './pages/home/home.component';
import { RepertoriosComponent } from './pages/repertorios/repertorios.component';
import { NotificacoesComponent } from './pages/notificacoes/notificacoes.component';
import { MeuPerfilComponent } from './pages/meu-perfil/meu-perfil.component';
import { CadastroMusicaComponent } from './pages/cadastro-musica/cadastro-musica.component';
import { CadastroRepertorioComponent } from './pages/cadastro-repertorio/cadastro-repertorio.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
      { path: 'inicio', component: HomeComponent },
      { path: 'repertorios', component: RepertoriosComponent },
      { path: 'repertorios/novo', component: CadastroRepertorioComponent },
      { path: 'musicas/nova', component: CadastroMusicaComponent },
      { path: 'notificacoes', component: NotificacoesComponent },
      { path: 'meu-perfil', component: MeuPerfilComponent },
    ]
  },
  { path: '**', redirectTo: 'inicio' }
];
