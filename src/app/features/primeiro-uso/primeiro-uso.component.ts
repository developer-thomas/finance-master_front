import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NavController } from '@ionic/angular';

import { ContasService } from '../../core/services/contas.service';
import { ErroRegra } from '../../core/services/erro-regra';
import { SessaoService } from '../../core/services/sessao.service';
import { WhatsappService } from '../../core/services/whatsapp.service';
import { criarFormConta, lerSaldo } from '../../shared/components/conta-campos/conta-campos.component';

@Component({
  selector: 'app-primeiro-uso',
  templateUrl: './primeiro-uso.component.html',
  styleUrls: ['./primeiro-uso.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class PrimeiroUsoComponent {
  private readonly contas = inject(ContasService);
  private readonly nav = inject(NavController);
  private readonly whatsapp = inject(WhatsappService);
  private readonly sessao = inject(SessaoService);

  readonly primeiroNome = computed(() => this.sessao.usuario()?.nome.split(' ')[0] ?? '');
  readonly etapa = signal<1 | 2>(1);
  readonly erro = signal('');
  readonly vinculado = computed(() => !!this.whatsapp.vinculo());

  readonly form = criarFormConta({ nome: 'Conta principal', tipo: 'CONTA_CORRENTE', saldoInicialCentavos: 0 });

  async criarConta(): Promise<void> {
    this.erro.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { nome, tipo, saldoInicial } = this.form.getRawValue();
    try {
      await this.contas.criar({ nome, tipo, saldoInicialCentavos: lerSaldo(saldoInicial) ?? 0, padrao: true });
      this.etapa.set(2);
    } catch (e) {
      this.erro.set(e instanceof ErroRegra ? e.message : 'Não foi possível criar a conta.');
    }
  }

  concluir(): void {
    this.nav.navigateRoot('/app/inicio');
  }
}
