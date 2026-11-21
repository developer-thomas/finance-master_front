import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

/** Envia o ID token do Firebase só para a API do próprio produto. */
export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.apiUrl || !req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }
  return from(inject(AuthService).obterToken()).pipe(
    switchMap((token) =>
      next(token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req),
    ),
  );
};
