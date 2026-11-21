import { Injectable, computed, inject } from '@angular/core';

import { CATEGORIAS_PADRAO, CATEGORIA_OUTROS } from '../models/categorias-padrao';
import { Categoria, TipoTransacao } from '../models/financeiro.model';
import { BancoLocalService } from './banco-local.service';
import { ErroRegra } from './erro-regra';

function chave(nome: string): string {
  return nome
    .trim()
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

@Injectable({ providedIn: 'root' })
export class CategoriasService {
  private readonly banco = inject(BancoLocalService);

  readonly todas = computed<Categoria[]>(() => [
    ...CATEGORIAS_PADRAO,
    ...[...this.banco.dados().categoriasPersonalizadas].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
  ]);

  readonly despesa = computed(() => this.todas().filter((c) => c.tipo === 'DESPESA'));
  readonly receita = computed(() => this.todas().filter((c) => c.tipo === 'RECEITA'));

  doTipo(tipo: TipoTransacao): Categoria[] {
    return tipo === 'DESPESA' ? this.despesa() : this.receita();
  }

  porId(id: string): Categoria | undefined {
    return this.todas().find((c) => c.id === id);
  }

  outros(tipo: TipoTransacao): Categoria {
    return this.porId(CATEGORIA_OUTROS[tipo])!;
  }

  /** Procura pelo nome, sem diferenciar maiúsculas nem acentos. */
  porNome(tipo: TipoTransacao, nome: string): Categoria | undefined {
    const procurado = chave(nome);
    return this.doTipo(tipo).find((c) => chave(c.nome) === procurado);
  }

  criar(tipo: TipoTransacao, nome: string): Categoria {
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
}
