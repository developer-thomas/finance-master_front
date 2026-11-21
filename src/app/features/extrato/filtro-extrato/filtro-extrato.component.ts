import { ChangeDetectionStrategy, Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { ModalController } from '@ionic/angular';

import { TipoTransacao } from '../../../core/models/financeiro.model';
import { CategoriasService } from '../../../core/services/categorias.service';
import { ContasService } from '../../../core/services/contas.service';
import { FILTRO_INICIAL, FiltroExtrato, Periodo, ROTULO_PERIODO } from './filtro-extrato.model';

@Component({
  selector: 'app-filtro-extrato',
  templateUrl: './filtro-extrato.component.html',
  styleUrls: ['./filtro-extrato.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class FiltroExtratoComponent implements OnInit {
  private readonly modal = inject(ModalController);
  private readonly categorias = inject(CategoriasService);
  private readonly contas = inject(ContasService);

  /** Preenchido pelo ModalController via componentProps. */
  @Input() filtro: FiltroExtrato = FILTRO_INICIAL;

  readonly atual = signal<FiltroExtrato>(FILTRO_INICIAL);

  readonly periodos = (Object.keys(ROTULO_PERIODO) as Periodo[]).map((p) => ({ valor: p, rotulo: ROTULO_PERIODO[p] }));
  readonly tipos: { valor: TipoTransacao | null; rotulo: string }[] = [
    { valor: null, rotulo: 'Todos' },
    { valor: 'DESPESA', rotulo: 'Despesas' },
    { valor: 'RECEITA', rotulo: 'Receitas' },
  ];

  readonly opcoesCategoria = computed(() => {
    const tipo = this.atual().tipo;
    const lista = tipo ? this.categorias.doTipo(tipo) : this.categorias.todas();
    return lista.map((c) => ({
      id: c.id,
      rotulo: tipo ? c.nome : `${c.nome} · ${c.tipo === 'DESPESA' ? 'despesa' : 'receita'}`,
    }));
  });

  readonly opcoesConta = computed(() =>
    this.contas.todas().map((c) => ({ id: c.id, rotulo: c.ativa ? c.nome : `${c.nome} (inativa)` })),
  );

  readonly datasInvalidas = computed(() => {
    const { periodo, de, ate } = this.atual();
    return periodo === 'PERSONALIZADO' && !!de && !!ate && de > ate;
  });

  ngOnInit(): void {
    this.atual.set({ ...this.filtro });
  }

  alterar(parcial: Partial<FiltroExtrato>): void {
    this.atual.update((f) => {
      const novo = { ...f, ...parcial };
      if (parcial.tipo !== undefined && novo.categoriaId) {
        const categoria = this.categorias.porId(novo.categoriaId);
        if (parcial.tipo && categoria?.tipo !== parcial.tipo) {
          novo.categoriaId = null;
        }
      }
      return novo;
    });
  }

  limpar(): void {
    this.atual.set({ ...FILTRO_INICIAL });
  }

  fechar(): void {
    this.modal.dismiss(null, 'cancelar');
  }

  aplicar(): void {
    if (this.datasInvalidas()) {
      return;
    }
    this.modal.dismiss(this.atual(), 'aplicar');
  }
}
