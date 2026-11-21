import { Injectable, computed, inject } from '@angular/core';

import { Categoria, Transacao } from '../models/financeiro.model';
import { CategoriasService } from './categorias.service';
import { ContasService } from './contas.service';
import { RelogioService } from './relogio.service';
import { TransacoesService } from './transacoes.service';

export interface GastoCategoria {
  categoria: Categoria;
  totalCentavos: number;
  percentual: number;
}

export interface ResumoMes {
  mes: string;
  receitasCentavos: number;
  despesasCentavos: number;
  resultadoCentavos: number;
  gastosPorCategoria: GastoCategoria[];
}

const LIMITE_RECENTES = 6;

@Injectable({ providedIn: 'root' })
export class PainelService {
  private readonly contas = inject(ContasService);
  private readonly categorias = inject(CategoriasService);
  private readonly transacoes = inject(TransacoesService);
  private readonly relogio = inject(RelogioService);

  readonly saldoTotalCentavos = this.contas.saldoTotalCentavos;

  /** Inclui contas que depois foram desativadas; exclui data futura. */
  readonly resumoMes = computed<ResumoMes>(() => {
    const hoje = this.relogio.hoje();
    const mes = hoje.slice(0, 7);
    const doMes = this.transacoes.validas().filter((t) => t.data.startsWith(mes) && t.data <= hoje);

    const receitas = this.somar(doMes.filter((t) => t.tipo === 'RECEITA'));
    const despesasLista = doMes.filter((t) => t.tipo === 'DESPESA');
    const despesas = this.somar(despesasLista);

    const porCategoria = new Map<string, number>();
    for (const t of despesasLista) {
      porCategoria.set(t.categoriaId, (porCategoria.get(t.categoriaId) ?? 0) + t.valorCentavos);
    }
    const gastosPorCategoria = [...porCategoria.entries()]
      .map(([id, total]) => ({
        categoria: this.categorias.porId(id) ?? this.categorias.outros('DESPESA'),
        totalCentavos: total,
        percentual: despesas ? total / despesas : 0,
      }))
      .sort((a, b) => b.totalCentavos - a.totalCentavos);

    return {
      mes,
      receitasCentavos: receitas,
      despesasCentavos: despesas,
      resultadoCentavos: receitas - despesas,
      gastosPorCategoria,
    };
  });

  readonly recentes = computed(() => {
    const hoje = this.relogio.hoje();
    return this.transacoes
      .validas()
      .filter((t) => t.data <= hoje)
      .slice(0, LIMITE_RECENTES);
  });

  readonly futuras = computed(() => {
    const hoje = this.relogio.hoje();
    return this.transacoes.validas().filter((t) => t.data > hoje);
  });

  readonly semMovimentacao = computed(() => this.transacoes.validas().length === 0);

  private somar(lista: Transacao[]): number {
    return lista.reduce((soma, t) => soma + t.valorCentavos, 0);
  }
}
