import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { AlertController, IonRouterOutlet, NavController, ToastController } from '@ionic/angular';
import { map } from 'rxjs';

import { ROTULO_ORIGEM } from '../../../core/models/financeiro.model';
import { CategoriasService } from '../../../core/services/categorias.service';
import { ContasService } from '../../../core/services/contas.service';
import { RelogioService } from '../../../core/services/relogio.service';
import { TransacoesService } from '../../../core/services/transacoes.service';
import { iconeCategoria } from '../../../shared/utils/icone-categoria';

@Component({
  selector: 'app-transacao-detalhe',
  templateUrl: './transacao-detalhe.component.html',
  styleUrls: ['./transacao-detalhe.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class TransacaoDetalheComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly nav = inject(NavController);
  private readonly outlet = inject(IonRouterOutlet, { optional: true });
  private readonly alerta = inject(AlertController);
  private readonly toast = inject(ToastController);
  private readonly transacoes = inject(TransacoesService);
  private readonly categorias = inject(CategoriasService);
  private readonly contas = inject(ContasService);
  private readonly relogio = inject(RelogioService);

  private readonly id = toSignal(this.route.paramMap.pipe(map((p) => p.get('id') ?? '')), { initialValue: '' });

  readonly transacao = computed(() => this.transacoes.porId(this.id()));
  readonly categoria = computed(() => this.categorias.porId(this.transacao()?.categoriaId ?? ''));
  readonly conta = computed(() => this.contas.porId(this.transacao()?.contaId ?? ''));
  readonly icone = computed(() => iconeCategoria(this.categoria()));
  readonly origem = computed(() => {
    const t = this.transacao();
    return t ? ROTULO_ORIGEM[t.origem] : '';
  });
  readonly futura = computed(() => (this.transacao()?.data ?? '') > this.relogio.hoje());

  readonly registradaEm = computed(() => {
    const t = this.transacao();
    if (!t) return '';
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(t.criadoEm));
  });

  voltar(): void {
    if (this.outlet?.canGoBack()) {
      this.nav.back();
    } else {
      this.nav.navigateBack('/app/extrato');
    }
  }

  async excluir(): Promise<void> {
    const t = this.transacao();
    if (!t) return;
    const nome = t.tipo === 'DESPESA' ? 'despesa' : 'receita';
    const alerta = await this.alerta.create({
      header: `Excluir esta ${nome}?`,
      message: 'O valor sai do saldo, do extrato e dos totais. Não dá para desfazer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Excluir', role: 'destructive', cssClass: 'alerta-excluir' },
      ],
    });
    await alerta.present();
    const { role } = await alerta.onDidDismiss();
    if (role !== 'destructive') return;

    this.transacoes.excluir(t.id);
    const toast = await this.toast.create({
      message: `${nome.charAt(0).toUpperCase()}${nome.slice(1)} excluída.`,
      duration: 2000,
      position: 'top',
      color: 'dark',
      icon: 'trash-outline',
    });
    await toast.present();
    this.voltar();
  }
}
