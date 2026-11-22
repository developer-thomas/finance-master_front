import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SharedModule } from '../../shared/shared.module';
import { AssistenteComponent } from './assistente.component';

const routes: Routes = [
  { path: '', component: AssistenteComponent, title: 'Assistente · Finance Master' },
];

@NgModule({
  declarations: [AssistenteComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class AssistenteModule {}
