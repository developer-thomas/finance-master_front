import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { NavController } from '@ionic/angular';

import { ErroAutenticacao, MENSAGEM_LOGIN_INVALIDO } from '../../../core/services/auth.service';
import { SessaoService } from '../../../core/services/sessao.service';

@Component({
  selector: 'app-entrar',
  templateUrl: './entrar.component.html',
  styleUrls: ['./entrar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class EntrarComponent {
  private readonly sessao = inject(SessaoService);
  private readonly nav = inject(NavController);

  readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', Validators.required],
  });

  readonly enviando = signal(false);
  readonly erro = signal('');
  readonly verSenha = signal(false);

  async entrar(): Promise<void> {
    this.erro.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    try {
      const { email, senha } = this.form.getRawValue();
      await this.sessao.entrar(email, senha);
      this.form.reset();
      await this.nav.navigateRoot('/app/inicio');
    } catch (e) {
      this.erro.set(e instanceof ErroAutenticacao ? e.message : MENSAGEM_LOGIN_INVALIDO);
    } finally {
      this.enviando.set(false);
    }
  }
}
