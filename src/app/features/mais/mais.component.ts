import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { SessaoService } from '../../core/services/sessao.service';
import { WhatsappService, formatarNumero } from '../../core/services/whatsapp.service';

@Component({
  selector: 'app-mais',
  templateUrl: './mais.component.html',
  styleUrls: ['./mais.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class MaisComponent {
  private readonly whatsapp = inject(WhatsappService);

  readonly usuario = inject(SessaoService).usuario;
  readonly whatsappResumo = computed(() => {
    const vinculo = this.whatsapp.vinculo();
    return vinculo ? `WhatsApp ${formatarNumero(vinculo.numero)}` : 'WhatsApp não vinculado';
  });
}
