import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { ContasService } from '../../core/services/contas.service';
import { PainelService } from '../../core/services/painel.service';
import { RelogioService } from '../../core/services/relogio.service';
import { SessaoService } from '../../core/services/sessao.service';
import { WhatsappService } from '../../core/services/whatsapp.service';
import { iconeCategoria } from '../../shared/utils/icone-categoria';

const CATEGORIAS_VISIVEIS = 5;

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class InicioComponent {
  private readonly painel = inject(PainelService);
  private readonly contas = inject(ContasService);
  private readonly relogio = inject(RelogioService);
  private readonly sessao = inject(SessaoService);
  private readonly whatsapp = inject(WhatsappService);

  readonly saldoTotal = this.painel.saldoTotalCentavos;
  readonly resumo = this.painel.resumoMes;
  readonly recentes = this.painel.recentes;
  readonly futuras = this.painel.futuras;
  readonly vazio = this.painel.semMovimentacao;
  readonly whatsappVinculado = computed(() => !!this.whatsapp.vinculo());
  readonly quantidadeContas = computed(() => this.contas.ativas().length);
  readonly semContaAtiva = computed(() => this.contas.ativas().length === 0);

  readonly primeiroNome = computed(() => this.sessao.usuario()?.nome.split(' ')[0] ?? '');
  readonly nomeMes = computed(() => this.relogio.nomeDoMes(this.resumo().mes));

  readonly categorias = computed(() => {
    const lista = this.resumo().gastosPorCategoria;
    const visiveis = lista.slice(0, CATEGORIAS_VISIVEIS).map((g) => ({
      nome: g.categoria.nome,
      icone: iconeCategoria(g.categoria),
      totalCentavos: g.totalCentavos,
      percentual: g.percentual,
    }));
    const resto = lista.slice(CATEGORIAS_VISIVEIS);
    if (resto.length) {
      const total = resto.reduce((s, g) => s + g.totalCentavos, 0);
      visiveis.push({
        nome: `Outras ${resto.length} categorias`,
        icone: 'ellipsis-horizontal',
        totalCentavos: total,
        percentual: resto.reduce((s, g) => s + g.percentual, 0),
      });
    }
    return visiveis;
  });

  percentual(valor: number): string {
    return `${Math.round(valor * 100)}%`;
  }
}
