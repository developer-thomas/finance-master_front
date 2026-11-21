import { ChangeDetectionStrategy, Component, Input, OnInit, inject, signal } from '@angular/core';
import { ModalController } from '@ionic/angular';

import { ContaComSaldo, ContasService } from '../../../core/services/contas.service';
import { ErroRegra } from '../../../core/services/erro-regra';
import { FormConta, criarFormConta, lerSaldo } from '../../../shared/components/conta-campos/conta-campos.component';

@Component({
  selector: 'app-conta-form',
  templateUrl: './conta-form.component.html',
  styleUrls: ['./conta-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ContaFormComponent implements OnInit {
  private readonly modal = inject(ModalController);
  private readonly contas = inject(ContasService);

  /** Preenchido pelo ModalController; sem conta, o formulário cria uma nova. */
  @Input() conta: ContaComSaldo | null = null;

  form: FormConta = criarFormConta();
  readonly padrao = signal(false);
  readonly erro = signal('');

  ngOnInit(): void {
    if (this.conta) {
      this.form = criarFormConta(this.conta);
      this.padrao.set(this.conta.padrao);
    } else {
      this.padrao.set(this.contas.ativas().length === 0);
    }
  }

  get saldoBloqueado(): boolean {
    return !!this.conta?.temLancamentos;
  }

  get podeSerPadrao(): boolean {
    return !this.conta || this.conta.ativa;
  }

  fechar(): void {
    this.modal.dismiss(null, 'cancelar');
  }

  salvar(): void {
    this.erro.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { nome, tipo, saldoInicial } = this.form.getRawValue();
    const dados = {
      nome,
      tipo,
      saldoInicialCentavos: lerSaldo(saldoInicial) ?? 0,
      padrao: this.padrao(),
    };
    try {
      if (this.conta) {
        this.contas.editar(this.conta.id, dados);
      } else {
        this.contas.criar(dados);
      }
      this.modal.dismiss(null, 'salvar');
    } catch (e) {
      this.erro.set(e instanceof ErroRegra ? e.message : 'Não foi possível salvar a conta.');
    }
  }
}
