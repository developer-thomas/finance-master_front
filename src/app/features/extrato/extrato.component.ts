import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ModalController } from '@ionic/angular';

import { Transacao } from '../../core/models/financeiro.model';
import { CategoriasService } from '../../core/services/categorias.service';
import { ContasService } from '../../core/services/contas.service';
import { RelogioService } from '../../core/services/relogio.service';
import { FiltroTransacoes, TransacoesService } from '../../core/services/transacoes.service';
import { opcoesModal } from '../../shared/utils/modal';
import { FiltroExtratoComponent } from './filtro-extrato/filtro-extrato.component';
import { FILTRO_INICIAL, FiltroExtrato, ROTULO_PERIODO } from './filtro-extrato/filtro-extrato.model';

interface GrupoDia {
  data: string;
  transacoes: Transacao[];
  liquidoCentavos: number;
}

interface FiltroAtivo {
  rotulo: string;
  remover: Partial<FiltroExtrato>;
}

@Component({
  selector: 'app-extrato',
  templateUrl: './extrato.component.html',
  styleUrls: ['./extrato.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ExtratoComponent {
  private readonly transacoes = inject(TransacoesService);
  private readonly categorias = inject(CategoriasService);
  private readonly contas = inject(ContasService);
  private readonly relogio = inject(RelogioService);
  private readonly modal = inject(ModalController);

  readonly busca = signal('');
  readonly filtro = signal<FiltroExtrato>({ ...FILTRO_INICIAL });

  readonly semNenhuma = computed(() => this.transacoes.validas().length === 0);

  private readonly intervalo = computed<{ de: string | null; ate: string | null }>(() => {
    const f = this.filtro();
    const mes = this.relogio.mesAtual();
    switch (f.periodo) {
      case 'MES_ATUAL':
        return { de: `${mes}-01`, ate: this.relogio.ultimoDiaDoMes(mes) };
      case 'MES_PASSADO': {
        const anterior = this.relogio.mesAnterior(mes);
        return { de: `${anterior}-01`, ate: this.relogio.ultimoDiaDoMes(anterior) };
      }
      case 'PERSONALIZADO':
        return { de: f.de || null, ate: f.ate || null };
      default:
        return { de: null, ate: null };
    }
  });

  readonly resultado = computed(() => {
    const f = this.filtro();
    const criterio: FiltroTransacoes = {
      busca: this.busca(),
      ...this.intervalo(),
      tipo: f.tipo,
      categoriaId: f.categoriaId,
      contaId: f.contaId,
    };
    return this.transacoes.filtrar(criterio);
  });

  readonly grupos = computed<GrupoDia[]>(() => {
    const grupos: GrupoDia[] = [];
    for (const t of this.resultado()) {
      let grupo = grupos[grupos.length - 1];
      if (!grupo || grupo.data !== t.data) {
        grupo = { data: t.data, transacoes: [], liquidoCentavos: 0 };
        grupos.push(grupo);
      }
      grupo.transacoes.push(t);
      grupo.liquidoCentavos += t.tipo === 'RECEITA' ? t.valorCentavos : -t.valorCentavos;
    }
    return grupos;
  });

  readonly totais = computed(() =>
    this.resultado().reduce(
      (acc, t) => {
        if (t.tipo === 'RECEITA') acc.receitas += t.valorCentavos;
        else acc.despesas += t.valorCentavos;
        return acc;
      },
      { receitas: 0, despesas: 0 },
    ),
  );

  readonly filtrosAtivos = computed<FiltroAtivo[]>(() => {
    const f = this.filtro();
    const ativos: FiltroAtivo[] = [];
    if (f.periodo !== 'TUDO') {
      const rotulo =
        f.periodo === 'PERSONALIZADO'
          ? [f.de && `de ${this.relogio.formatarData(f.de)}`, f.ate && `até ${this.relogio.formatarData(f.ate)}`]
              .filter(Boolean)
              .join(' ') || ROTULO_PERIODO.PERSONALIZADO
          : ROTULO_PERIODO[f.periodo];
      ativos.push({ rotulo, remover: { periodo: 'TUDO', de: '', ate: '' } });
    }
    if (f.tipo) {
      ativos.push({ rotulo: f.tipo === 'DESPESA' ? 'Despesas' : 'Receitas', remover: { tipo: null } });
    }
    if (f.categoriaId) {
      ativos.push({ rotulo: this.categorias.porId(f.categoriaId)?.nome ?? 'Categoria', remover: { categoriaId: null } });
    }
    if (f.contaId) {
      ativos.push({ rotulo: this.contas.porId(f.contaId)?.nome ?? 'Conta', remover: { contaId: null } });
    }
    return ativos;
  });

  readonly hoje = this.relogio.hoje();

  async abrirFiltros(): Promise<void> {
    const modal = await this.modal.create({
      component: FiltroExtratoComponent,
      componentProps: { filtro: this.filtro() },
      ...opcoesModal(),
    });
    await modal.present();
    const { data, role } = await modal.onWillDismiss<FiltroExtrato>();
    if (role === 'aplicar' && data) {
      this.filtro.set(data);
    }
  }

  remover(filtro: FiltroAtivo): void {
    this.filtro.update((f) => ({ ...f, ...filtro.remover }));
  }

  limparTudo(): void {
    this.filtro.set({ ...FILTRO_INICIAL });
    this.busca.set('');
  }
}
