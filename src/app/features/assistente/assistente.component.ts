import {
  ChangeDetectionStrategy,
  Component,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { IonContent } from '@ionic/angular';

import { ErroRegra } from '../../core/services/erro-regra';
import { FinanceiroApiService } from '../../core/services/financeiro-api.service';

export type PapelChat = 'usuario' | 'assistente';

export interface MensagemChat {
  id: string;
  papel: PapelChat;
  texto: string;
}

@Component({
  selector: 'app-assistente',
  templateUrl: './assistente.component.html',
  styleUrls: ['./assistente.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class AssistenteComponent {
  private readonly api = inject(FinanceiroApiService);

  @ViewChild(IonContent) private conteudo?: IonContent;

  readonly mensagens = signal<MensagemChat[]>([
    {
      id: 'boas-vindas',
      papel: 'assistente',
      texto:
        'Olá! Posso falar sobre seu saldo, gastos do mês e hábitos com base no que está no seu livro. O que você quer olhar?',
    },
  ]);
  readonly rascunho = signal('');
  readonly enviando = signal(false);
  readonly erro = signal('');

  readonly sugestoes = [
    'Como está minha saúde financeira este mês?',
    'Onde estou gastando mais?',
    'Meu saldo está confortável?',
  ];

  async enviar(textoLivre?: string): Promise<void> {
    const texto = (textoLivre ?? this.rascunho()).trim();
    if (!texto || this.enviando()) {
      return;
    }

    this.erro.set('');
    this.rascunho.set('');
    const historico = this.mensagens()
      .filter((m) => m.id !== 'boas-vindas')
      .map((m) => ({ papel: m.papel, texto: m.texto }));

    this.mensagens.update((lista) => [
      ...lista,
      { id: this.novoId(), papel: 'usuario', texto },
    ]);
    this.enviando.set(true);
    await this.rolarFim();

    try {
      const resposta = await this.api.perguntarAssistente(texto, historico);
      this.mensagens.update((lista) => [
        ...lista,
        { id: this.novoId(), papel: 'assistente', texto: resposta.texto },
      ]);
    } catch (e) {
      this.erro.set(
        e instanceof ErroRegra
          ? e.message
          : 'Não consegui responder agora. Tente de novo em instantes.',
      );
    } finally {
      this.enviando.set(false);
      await this.rolarFim();
    }
  }

  async rolarFim(): Promise<void> {
    await new Promise((r) => setTimeout(r, 50));
    await this.conteudo?.scrollToBottom(250);
  }

  private novoId(): string {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}
