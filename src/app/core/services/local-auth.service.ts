import { Injectable, signal } from '@angular/core';

import { UsuarioSessao } from '../models/financeiro.model';
import { AuthService, ErroAutenticacao, MENSAGEM_LOGIN_INVALIDO } from './auth.service';

interface ContaLocal extends UsuarioSessao {
  senhaHash: string;
}

const CHAVE_CONTAS = 'fm:auth:contas';
const CHAVE_SESSAO = 'fm:auth:sessao';

/** Substituto do Firebase para desenvolvimento sem projeto configurado. Não serve para produção. */
@Injectable({ providedIn: 'root' })
export class LocalAuthService extends AuthService {
  private readonly atual = signal<UsuarioSessao | null>(this.lerSessao());

  readonly usuario = this.atual.asReadonly();

  aguardarSessao(): Promise<UsuarioSessao | null> {
    return Promise.resolve(this.atual());
  }

  async entrar(email: string, senha: string): Promise<void> {
    const conta = this.lerContas()[this.normalizar(email)];
    if (!conta || conta.senhaHash !== (await this.hash(senha))) {
      throw new ErroAutenticacao(MENSAGEM_LOGIN_INVALIDO);
    }
    this.abrirSessao(conta);
  }

  async criarConta(nome: string, email: string, senha: string): Promise<void> {
    const contas = this.lerContas();
    const chave = this.normalizar(email);
    if (contas[chave]) {
      throw new ErroAutenticacao('Este e-mail já possui uma conta.');
    }
    const conta: ContaLocal = {
      uid: crypto.randomUUID(),
      nome: nome.trim(),
      email: email.trim(),
      senhaHash: await this.hash(senha),
    };
    contas[chave] = conta;
    localStorage.setItem(CHAVE_CONTAS, JSON.stringify(contas));
    this.abrirSessao(conta);
  }

  async sair(): Promise<void> {
    localStorage.removeItem(CHAVE_SESSAO);
    this.atual.set(null);
  }

  async obterToken(): Promise<string | null> {
    const sessao = this.atual();
    if (!sessao) {
      return null;
    }
    const payload = btoa(
      unescape(encodeURIComponent(JSON.stringify({ uid: sessao.uid, email: sessao.email, nome: sessao.nome }))),
    );
    return `local.${payload}`;
  }

  private abrirSessao(conta: ContaLocal): void {
    const sessao: UsuarioSessao = { uid: conta.uid, nome: conta.nome, email: conta.email };
    localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
    this.atual.set(sessao);
  }

  private lerSessao(): UsuarioSessao | null {
    const salvo = localStorage.getItem(CHAVE_SESSAO);
    return salvo ? (JSON.parse(salvo) as UsuarioSessao) : null;
  }

  private lerContas(): Record<string, ContaLocal> {
    const salvo = localStorage.getItem(CHAVE_CONTAS);
    return salvo ? (JSON.parse(salvo) as Record<string, ContaLocal>) : {};
  }

  private normalizar(email: string): string {
    return email.trim().toLowerCase();
  }

  private async hash(senha: string): Promise<string> {
    const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(senha));
    return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, '0')).join('');
  }
}
