import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SharedModule } from '../../shared/shared.module';
import { InicioComponent } from './inicio.component';

const routes: Routes = [{ path: '', component: InicioComponent, title: 'Início · Finance Master' }];

@NgModule({
  declarations: [InicioComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class InicioModule {}
