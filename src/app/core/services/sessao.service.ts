import { Injectable, inject } from '@angular/core';

import { UsuarioSessao } from '../models/financeiro.model';
import { AuthService } from './auth.service';
import { BancoLocalService } from './banco-local.service';

/** Mantém o livro de dados alinhado ao usuário autenticado. */
@Injectable({ providedIn: 'root' })
export class SessaoService {
  private readonly auth = inject(AuthService);
  private readonly banco = inject(BancoLocalService);

  readonly usuario = this.auth.usuario;

  async carregar(): Promise<UsuarioSessao | null> {
    await this.auth.aguardarSessao();
    this.sincronizar();
    return this.auth.usuario();
  }

  async entrar(email: string, senha: string): Promise<void> {
    await this.auth.entrar(email, senha);
    this.sincronizar();
  }

  async criarConta(nome: string, email: string, senha: string): Promise<void> {
    await this.auth.criarConta(nome, email, senha);
    this.sincronizar();
  }

  async sair(): Promise<void> {
    await this.auth.sair();
    this.banco.fechar();
  }

  private sincronizar(): void {
    const usuario = this.auth.usuario();
    if (usuario) {
      this.banco.abrir(usuario.uid);
    } else {
      this.banco.fechar();
    }
  }
}
