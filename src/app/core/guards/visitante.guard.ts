import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { SessaoService } from '../services/sessao.service';

/** Telas de entrada só para quem ainda não tem sessão. */
export const visitanteGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const usuario = await inject(SessaoService).carregar();
  return usuario ? router.createUrlTree(['/app/inicio']) : true;
};
