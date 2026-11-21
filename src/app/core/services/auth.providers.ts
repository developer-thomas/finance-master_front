import { Provider, inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { FirebaseAuthService } from './firebase-auth.service';
import { LocalAuthService } from './local-auth.service';

export const authProviders: Provider[] = [
  {
    provide: AuthService,
    useFactory: () =>
      environment.firebase.apiKey ? inject(FirebaseAuthService) : inject(LocalAuthService),
  },
];
