import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { ContasService } from '../services/contas.service';

/** Quem ainda não criou nenhuma conta passa pelo primeiro uso. Roda depois do authGuard. */
export const contaGuard: CanActivateFn = () => {
  const contas = inject(ContasService);
  return contas.todas().length > 0 ? true : inject(Router).createUrlTree(['/primeiro-uso']);
};

export const semContaGuard: CanActivateFn = () => {
  const contas = inject(ContasService);
  return contas.todas().length === 0 ? true : inject(Router).createUrlTree(['/app/inicio']);
};
