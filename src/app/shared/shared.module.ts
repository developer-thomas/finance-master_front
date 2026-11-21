import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { ContaCamposComponent } from './components/conta-campos/conta-campos.component';
import { EstadoVazioComponent } from './components/estado-vazio/estado-vazio.component';
import { ItemTransacaoComponent } from './components/item-transacao/item-transacao.component';
import { VinculoWhatsappComponent } from './components/vinculo-whatsapp/vinculo-whatsapp.component';
import { BrlPipe } from './pipes/brl.pipe';
import { DataCivilPipe } from './pipes/data-civil.pipe';

const DECLARACOES = [
  BrlPipe,
  DataCivilPipe,
  ContaCamposComponent,
  EstadoVazioComponent,
  ItemTransacaoComponent,
  VinculoWhatsappComponent,
];

@NgModule({
  declarations: DECLARACOES,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, IonicModule],
  exports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, IonicModule, ...DECLARACOES],
})
export class SharedModule {}
