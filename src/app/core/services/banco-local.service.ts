import { Injectable, computed, signal } from '@angular/core';

import {
  Categoria,
  CodigoVinculo,
  ContaFinanceira,
  Transacao,
  VinculoWhatsapp,
} from '../models/financeiro.model';

export interface BancoUsuario {
  contas: ContaFinanceira[];
  categoriasPersonalizadas: Categoria[];
  transacoes: Transacao[];
  vinculo: VinculoWhatsapp | null;
  codigoVinculo: CodigoVinculo | null;
}

const PREFIXO = 'fm:dados:';

function bancoVazio(): BancoUsuario {
  return {
    contas: [],
    categoriasPersonalizadas: [],
    transacoes: [],
    vinculo: null,
    codigoVinculo: null,
  };
}

/**
 * Livro guardado no navegador enquanto a API de fm_back não existe.
 * Cada usuário tem a própria chave; trocar de sessão troca o livro inteiro.
 */
@Injectable({ providedIn: 'root' })
export class BancoLocalService {
  private readonly uid = signal<string | null>(null);
  private readonly estado = signal<BancoUsuario>(bancoVazio());

  readonly dados = this.estado.asReadonly();
  readonly aberto = computed(() => this.uid() !== null);

  abrir(uid: string): void {
    if (this.uid() === uid) {
      return;
    }
    const salvo = localStorage.getItem(PREFIXO + uid);
    this.estado.set(salvo ? { ...bancoVazio(), ...JSON.parse(salvo) } : bancoVazio());
    this.uid.set(uid);
  }

  fechar(): void {
    this.uid.set(null);
    this.estado.set(bancoVazio());
  }

  atualizar(alteracao: (banco: BancoUsuario) => BancoUsuario): void {
    const uid = this.uid();
    if (!uid) {
      throw new Error('Nenhuma sessão aberta.');
    }
    const novo = alteracao(structuredClone(this.estado()));
    localStorage.setItem(PREFIXO + uid, JSON.stringify(novo));
    this.estado.set(novo);
  }

  novoId(): string {
    return crypto.randomUUID();
  }
}
