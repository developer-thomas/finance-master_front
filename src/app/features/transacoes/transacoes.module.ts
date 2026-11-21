import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SharedModule } from '../../shared/shared.module';
import { EntradaRapidaComponent } from './entrada-rapida/entrada-rapida.component';
import { TransacaoDetalheComponent } from './transacao-detalhe/transacao-detalhe.component';
import { TransacaoFormComponent } from './transacao-form/transacao-form.component';

const routes: Routes = [
  { path: '', redirectTo: '/app/extrato', pathMatch: 'full' },
  { path: 'nova', component: TransacaoFormComponent, title: 'Nova transação · Finance Master' },
  { path: ':id', component: TransacaoDetalheComponent, title: 'Transação · Finance Master' },
  { path: ':id/editar', component: TransacaoFormComponent, title: 'Editar transação · Finance Master' },
];

@NgModule({
  declarations: [TransacaoFormComponent, TransacaoDetalheComponent, EntradaRapidaComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class TransacoesModule {}
