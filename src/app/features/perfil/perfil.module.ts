import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SharedModule } from '../../shared/shared.module';
import { PerfilComponent } from './perfil.component';

const routes: Routes = [{ path: '', component: PerfilComponent, title: 'Perfil · Finance Master' }];

@NgModule({
  declarations: [PerfilComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class PerfilModule {}
