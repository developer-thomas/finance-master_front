import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';

import { environment } from '../../../../environments/environment';
import { ErroRegra } from '../../../core/services/erro-regra';
import { WhatsappService, formatarNumero } from '../../../core/services/whatsapp.service';

@Component({
  selector: 'app-vinculo-whatsapp',
  templateUrl: './vinculo-whatsapp.component.html',
  styleUrls: ['./vinculo-whatsapp.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class VinculoWhatsappComponent {
  private readonly whatsapp = inject(WhatsappService);

  readonly vinculou = output<void>();

  /** Sem Meta Cloud API, a confirmação continua simulável em desenvolvimento. */
  readonly podeSimular = !environment.production;
  readonly vinculo = this.whatsapp.vinculo;
  readonly pendente = this.whatsapp.codigoPendente;

  readonly numero = signal('');
  readonly erro = signal('');
  readonly trocando = signal(false);
  private readonly agora = signal(Date.now());

  readonly numeroVinculado = computed(() => {
    const vinculo = this.vinculo();
    return vinculo ? formatarNumero(vinculo.numero) : '';
  });

  readonly numeroPendente = computed(() => {
    const pendente = this.pendente();
    return pendente ? formatarNumero(pendente.numero) : '';
  });

  readonly restante = computed(() => {
    const pendente = this.pendente();
    if (!pendente) {
      return '';
    }
    const segundos = Math.max(0, Math.floor((new Date(pendente.expiraEm).getTime() - this.agora()) / 1000));
    return `${Math.floor(segundos / 60)}:${(segundos % 60).toString().padStart(2, '0')}`;
  });

  readonly expirou = computed(() => {
    const pendente = this.pendente();
    return !!pendente && new Date(pendente.expiraEm).getTime() <= this.agora();
  });

  readonly mostrarFormulario = computed(() => !this.pendente() && (!this.vinculo() || this.trocando()));

  constructor() {
    const relogio = setInterval(() => this.agora.set(Date.now()), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(relogio));
  }

  async gerar(): Promise<void> {
    this.erro.set('');
    try {
      await this.whatsapp.gerarCodigo(this.numero());
      this.agora.set(Date.now());
    } catch (e) {
      this.erro.set(e instanceof ErroRegra ? e.message : 'Não foi possível gerar o código.');
    }
  }

  async cancelar(): Promise<void> {
    await this.whatsapp.cancelarCodigo();
    this.erro.set('');
  }

  async simular(): Promise<void> {
    try {
      await this.whatsapp.simularConfirmacao();
      this.trocando.set(false);
      this.numero.set('');
      this.vinculou.emit();
    } catch (e) {
      this.erro.set(e instanceof ErroRegra ? e.message : 'Não foi possível confirmar.');
    }
  }
}
