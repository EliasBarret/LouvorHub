import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { LoginComponent } from './pages/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { RepertoriosComponent } from './pages/repertorios/repertorios.component';
import { RepertorioDetailComponent } from './pages/repertorio-detail/repertorio-detail.component';
import { NotificacoesComponent } from './pages/notificacoes/notificacoes.component';
import { MeuPerfilComponent } from './pages/meu-perfil/meu-perfil.component';
import { CadastroMusicaComponent } from './pages/cadastro-musica/cadastro-musica.component';
import { CadastroRepertorioComponent } from './pages/cadastro-repertorio/cadastro-repertorio.component';
import { StatusConfirmacoesComponent } from './pages/status-confirmacoes/status-confirmacoes.component';
import { AprovacoesComponent } from './pages/aprovacoes/aprovacoes.component';
import { GestaoIgrejasComponent } from './pages/gestao-igrejas/gestao-igrejas.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
      { path: 'inicio', component: HomeComponent },
      { path: 'repertorios', component: RepertoriosComponent },
      { path: 'repertorios/novo', component: CadastroRepertorioComponent },
      { path: 'repertorios/:id', component: RepertorioDetailComponent },
      { path: 'repertorios/:id/confirmacoes', component: StatusConfirmacoesComponent },
      { path: 'musicas/nova', component: CadastroMusicaComponent },
      { path: 'notificacoes', component: NotificacoesComponent },
      { path: 'aprovacoes', component: AprovacoesComponent },
      { path: 'igrejas', component: GestaoIgrejasComponent },
      { path: 'meu-perfil', component: MeuPerfilComponent },
    ]
  },
  { path: '**', redirectTo: 'login' }
];

