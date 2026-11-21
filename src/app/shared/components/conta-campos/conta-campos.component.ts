import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { ROTULO_TIPO_CONTA, TipoConta } from '../../../core/models/financeiro.model';
import { lerValorBR, valorParaCampo } from '../../../core/utils/dinheiro.util';

export type FormConta = FormGroup<{
  nome: FormControl<string>;
  tipo: FormControl<TipoConta>;
  saldoInicial: FormControl<string>;
}>;

export function criarFormConta(inicial?: { nome: string; tipo: TipoConta; saldoInicialCentavos: number }): FormConta {
  return new FormGroup({
    nome: new FormControl(inicial?.nome ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(40)],
    }),
    tipo: new FormControl<TipoConta>(inicial?.tipo ?? 'CONTA_CORRENTE', { nonNullable: true }),
    saldoInicial: new FormControl(inicial ? saldoParaCampo(inicial.saldoInicialCentavos) : '', {
      nonNullable: true,
      validators: [(c) => (lerSaldo(c.value) === null ? { valor: true } : null)],
    }),
  });
}

/** Vazio vale zero; aceita negativo, porque a conta pode começar no vermelho. */
export function lerSaldo(texto: string): number | null {
  const limpo = texto.trim();
  if (!limpo) {
    return 0;
  }
  const negativo = /^[-−]/.test(limpo);
  const centavos = lerValorBR(limpo.replace(/^[-−]\s*/, ''));
  return centavos === null ? null : negativo ? -centavos : centavos;
}

function saldoParaCampo(centavos: number): string {
  return centavos < 0 ? `-${valorParaCampo(-centavos)}` : valorParaCampo(centavos);
}

const ICONES: Record<TipoConta, string> = {
  CONTA_CORRENTE: 'business-outline',
  CONTA_DIGITAL: 'phone-portrait-outline',
  DINHEIRO: 'cash-outline',
  OUTROS: 'wallet-outline',
};

@Component({
  selector: 'app-conta-campos',
  templateUrl: './conta-campos.component.html',
  styleUrls: ['./conta-campos.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ContaCamposComponent {
  readonly form = input.required<FormConta>();
  readonly saldoBloqueado = input(false);

  readonly tipos = (Object.keys(ROTULO_TIPO_CONTA) as TipoConta[]).map((tipo) => ({
    tipo,
    rotulo: ROTULO_TIPO_CONTA[tipo],
    icone: ICONES[tipo],
  }));
}
