import { Injectable, inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import { ContaFinanceira, UsuarioSessao } from '../models/financeiro.model';
import { AuthService } from './auth.service';
import { BancoLocalService } from './banco-local.service';
import { FinanceiroApiService } from './financeiro-api.service';

/** Mantém o livro de dados alinhado ao usuário autenticado. */
@Injectable({ providedIn: 'root' })
export class SessaoService {
  private readonly auth = inject(AuthService);
  private readonly banco = inject(BancoLocalService);
  private readonly api = inject(FinanceiroApiService);
  private carregandoApi: Promise<void> | null = null;
  private uidCarregado: string | null = null;

  readonly usuario = this.auth.usuario;

  async carregar(): Promise<UsuarioSessao | null> {
    await this.auth.aguardarSessao();
    await this.sincronizar();
    return this.auth.usuario();
  }

  async entrar(email: string, senha: string): Promise<void> {
    await this.auth.entrar(email, senha);
    await this.sincronizar();
  }

  async criarConta(nome: string, email: string, senha: string): Promise<void> {
    await this.auth.criarConta(nome, email, senha);
    await this.sincronizar();
  }

  async sair(): Promise<void> {
    await this.auth.sair();
    this.uidCarregado = null;
    this.carregandoApi = null;
    this.banco.fechar();
  }

  private async sincronizar(): Promise<void> {
    const usuario = this.auth.usuario();
    if (!usuario) {
      this.uidCarregado = null;
      this.carregandoApi = null;
      this.banco.fechar();
      return;
    }

    this.banco.abrir(usuario.uid);

    if (environment.dadosLocais) {
      return;
    }

    if (this.uidCarregado === usuario.uid && !this.carregandoApi) {
      return;
    }

    if (this.carregandoApi && this.uidCarregado === usuario.uid) {
      await this.carregandoApi;
      return;
    }

    this.uidCarregado = usuario.uid;
    this.carregandoApi = this.carregarApi();
    try {
      await this.carregandoApi;
    } finally {
      this.carregandoApi = null;
    }
  }

  private async carregarApi(): Promise<void> {
    await this.api.eu();
    const [contasApi, categorias, transacoes] = await Promise.all([
      this.api.listarContas(),
      this.api.listarCategorias(),
      this.api.listarTransacoes(),
    ]);

    const metasConta: Record<string, { saldoCentavos: number; temLancamentos: boolean }> = {};
    const contas: ContaFinanceira[] = contasApi.map((c) => {
      metasConta[c.id] = { saldoCentavos: c.saldoCentavos, temLancamentos: c.temLancamentos };
      return {
        id: c.id,
        nome: c.nome,
        tipo: c.tipo,
        saldoInicialCentavos: c.saldoInicialCentavos,
        ativa: c.ativa,
        padrao: c.padrao,
        criadoEm: c.criadoEm,
      };
    });

    this.banco.substituir({
      contas,
      categoriasPersonalizadas: categorias,
      transacoes,
      metasConta,
    });
  }
}
