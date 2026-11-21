import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { contaGuard, semContaGuard } from './core/guards/conta.guard';
import { visitanteGuard } from './core/guards/visitante.guard';

const routes: Routes = [
  { path: '', redirectTo: 'app/inicio', pathMatch: 'full' },
  {
    path: '',
    canActivate: [visitanteGuard],
    loadChildren: () => import('./features/acesso/acesso.module').then((m) => m.AcessoModule),
  },
  {
    path: 'primeiro-uso',
    canActivate: [authGuard, semContaGuard],
    loadChildren: () =>
      import('./features/primeiro-uso/primeiro-uso.module').then((m) => m.PrimeiroUsoModule),
  },
  {
    path: 'app',
    canActivate: [authGuard, contaGuard],
    loadChildren: () => import('./layout/layout.module').then((m) => m.LayoutModule),
  },
  { path: '**', redirectTo: 'app/inicio' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
