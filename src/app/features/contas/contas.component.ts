import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActionSheetController, AlertController, ModalController, ToastController } from '@ionic/angular';

import { ROTULO_TIPO_CONTA, TipoConta } from '../../core/models/financeiro.model';
import { ContaComSaldo, ContasService } from '../../core/services/contas.service';
import { opcoesModal } from '../../shared/utils/modal';
import { ContaFormComponent } from './conta-form/conta-form.component';

const ICONES: Record<TipoConta, string> = {
  CONTA_CORRENTE: 'business-outline',
  CONTA_DIGITAL: 'phone-portrait-outline',
  DINHEIRO: 'cash-outline',
  OUTROS: 'wallet-outline',
};

@Component({
  selector: 'app-contas',
  templateUrl: './contas.component.html',
  styleUrls: ['./contas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ContasComponent {
  private readonly contas = inject(ContasService);
  private readonly modal = inject(ModalController);
  private readonly alerta = inject(AlertController);
  private readonly acoes = inject(ActionSheetController);
  private readonly toast = inject(ToastController);

  readonly ativas = this.contas.ativas;
  readonly inativas = this.contas.inativas;
  readonly saldoTotal = this.contas.saldoTotalCentavos;
  readonly verInativas = signal(false);

  rotuloTipo(tipo: TipoConta): string {
    return ROTULO_TIPO_CONTA[tipo];
  }

  icone(tipo: TipoConta): string {
    return ICONES[tipo];
  }

  async abrirFormulario(conta: ContaComSaldo | null = null): Promise<void> {
    const modal = await this.modal.create({
      component: ContaFormComponent,
      componentProps: { conta },
      ...opcoesModal(),
    });
    await modal.present();
  }

  async abrirAcoes(conta: ContaComSaldo): Promise<void> {
    const botoes = [
      { text: 'Editar', icon: 'create-outline', handler: () => void this.abrirFormulario(conta) },
      ...(conta.ativa && !conta.padrao
        ? [{ text: 'Tornar padrão', icon: 'star-outline', handler: () => this.tornarPadrao(conta) }]
        : []),
      conta.ativa
        ? { text: 'Desativar', icon: 'eye-off-outline', role: 'destructive', handler: () => void this.desativar(conta) }
        : { text: 'Reativar', icon: 'refresh-outline', handler: () => this.reativar(conta) },
      { text: 'Cancelar', role: 'cancel', icon: 'close' },
    ];
    const folha = await this.acoes.create({ header: conta.nome, buttons: botoes });
    await folha.present();
  }

  tornarPadrao(conta: ContaComSaldo): void {
    this.contas.tornarPadrao(conta.id);
    void this.avisar(`${conta.nome} agora é a conta padrão.`);
  }

  async desativar(conta: ContaComSaldo): Promise<void> {
    const restantes = this.ativas().filter((c) => c.id !== conta.id);
    const partes = [
      'A conta sai do saldo total e deixa de aparecer em novos lançamentos.',
      'O histórico continua no extrato e nos totais dos meses em que aconteceu.',
    ];
    if (conta.padrao && restantes.length) {
      partes.push(`A conta padrão passa a ser ${restantes[0].nome}.`);
    }
    if (!restantes.length) {
      partes.push('Esta é a sua única conta ativa: nada poderá ser lançado, nem pelo WhatsApp, até você criar ou reativar uma.');
    }
    const alerta = await this.alerta.create({
      header: `Desativar ${conta.nome}?`,
      message: partes.join(' '),
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Desativar', role: 'destructive' },
      ],
    });
    await alerta.present();
    const { role } = await alerta.onDidDismiss();
    if (role === 'destructive') {
      await this.contas.desativar(conta.id);
      void this.avisar(`${conta.nome} foi desativada.`);
    }
  }

  async reativar(conta: ContaComSaldo): Promise<void> {
    await this.contas.reativar(conta.id);
    void this.avisar(`${conta.nome} voltou para o saldo total.`);
  }

  private async avisar(mensagem: string): Promise<void> {
    const toast = await this.toast.create({ message: mensagem, duration: 2200, position: 'top', color: 'dark' });
    await toast.present();
  }
}
