import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { NavController } from '@ionic/angular';

import { ErroAutenticacao } from '../../../core/services/auth.service';
import { SessaoService } from '../../../core/services/sessao.service';

export const SENHA_MINIMA = 8;

@Component({
  selector: 'app-criar-conta',
  templateUrl: './criar-conta.component.html',
  styleUrls: ['./criar-conta.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class CriarContaComponent {
  private readonly sessao = inject(SessaoService);
  private readonly nav = inject(NavController);

  readonly senhaMinima = SENHA_MINIMA;

  readonly form = inject(NonNullableFormBuilder).group({
    nome: ['', [Validators.required, Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, Validators.minLength(SENHA_MINIMA)]],
  });

  readonly enviando = signal(false);
  readonly erro = signal('');
  readonly verSenha = signal(false);

  async criar(): Promise<void> {
    this.erro.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    try {
      const { nome, email, senha } = this.form.getRawValue();
      await this.sessao.criarConta(nome, email, senha);
      this.form.reset();
      await this.nav.navigateRoot('/primeiro-uso');
    } catch (e) {
      this.erro.set(e instanceof ErroAutenticacao ? e.message : 'Não foi possível criar a conta agora.');
    } finally {
      this.enviando.set(false);
    }
  }
}
