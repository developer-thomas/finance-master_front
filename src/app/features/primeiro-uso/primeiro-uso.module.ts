import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SharedModule } from '../../shared/shared.module';
import { PrimeiroUsoComponent } from './primeiro-uso.component';

const routes: Routes = [{ path: '', component: PrimeiroUsoComponent, title: 'Primeiros passos · Finance Master' }];

@NgModule({
  declarations: [PrimeiroUsoComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class PrimeiroUsoModule {}
