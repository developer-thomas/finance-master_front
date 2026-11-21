import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { SessaoService } from '../services/sessao.service';

export const authGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const usuario = await inject(SessaoService).carregar();
  return usuario ? true : router.createUrlTree(['/entrar']);
};
