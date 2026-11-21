import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SharedModule } from '../../shared/shared.module';
import { CriarContaComponent } from './criar-conta/criar-conta.component';
import { EntrarComponent } from './entrar/entrar.component';
import { MolduraAcessoComponent } from './moldura-acesso/moldura-acesso.component';

const routes: Routes = [
  { path: 'entrar', component: EntrarComponent, title: 'Entrar · Finance Master' },
  { path: 'criar-conta', component: CriarContaComponent, title: 'Criar conta · Finance Master' },
];

@NgModule({
  declarations: [MolduraAcessoComponent, EntrarComponent, CriarContaComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class AcessoModule {}
