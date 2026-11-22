import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SharedModule } from '../shared/shared.module';
import { ShellComponent } from './shell/shell.component';

const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
      {
        path: 'inicio',
        loadChildren: () => import('../features/inicio/inicio.module').then((m) => m.InicioModule),
      },
      {
        path: 'extrato',
        loadChildren: () => import('../features/extrato/extrato.module').then((m) => m.ExtratoModule),
      },
      {
        path: 'transacoes',
        loadChildren: () => import('../features/transacoes/transacoes.module').then((m) => m.TransacoesModule),
      },
      {
        path: 'contas',
        loadChildren: () => import('../features/contas/contas.module').then((m) => m.ContasModule),
      },
      {
        path: 'categorias',
        loadChildren: () => import('../features/categorias/categorias.module').then((m) => m.CategoriasModule),
      },
      {
        path: 'perfil',
        loadChildren: () => import('../features/perfil/perfil.module').then((m) => m.PerfilModule),
      },
      {
        path: 'mais',
        loadChildren: () => import('../features/mais/mais.module').then((m) => m.MaisModule),
      },
      {
        path: 'assistente',
        loadChildren: () =>
          import('../features/assistente/assistente.module').then((m) => m.AssistenteModule),
      },
    ],
  },
];

@NgModule({
  declarations: [ShellComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class LayoutModule {}
