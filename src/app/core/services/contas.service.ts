import { Injectable, computed, inject } from '@angular/core';

import { ContaFinanceira, TipoConta } from '../models/financeiro.model';
import { BancoLocalService, BancoUsuario } from './banco-local.service';
import { ErroRegra } from './erro-regra';
import { RelogioService } from './relogio.service';

export interface DadosConta {
  nome: string;
  tipo: TipoConta;
  saldoInicialCentavos: number;
  padrao: boolean;
}

export interface ContaComSaldo extends ContaFinanceira {
  saldoCentavos: number;
  temLancamentos: boolean;
}

@Injectable({ providedIn: 'root' })
export class ContasService {
  private readonly banco = inject(BancoLocalService);
  private readonly relogio = inject(RelogioService);

  readonly todas = computed<ContaComSaldo[]>(() => {
    const { contas, transacoes } = this.banco.dados();
    const hoje = this.relogio.hoje();
    return [...contas]
      .sort((a, b) => a.criadoEm.localeCompare(b.criadoEm))
      .map((conta) => {
        const daConta = transacoes.filter((t) => t.contaId === conta.id);
        const saldo = daConta
          .filter((t) => !t.excluidaEm && t.data <= hoje)
          .reduce((soma, t) => soma + (t.tipo === 'RECEITA' ? t.valorCentavos : -t.valorCentavos), 0);
        return {
          ...conta,
          saldoCentavos: conta.saldoInicialCentavos + saldo,
          temLancamentos: daConta.length > 0,
        };
      });
  });

  readonly ativas = computed(() => this.todas().filter((c) => c.ativa));
  readonly inativas = computed(() => this.todas().filter((c) => !c.ativa));
  readonly padrao = computed(() => this.ativas().find((c) => c.padrao) ?? null);
  readonly saldoTotalCentavos = computed(() =>
    this.ativas().reduce((soma, c) => soma + c.saldoCentavos, 0),
  );

  porId(id: string): ContaComSaldo | undefined {
    return this.todas().find((c) => c.id === id);
  }

  criar(dados: DadosConta): ContaFinanceira {
    const nome = this.validarNome(dados.nome);
    const conta: ContaFinanceira = {
      id: this.banco.novoId(),
      nome,
      tipo: dados.tipo,
      saldoInicialCentavos: dados.saldoInicialCentavos,
      ativa: true,
      padrao: false,
      criadoEm: new Date().toISOString(),
    };
    this.banco.atualizar((banco) => {
      const semPadrao = !banco.contas.some((c) => c.ativa && c.padrao);
      const contas = [...banco.contas, conta];
      return {
        ...banco,
        contas: dados.padrao || semPadrao ? this.marcarPadrao(contas, conta.id) : contas,
      };
    });
    return conta;
  }

  editar(id: string, dados: DadosConta): void {
    const atual = this.obter(id);
    const nome = this.validarNome(dados.nome, id);
    if (dados.saldoInicialCentavos !== atual.saldoInicialCentavos && this.porId(id)?.temLancamentos) {
      throw new ErroRegra('O saldo inicial só pode ser corrigido enquanto a conta não tiver lançamentos.');
    }
    this.banco.atualizar((banco) => {
      const contas = banco.contas.map((c) =>
        c.id === id
          ? { ...c, nome, tipo: dados.tipo, saldoInicialCentavos: dados.saldoInicialCentavos }
          : c,
      );
      return {
        ...banco,
        contas: dados.padrao && atual.ativa ? this.marcarPadrao(contas, id) : contas,
      };
    });
  }

  tornarPadrao(id: string): void {
    if (!this.obter(id).ativa) {
      throw new ErroRegra('Só uma conta ativa pode ser a padrão.');
    }
    this.banco.atualizar((banco) => ({ ...banco, contas: this.marcarPadrao(banco.contas, id) }));
  }

  desativar(id: string): void {
    this.banco.atualizar((banco) => {
      const contas = banco.contas.map((c) => (c.id === id ? { ...c, ativa: false, padrao: false } : c));
      return { ...banco, contas: this.garantirPadrao(contas) };
    });
  }

  reativar(id: string): void {
    this.banco.atualizar((banco) => {
      const contas = banco.contas.map((c) => (c.id === id ? { ...c, ativa: true } : c));
      return { ...banco, contas: this.garantirPadrao(contas) };
    });
  }

  private obter(id: string): ContaFinanceira {
    const conta = this.banco.dados().contas.find((c) => c.id === id);
    if (!conta) {
      throw new ErroRegra('Conta não encontrada.');
    }
    return conta;
  }

  private validarNome(nome: string, ignorarId?: string): string {
    const limpo = nome.trim();
    if (!limpo) {
      throw new ErroRegra('Dê um nome para a conta.');
    }
    const repetido = this.banco
      .dados()
      .contas.some((c) => c.id !== ignorarId && c.nome.toLocaleLowerCase('pt-BR') === limpo.toLocaleLowerCase('pt-BR'));
    if (repetido) {
      throw new ErroRegra('Você já tem uma conta com esse nome.');
    }
    return limpo;
  }

  private marcarPadrao(contas: ContaFinanceira[], id: string): ContaFinanceira[] {
    return contas.map((c) => ({ ...c, padrao: c.id === id }));
  }

  /** Sem padrão ativa, a conta ativa mais antiga assume. */
  private garantirPadrao(contas: BancoUsuario['contas']): ContaFinanceira[] {
    if (contas.some((c) => c.ativa && c.padrao)) {
      return contas;
    }
    const maisAntiga = [...contas]
      .filter((c) => c.ativa)
      .sort((a, b) => a.criadoEm.localeCompare(b.criadoEm))[0];
    return maisAntiga ? this.marcarPadrao(contas, maisAntiga.id) : contas;
  }
}
