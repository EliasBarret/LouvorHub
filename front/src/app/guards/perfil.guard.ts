import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Perfil } from '../models';

export function perfilGuard(perfisPermitidos: Perfil[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const usuario = auth.getUsuarioLogado();

    if (usuario?.perfil && perfisPermitidos.includes(usuario.perfil)) {
      return true;
    }
    return router.createUrlTree(['/inicio']);
  };
}

export const musicaAdminGuard = perfilGuard(['ADM', 'Pastor', 'Ministro']);
