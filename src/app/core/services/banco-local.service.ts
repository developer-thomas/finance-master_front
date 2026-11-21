import { Injectable, computed, signal } from '@angular/core';

import { environment } from '../../../environments/environment';
import {
  Categoria,
  CodigoVinculo,
  ContaFinanceira,
  Transacao,
  VinculoWhatsapp,
} from '../models/financeiro.model';

export interface BancoUsuario {
  contas: ContaFinanceira[];
  /** No modo local: só personalizadas. No modo API: todas as categorias visíveis. */
  categoriasPersonalizadas: Categoria[];
  transacoes: Transacao[];
  vinculo: VinculoWhatsapp | null;
  codigoVinculo: CodigoVinculo | null;
  /** Metadados de saldo/lançamentos vindos da API (opcional). */
  metasConta?: Record<string, { saldoCentavos: number; temLancamentos: boolean }>;
}

const PREFIXO = 'fm:dados:';

function bancoVazio(): BancoUsuario {
  return {
    contas: [],
    categoriasPersonalizadas: [],
    transacoes: [],
    vinculo: null,
    codigoVinculo: null,
    metasConta: {},
  };
}

/**
 * Cache do livro por usuário.
 * Com dadosLocais=true persiste o livro no navegador.
 * Com a API, o livro financeiro fica em memória e só o vínculo WhatsApp local permanece no storage.
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
    const parcial = salvo ? (JSON.parse(salvo) as Partial<BancoUsuario>) : {};
    if (environment.dadosLocais) {
      this.estado.set({ ...bancoVazio(), ...parcial });
    } else {
      this.estado.set({
        ...bancoVazio(),
        vinculo: parcial.vinculo ?? null,
        codigoVinculo: parcial.codigoVinculo ?? null,
      });
    }
    this.uid.set(uid);
  }

  /** Substitui o livro em memória (usado após carregar a API). */
  substituir(banco: Partial<BancoUsuario>): void {
    const uid = this.uid();
    if (!uid) {
      throw new Error('Nenhuma sessão aberta.');
    }
    const atual = this.estado();
    const novo = {
      ...bancoVazio(),
      ...atual,
      ...banco,
      vinculo: banco.vinculo !== undefined ? banco.vinculo : atual.vinculo,
      codigoVinculo: banco.codigoVinculo !== undefined ? banco.codigoVinculo : atual.codigoVinculo,
    };
    this.persistir(uid, novo);
    this.estado.set(novo);
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
    this.persistir(uid, novo);
    this.estado.set(novo);
  }

  novoId(): string {
    return crypto.randomUUID();
  }

  private persistir(uid: string, banco: BancoUsuario): void {
    if (environment.dadosLocais) {
      localStorage.setItem(PREFIXO + uid, JSON.stringify(banco));
      return;
    }
    localStorage.setItem(
      PREFIXO + uid,
      JSON.stringify({ vinculo: banco.vinculo, codigoVinculo: banco.codigoVinculo }),
    );
  }
}
