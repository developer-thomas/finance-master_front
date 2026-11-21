import { Injectable, computed, inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import { OrigemTransacao, TipoTransacao, Transacao } from '../models/financeiro.model';
import { BancoLocalService } from './banco-local.service';
import { CategoriasService } from './categorias.service';
import { ContasService } from './contas.service';
import { ErroRegra } from './erro-regra';
import { FinanceiroApiService } from './financeiro-api.service';

export interface DadosTransacao {
  tipo: TipoTransacao;
  valorCentavos: number;
  data: string;
  descricao: string;
  categoriaId: string;
  contaId: string;
  origem: OrigemTransacao;
}

export interface FiltroTransacoes {
  busca?: string;
  de?: string | null;
  ate?: string | null;
  tipo?: TipoTransacao | null;
  categoriaId?: string | null;
  contaId?: string | null;
}

export const LIMITE_DESCRICAO = 120;

/** Mais recente primeiro; empate pela criação. */
export function ordenarTransacoes(a: Transacao, b: Transacao): number {
  return b.data.localeCompare(a.data) || b.criadoEm.localeCompare(a.criadoEm);
}

@Injectable({ providedIn: 'root' })
export class TransacoesService {
  private readonly banco = inject(BancoLocalService);
  private readonly categorias = inject(CategoriasService);
  private readonly contas = inject(ContasService);
  private readonly api = inject(FinanceiroApiService);

  readonly validas = computed(() =>
    this.banco
      .dados()
      .transacoes.filter((t) => !t.excluidaEm)
      .sort(ordenarTransacoes),
  );

  porId(id: string): Transacao | undefined {
    return this.validas().find((t) => t.id === id);
  }

  filtrar(filtro: FiltroTransacoes): Transacao[] {
    const termo = this.normalizar(filtro.busca ?? '');
    return this.validas().filter((t) => {
      if (filtro.de && t.data < filtro.de) return false;
      if (filtro.ate && t.data > filtro.ate) return false;
      if (filtro.tipo && t.tipo !== filtro.tipo) return false;
      if (filtro.categoriaId && t.categoriaId !== filtro.categoriaId) return false;
      if (filtro.contaId && t.contaId !== filtro.contaId) return false;
      if (termo) {
        const categoria = this.categorias.porId(t.categoriaId)?.nome ?? '';
        return this.normalizar(`${t.descricao} ${categoria}`).includes(termo);
      }
      return true;
    });
  }

  async criar(dados: DadosTransacao): Promise<Transacao> {
    if (!environment.dadosLocais) {
      this.validar(dados);
      const criada = await this.api.criarTransacao(dados);
      await this.sincronizar();
      await this.contas.sincronizarContas();
      return criada;
    }

    const agora = new Date().toISOString();
    const transacao: Transacao = {
      id: this.banco.novoId(),
      ...this.validar(dados),
      criadoEm: agora,
      atualizadoEm: agora,
      excluidaEm: null,
    };
    this.banco.atualizar((banco) => ({ ...banco, transacoes: [...banco.transacoes, transacao] }));
    return transacao;
  }

  async editar(id: string, dados: Omit<DadosTransacao, 'origem'>): Promise<void> {
    const atual = this.porId(id);
    if (!atual) {
      throw new ErroRegra('Esta transação não existe mais.');
    }

    if (!environment.dadosLocais) {
      this.validar({ ...dados, origem: atual.origem }, atual.contaId);
      await this.api.editarTransacao(id, dados);
      await this.sincronizar();
      await this.contas.sincronizarContas();
      return;
    }

    const validos = this.validar({ ...dados, origem: atual.origem }, atual.contaId);
    this.banco.atualizar((banco) => ({
      ...banco,
      transacoes: banco.transacoes.map((t) =>
        t.id === id ? { ...t, ...validos, atualizadoEm: new Date().toISOString() } : t,
      ),
    }));
  }

  async excluir(id: string): Promise<void> {
    if (!environment.dadosLocais) {
      await this.api.excluirTransacao(id);
      await this.sincronizar();
      await this.contas.sincronizarContas();
      return;
    }
    this.banco.atualizar((banco) => ({
      ...banco,
      transacoes: banco.transacoes.map((t) =>
        t.id === id ? { ...t, excluidaEm: new Date().toISOString() } : t,
      ),
    }));
  }

  async sincronizar(): Promise<void> {
    const transacoes = await this.api.listarTransacoes();
    this.banco.atualizar((banco) => ({ ...banco, transacoes }));
  }

  /** A conta atual de uma transação editada continua válida mesmo se já estiver inativa. */
  private validar(dados: DadosTransacao, contaAtualId?: string): DadosTransacao {
    if (!Number.isSafeInteger(dados.valorCentavos) || dados.valorCentavos <= 0) {
      throw new ErroRegra('Informe um valor maior que zero.');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dados.data)) {
      throw new ErroRegra('Informe a data.');
    }
    const conta = this.banco.dados().contas.find((c) => c.id === dados.contaId);
    if (!conta) {
      throw new ErroRegra('Escolha uma conta.');
    }
    if (!conta.ativa && conta.id !== contaAtualId) {
      throw new ErroRegra('Esta conta está inativa. Escolha uma conta ativa.');
    }
    const categoria = this.categorias.porId(dados.categoriaId);
    if (!categoria || categoria.tipo !== dados.tipo) {
      throw new ErroRegra(`Escolha uma categoria de ${dados.tipo === 'DESPESA' ? 'despesa' : 'receita'}.`);
    }
    const descricao = dados.descricao.trim().slice(0, LIMITE_DESCRICAO) || categoria.nome;
    return { ...dados, descricao };
  }

  private normalizar(texto: string): string {
    return texto
      .trim()
      .toLocaleLowerCase('pt-BR')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }
}
