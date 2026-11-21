import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { Transacao } from '../../../core/models/financeiro.model';
import { CategoriasService } from '../../../core/services/categorias.service';
import { ContasService } from '../../../core/services/contas.service';
import { RelogioService } from '../../../core/services/relogio.service';
import { iconeCategoria } from '../../utils/icone-categoria';

@Component({
  selector: 'app-item-transacao',
  templateUrl: './item-transacao.component.html',
  styleUrls: ['./item-transacao.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ItemTransacaoComponent {
  private readonly categorias = inject(CategoriasService);
  private readonly contas = inject(ContasService);
  private readonly relogio = inject(RelogioService);

  readonly transacao = input.required<Transacao>();
  readonly mostrarData = input(false);

  readonly categoria = computed(() => this.categorias.porId(this.transacao().categoriaId));
  readonly conta = computed(() => this.contas.porId(this.transacao().contaId));
  readonly icone = computed(() => iconeCategoria(this.categoria()));
  readonly futura = computed(() => this.transacao().data > this.relogio.hoje());
}
