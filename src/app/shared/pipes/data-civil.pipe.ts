import { Pipe, PipeTransform, inject } from '@angular/core';

import { RelogioService } from '../../core/services/relogio.service';

/** `{{ '2026-11-21' | dataCivil }}` → 21/11/2026; com `'dia'` → Hoje, Ontem ou sáb. 21/11/2026. */
@Pipe({ name: 'dataCivil', standalone: false })
export class DataCivilPipe implements PipeTransform {
  private readonly relogio = inject(RelogioService);

  transform(data: string | null | undefined, formato: 'curta' | 'dia' = 'curta'): string {
    if (!data) {
      return '';
    }
    return formato === 'dia' ? this.relogio.rotuloDoDia(data) : this.relogio.formatarData(data);
  }
}
