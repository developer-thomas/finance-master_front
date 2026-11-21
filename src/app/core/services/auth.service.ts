import { Signal } from '@angular/core';

import { UsuarioSessao } from '../models/financeiro.model';

export class ErroAutenticacao extends Error {}

export const MENSAGEM_LOGIN_INVALIDO = 'E-mail ou senha incorretos.';

/** Contrato da autenticação. A implementação real é o Firebase; sem configuração, roda em modo local. */
export abstract class AuthService {
  abstract readonly usuario: Signal<UsuarioSessao | null>;

  /** Resolve quando a sessão persistida já foi lida. */
  abstract aguardarSessao(): Promise<UsuarioSessao | null>;

  abstract entrar(email: string, senha: string): Promise<void>;

  abstract criarConta(nome: string, email: string, senha: string): Promise<void>;

  abstract sair(): Promise<void>;

  /** ID token enviado à API em cada pedido. */
  abstract obterToken(): Promise<string | null>;
}
