import { Injectable, signal } from '@angular/core';
import { FirebaseError, initializeApp } from 'firebase/app';
import {
  Auth,
  User,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';

import { environment } from '../../../environments/environment';
import { UsuarioSessao } from '../models/financeiro.model';
import { AuthService, ErroAutenticacao, MENSAGEM_LOGIN_INVALIDO } from './auth.service';

@Injectable({ providedIn: 'root' })
export class FirebaseAuthService extends AuthService {
  private readonly auth: Auth = getAuth(initializeApp(environment.firebase));
  private readonly atual = signal<UsuarioSessao | null>(null);
  private readonly sessaoLida: Promise<UsuarioSessao | null>;

  readonly usuario = this.atual.asReadonly();

  constructor() {
    super();
    this.sessaoLida = new Promise((resolver) => {
      let primeira = true;
      onAuthStateChanged(this.auth, (usuario) => {
        this.atual.set(usuario ? this.paraSessao(usuario) : null);
        if (primeira) {
          primeira = false;
          resolver(this.atual());
        }
      });
    });
  }

  aguardarSessao(): Promise<UsuarioSessao | null> {
    return this.sessaoLida;
  }

  async entrar(email: string, senha: string): Promise<void> {
    try {
      const credencial = await signInWithEmailAndPassword(this.auth, email.trim(), senha);
      this.atual.set(this.paraSessao(credencial.user));
    } catch {
      throw new ErroAutenticacao(MENSAGEM_LOGIN_INVALIDO);
    }
  }

  async criarConta(nome: string, email: string, senha: string): Promise<void> {
    try {
      const credencial = await createUserWithEmailAndPassword(this.auth, email.trim(), senha);
      await updateProfile(credencial.user, { displayName: nome.trim() });
      this.atual.set({ uid: credencial.user.uid, nome: nome.trim(), email: credencial.user.email ?? email });
    } catch (erro) {
      const codigo = erro instanceof FirebaseError ? erro.code : '';
      if (codigo === 'auth/email-already-in-use') {
        throw new ErroAutenticacao('Este e-mail já possui uma conta.');
      }
      if (codigo === 'auth/weak-password') {
        throw new ErroAutenticacao('A senha precisa ter pelo menos 8 caracteres.');
      }
      if (codigo === 'auth/invalid-email') {
        throw new ErroAutenticacao('Informe um e-mail válido.');
      }
      throw new ErroAutenticacao('Não foi possível criar a conta agora. Tente novamente.');
    }
  }

  async sair(): Promise<void> {
    await signOut(this.auth);
    this.atual.set(null);
  }

  async obterToken(): Promise<string | null> {
    return this.auth.currentUser ? this.auth.currentUser.getIdToken() : null;
  }

  private paraSessao(usuario: User): UsuarioSessao {
    return {
      uid: usuario.uid,
      nome: usuario.displayName ?? usuario.email?.split('@')[0] ?? '',
      email: usuario.email ?? '',
    };
  }
}
