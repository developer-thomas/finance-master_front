import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';

import { ContasService } from '../../core/services/contas.service';
import { SessaoService } from '../../core/services/sessao.service';

interface ItemMenu {
  rotulo: string;
  icone: string;
  rota: string;
}

/** Rotas que já têm ação principal própria e escondem a barra inferior no celular. */
const SEM_BARRA = /^\/app\/(transacoes|assistente)(\/|$)/;

@Component({
  selector: 'app-shell',
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ShellComponent {
  private readonly router = inject(Router);
  private readonly sessao = inject(SessaoService);
  private readonly contas = inject(ContasService);

  readonly usuario = this.sessao.usuario;
  readonly saldoTotal = this.contas.saldoTotalCentavos;

  readonly menuLateral: ItemMenu[] = [
    { rotulo: 'Início', icone: 'home-outline', rota: '/app/inicio' },
    { rotulo: 'Extrato', icone: 'list-outline', rota: '/app/extrato' },
    { rotulo: 'Assistente', icone: 'chatbubbles-outline', rota: '/app/assistente' },
    { rotulo: 'Contas', icone: 'wallet-outline', rota: '/app/contas' },
    { rotulo: 'Categorias', icone: 'pricetags-outline', rota: '/app/categorias' },
    { rotulo: 'Perfil', icone: 'person-circle-outline', rota: '/app/perfil' },
  ];

  readonly barraEsquerda: ItemMenu[] = [
    { rotulo: 'Início', icone: 'home-outline', rota: '/app/inicio' },
    { rotulo: 'Extrato', icone: 'list-outline', rota: '/app/extrato' },
  ];

  readonly barraDireita: ItemMenu[] = [
    { rotulo: 'Contas', icone: 'wallet-outline', rota: '/app/contas' },
    { rotulo: 'Mais', icone: 'menu-outline', rota: '/app/mais' },
  ];

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly mostrarBarra = computed(() => !SEM_BARRA.test(this.url()));

  readonly iniciais = computed(() =>
    (this.usuario()?.nome ?? '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join(''),
  );

  ativo(rota: string): boolean {
    const url = this.url();
    if (rota === '/app/mais') {
      return ['/app/mais', '/app/categorias', '/app/perfil', '/app/assistente'].some((r) =>
        url.startsWith(r),
      );
    }
    return url.startsWith(rota);
  }
}
