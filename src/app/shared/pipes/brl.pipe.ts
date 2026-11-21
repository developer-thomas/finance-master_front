import { Pipe, PipeTransform } from '@angular/core';

import { TipoTransacao } from '../../core/models/financeiro.model';
import { formatarBRL } from '../../core/utils/dinheiro.util';

/** `{{ centavos | brl }}` ou `{{ centavos | brl: tipo }}` para o sinal do extrato. */
@Pipe({ name: 'brl', standalone: false })
export class BrlPipe implements PipeTransform {
  transform(centavos: number | null | undefined, tipo?: TipoTransacao): string {
    if (centavos == null) {
      return '';
    }
    if (!tipo) {
      return formatarBRL(centavos);
    }
    return `${tipo === 'DESPESA' ? '−' : '+'} ${formatarBRL(Math.abs(centavos))}`;
  }
}
