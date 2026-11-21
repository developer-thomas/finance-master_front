import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

import { InterpretacaoService, ResultadoLeitura, Sugestao } from '../../../core/services/interpretacao.service';

export type EstadoLeitura =
  | { tipo: 'parado' }
  | { tipo: 'lendo'; origem: 'texto' | 'foto' }
  | { tipo: 'falhou'; motivo: string };

export interface LeituraConcluida {
  sugestao: Sugestao;
  origem: 'texto' | 'foto';
}

const TAMANHO_MAXIMO_FOTO = 10 * 1024 * 1024;

@Component({
  selector: 'app-entrada-rapida',
  templateUrl: './entrada-rapida.component.html',
  styleUrls: ['./entrada-rapida.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class EntradaRapidaComponent {
  private readonly interpretacao = inject(InterpretacaoService);

  readonly destacar = input(false);
  readonly preenchido = output<LeituraConcluida>();
  readonly falhou = output<void>();

  readonly texto = signal('');
  readonly estado = signal<EstadoLeitura>({ tipo: 'parado' });

  private readonly arquivo = viewChild.required<ElementRef<HTMLInputElement>>('arquivo');

  async lerTexto(): Promise<void> {
    if (!this.texto().trim() || this.estado().tipo === 'lendo') {
      return;
    }
    this.estado.set({ tipo: 'lendo', origem: 'texto' });
    this.concluir(await this.interpretacao.lerTexto(this.texto()), 'texto');
  }

  escolherFoto(): void {
    this.arquivo().nativeElement.click();
  }

  async fotoEscolhida(evento: Event): Promise<void> {
    const campo = evento.target as HTMLInputElement;
    const arquivo = campo.files?.[0];
    campo.value = '';
    if (!arquivo) {
      return;
    }
    if (!arquivo.type.startsWith('image/')) {
      this.estado.set({ tipo: 'falhou', motivo: 'Envie uma imagem, como a foto de uma nota ou um print do comprovante.' });
      this.falhou.emit();
      return;
    }
    if (arquivo.size > TAMANHO_MAXIMO_FOTO) {
      this.estado.set({ tipo: 'falhou', motivo: 'A imagem passa de 10 MB. Tente uma foto menor.' });
      this.falhou.emit();
      return;
    }
    this.estado.set({ tipo: 'lendo', origem: 'foto' });
    this.concluir(await this.interpretacao.lerImagem(arquivo), 'foto');
  }

  private concluir(resultado: ResultadoLeitura, origem: 'texto' | 'foto'): void {
    if (resultado.ok) {
      this.estado.set({ tipo: 'parado' });
      this.preenchido.emit({ sugestao: resultado.sugestao, origem });
    } else {
      this.estado.set({ tipo: 'falhou', motivo: resultado.motivo });
      this.falhou.emit();
    }
  }
}
