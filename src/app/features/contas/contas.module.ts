import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SharedModule } from '../../shared/shared.module';
import { ContaFormComponent } from './conta-form/conta-form.component';
import { ContasComponent } from './contas.component';

const routes: Routes = [{ path: '', component: ContasComponent, title: 'Contas · Finance Master' }];

@NgModule({
  declarations: [ContasComponent, ContaFormComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class ContasModule {}
