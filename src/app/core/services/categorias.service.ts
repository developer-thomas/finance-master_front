import { Injectable, computed, inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import { CATEGORIAS_PADRAO, CATEGORIA_OUTROS } from '../models/categorias-padrao';
import { Categoria, TipoTransacao } from '../models/financeiro.model';
import { BancoLocalService } from './banco-local.service';
import { ErroRegra } from './erro-regra';
import { FinanceiroApiService } from './financeiro-api.service';

function chave(nome: string): string {
  return nome
    .trim()
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Categorias padrão (local) ou lista completa vinda da API. */
@Injectable({ providedIn: 'root' })
export class CategoriasService {
  private readonly banco = inject(BancoLocalService);
  private readonly api = inject(FinanceiroApiService);

  /** Conjunto visível ao usuário (padrão + personalizadas). */
  readonly todas = computed<Categoria[]>(() => {
    const doBanco = [...this.banco.dados().categoriasPersonalizadas].sort((a, b) =>
      a.nome.localeCompare(b.nome, 'pt-BR'),
    );
    if (!environment.dadosLocais) {
      return doBanco;
    }
    return [...CATEGORIAS_PADRAO, ...doBanco];
  });

  readonly despesa = computed(() => this.todas().filter((c) => c.tipo === 'DESPESA'));
  readonly receita = computed(() => this.todas().filter((c) => c.tipo === 'RECEITA'));

  doTipo(tipo: TipoTransacao): Categoria[] {
    return tipo === 'DESPESA' ? this.despesa() : this.receita();
  }

  porId(id: string): Categoria | undefined {
    return this.todas().find((c) => c.id === id);
  }

  outros(tipo: TipoTransacao): Categoria {
    const daLista = this.doTipo(tipo).find((c) => c.nome === 'Outros');
    if (daLista) {
      return daLista;
    }
    // Só usa IDs locais em modo offline; na API os GUIDs vêm do banco.
    if (environment.dadosLocais) {
      const local = this.porId(CATEGORIA_OUTROS[tipo]);
      if (local) {
        return local;
      }
    }
    throw new ErroRegra('Categoria "Outros" ainda não carregou. Abra o app de novo ou sincronize.');
  }

  porNome(tipo: TipoTransacao, nome: string): Categoria | undefined {
    const procurado = chave(nome);
    return this.doTipo(tipo).find((c) => chave(c.nome) === procurado);
  }

  /** Cria categoria personalizada única por tipo. */
  async criar(tipo: TipoTransacao, nome: string): Promise<Categoria> {
    if (!environment.dadosLocais) {
      const categoria = await this.api.criarCategoria(tipo, nome);
      await this.sincronizar();
      return categoria;
    }

    const limpo = nome.trim();
    if (!limpo) {
      throw new ErroRegra('Dê um nome para a categoria.');
    }
    if (limpo.length > 40) {
      throw new ErroRegra('Use até 40 caracteres.');
    }
    if (this.doTipo(tipo).some((c) => c.nome.toLocaleLowerCase('pt-BR') === limpo.toLocaleLowerCase('pt-BR'))) {
      throw new ErroRegra(`Já existe a categoria "${limpo}" em ${tipo === 'DESPESA' ? 'despesas' : 'receitas'}.`);
    }
    const categoria: Categoria = { id: this.banco.novoId(), tipo, nome: limpo, escopo: 'PERSONALIZADA' };
    this.banco.atualizar((banco) => ({
      ...banco,
      categoriasPersonalizadas: [...banco.categoriasPersonalizadas, categoria],
    }));
    return categoria;
  }

  /** Recarrega categorias a partir da API. */
  async sincronizar(): Promise<void> {
    const categorias = await this.api.listarCategorias();
    this.banco.atualizar((banco) => ({ ...banco, categoriasPersonalizadas: categorias }));
  }
}
