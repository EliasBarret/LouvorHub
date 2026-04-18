import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthData, LoginForm, RegisterForm, Usuario, ApiResponse } from '../models';

const TOKEN_KEY = 'louvorhub_token';
const USER_KEY  = 'louvorhub_user';

function enrichUsuario(u: any): Usuario {
  const partes = ((u.nome as string) ?? '').split(' ').filter(Boolean);
  return {
    id: u.id,
    nome: u.nome,
    primeiroNome: partes[0] ?? u.nome,
    email: u.email,
    iniciais: partes.slice(0, 2).map((p: string) => p[0].toUpperCase()).join(''),
    funcao: u.funcao ?? '',
    ministerio: u.ministerio ?? '',
    avatar: u.avatar ?? null,
    perfil: u.perfil,
    instrumentos: u.instrumentos ?? [],
    dataMembro: u.dataMembro ? (u.dataMembro as string).substring(0, 10) : undefined,
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = environment.apiUrl;

  constructor(private http: HttpClient, private router: Router) {}

  login(form: LoginForm): Observable<ApiResponse<AuthData>> {
    return this.http
      .post<ApiResponse<{ token: string; usuario: any }>>(`${this.api}/auth/login`, form)
      .pipe(
        map(res => {
          const data: AuthData = {
            token: res.data.token,
            usuario: enrichUsuario(res.data.usuario),
          };
          this.saveSession(data);
          return { ...res, data };
        }),
      );
  }

  register(form: RegisterForm): Observable<ApiResponse<AuthData>> {
    return this.http
      .post<ApiResponse<{ token: string; usuario: any }>>(`${this.api}/auth/register`, form)
      .pipe(
        map(res => {
          const data: AuthData = {
            token: res.data.token,
            usuario: enrichUsuario(res.data.usuario),
          };
          this.saveSession(data);
          return { ...res, data };
        }),
      );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getUsuarioLogado(): Usuario | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Usuario;
    } catch {
      return null;
    }
  }

  updateUsuarioCache(usuario: Usuario): void {
    localStorage.setItem(USER_KEY, JSON.stringify(usuario));
  }

  private saveSession(data: AuthData): void {
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.usuario));
  }
}
