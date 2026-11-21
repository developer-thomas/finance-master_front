import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SharedModule } from '../../shared/shared.module';
import { ExtratoComponent } from './extrato.component';
import { FiltroExtratoComponent } from './filtro-extrato/filtro-extrato.component';

const routes: Routes = [{ path: '', component: ExtratoComponent, title: 'Extrato · Finance Master' }];

@NgModule({
  declarations: [ExtratoComponent, FiltroExtratoComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class ExtratoModule {}
