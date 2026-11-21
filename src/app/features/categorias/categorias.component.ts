import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { IonRouterOutlet, NavController, ToastController } from '@ionic/angular';

import { Categoria, TipoTransacao } from '../../core/models/financeiro.model';
import { CategoriasService } from '../../core/services/categorias.service';
import { ErroRegra } from '../../core/services/erro-regra';
import { iconeCategoria } from '../../shared/utils/icone-categoria';

interface Grupo {
  tipo: TipoTransacao;
  titulo: string;
  categorias: Categoria[];
}

@Component({
  selector: 'app-categorias',
  templateUrl: './categorias.component.html',
  styleUrls: ['./categorias.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class CategoriasComponent {
  private readonly categorias = inject(CategoriasService);
  private readonly toast = inject(ToastController);
  private readonly nav = inject(NavController);
  private readonly outlet = inject(IonRouterOutlet, { optional: true });

  readonly tipoNovo = signal<TipoTransacao>('DESPESA');
  readonly nomeNovo = signal('');
  readonly erro = signal('');

  readonly grupos = computed<Grupo[]>(() => [
    { tipo: 'DESPESA', titulo: 'Despesa', categorias: this.categorias.despesa() },
    { tipo: 'RECEITA', titulo: 'Receita', categorias: this.categorias.receita() },
  ]);

  icone(categoria: Categoria): string {
    return iconeCategoria(categoria);
  }

  async adicionar(): Promise<void> {
    this.erro.set('');
    try {
      const categoria = this.categorias.criar(this.tipoNovo(), this.nomeNovo());
      this.nomeNovo.set('');
      const toast = await this.toast.create({
        message: `Categoria "${categoria.nome}" criada.`,
        duration: 2000,
        position: 'top',
        color: 'dark',
      });
      await toast.present();
    } catch (e) {
      this.erro.set(e instanceof ErroRegra ? e.message : 'Não foi possível criar a categoria.');
    }
  }

  voltar(): void {
    if (this.outlet?.canGoBack()) {
      this.nav.back();
    } else {
      this.nav.navigateBack('/app/mais');
    }
  }
}
