import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SharedModule } from '../../shared/shared.module';
import { MaisComponent } from './mais.component';

const routes: Routes = [{ path: '', component: MaisComponent, title: 'Mais · Finance Master' }];

@NgModule({
  declarations: [MaisComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class MaisModule {}
