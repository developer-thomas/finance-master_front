import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AlertController, IonRouterOutlet, NavController } from '@ionic/angular';

import { environment } from '../../../environments/environment';
import { SessaoService } from '../../core/services/sessao.service';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class PerfilComponent {
  private readonly sessao = inject(SessaoService);
  private readonly nav = inject(NavController);
  private readonly alerta = inject(AlertController);
  private readonly outlet = inject(IonRouterOutlet, { optional: true });

  readonly usuario = this.sessao.usuario;
  readonly modoLocal = environment.dadosLocais;

  readonly iniciais = computed(() =>
    (this.usuario()?.nome ?? '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join(''),
  );

  async sair(): Promise<void> {
    const alerta = await this.alerta.create({
      header: 'Sair da conta?',
      message: 'Você precisará entrar de novo com e-mail e senha.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Sair', role: 'confirm' },
      ],
    });
    await alerta.present();
    const { role } = await alerta.onDidDismiss();
    if (role === 'confirm') {
      await this.sessao.sair();
      await this.nav.navigateRoot('/entrar');
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
