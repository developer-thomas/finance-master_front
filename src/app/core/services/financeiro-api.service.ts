import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  Categoria,
  ContaFinanceira,
  EscopoCategoria,
  OrigemTransacao,
  TipoConta,
  TipoTransacao,
  Transacao,
} from '../models/financeiro.model';
import { ErroRegra } from './erro-regra';

export interface FiltroTransacoesApi {
  busca?: string;
  de?: string | null;
  ate?: string | null;
  tipo?: TipoTransacao | null;
  categoriaId?: string | null;
  contaId?: string | null;
}

interface ContaApi {
  id: string;
  nome: string;
  tipo: TipoConta;
  saldoInicial: number;
  saldo: number;
  ativa: boolean;
  padrao: boolean;
  temLancamentos: boolean;
  criadoEm: string;
}

interface CategoriaApi {
  id: string;
  tipo: TipoTransacao;
  nome: string;
  escopo: EscopoCategoria;
}

interface TransacaoApi {
  id: string;
  contaId: string;
  categoriaId: string;
  tipo: TipoTransacao;
  valor: number;
  data: string;
  descricao: string;
  origem: OrigemTransacao;
  criadoEm: string;
  atualizadoEm: string;
}

export interface ContaApiComSaldo extends ContaFinanceira {
  saldoCentavos: number;
  temLancamentos: boolean;
}

@Injectable({ providedIn: 'root' })
export class FinanceiroApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  eu(): Promise<{ id: string; firebaseUid: string; nome: string; email: string }> {
    return this.pedir(this.http.get<{ id: string; firebaseUid: string; nome: string; email: string }>(`${this.base}/api/eu`));
  }

  listarContas(): Promise<ContaApiComSaldo[]> {
    return this.pedir(this.http.get<ContaApi[]>(`${this.base}/api/contas`)).then((lista) =>
      lista.map((c) => this.mapearConta(c)),
    );
  }

  criarConta(dados: {
    nome: string;
    tipo: TipoConta;
    saldoInicialCentavos: number;
    padrao: boolean;
  }): Promise<ContaApiComSaldo> {
    return this.pedir(
      this.http.post<ContaApi>(`${this.base}/api/contas`, {
        nome: dados.nome,
        tipo: dados.tipo,
        saldoInicial: this.centavosParaReais(dados.saldoInicialCentavos),
        padrao: dados.padrao,
      }),
    ).then((c) => this.mapearConta(c));
  }

  editarConta(
    id: string,
    dados: { nome: string; tipo: TipoConta; saldoInicialCentavos: number; padrao: boolean },
  ): Promise<ContaApiComSaldo> {
    return this.pedir(
      this.http.put<ContaApi>(`${this.base}/api/contas/${id}`, {
        nome: dados.nome,
        tipo: dados.tipo,
        saldoInicial: this.centavosParaReais(dados.saldoInicialCentavos),
        padrao: dados.padrao,
      }),
    ).then((c) => this.mapearConta(c));
  }

  desativarConta(id: string): Promise<void> {
    return this.pedir(this.http.post<void>(`${this.base}/api/contas/${id}/desativar`, {}));
  }

  reativarConta(id: string): Promise<void> {
    return this.pedir(this.http.post<void>(`${this.base}/api/contas/${id}/reativar`, {}));
  }

  listarCategorias(): Promise<Categoria[]> {
    return this.pedir(this.http.get<CategoriaApi[]>(`${this.base}/api/categorias`)).then((lista) =>
      lista.map((c) => ({ id: c.id, tipo: c.tipo, nome: c.nome, escopo: c.escopo })),
    );
  }

  criarCategoria(tipo: TipoTransacao, nome: string): Promise<Categoria> {
    return this.pedir(this.http.post<CategoriaApi>(`${this.base}/api/categorias`, { tipo, nome })).then((c) => ({
      id: c.id,
      tipo: c.tipo,
      nome: c.nome,
      escopo: c.escopo,
    }));
  }

  listarTransacoes(filtro: FiltroTransacoesApi = {}): Promise<Transacao[]> {
    let params = new HttpParams();
    if (filtro.de) params = params.set('de', filtro.de);
    if (filtro.ate) params = params.set('ate', filtro.ate);
    if (filtro.tipo) params = params.set('tipo', filtro.tipo);
    if (filtro.categoriaId) params = params.set('categoriaId', filtro.categoriaId);
    if (filtro.contaId) params = params.set('contaId', filtro.contaId);
    if (filtro.busca) params = params.set('busca', filtro.busca);

    return this.pedir(this.http.get<TransacaoApi[]>(`${this.base}/api/transacoes`, { params })).then((lista) =>
      lista.map((t) => this.mapearTransacao(t)),
    );
  }

  criarTransacao(dados: {
    tipo: TipoTransacao;
    valorCentavos: number;
    data: string;
    descricao: string;
    categoriaId: string;
    contaId: string;
    origem: OrigemTransacao;
  }): Promise<Transacao> {
    return this.pedir(
      this.http.post<TransacaoApi>(`${this.base}/api/transacoes`, {
        tipo: dados.tipo,
        valor: this.centavosParaReais(dados.valorCentavos),
        data: dados.data,
        descricao: dados.descricao,
        categoriaId: dados.categoriaId,
        contaId: dados.contaId,
        origem: dados.origem,
      }),
    ).then((t) => this.mapearTransacao(t));
  }

  editarTransacao(
    id: string,
    dados: {
      tipo: TipoTransacao;
      valorCentavos: number;
      data: string;
      descricao: string;
      categoriaId: string;
      contaId: string;
    },
  ): Promise<Transacao> {
    return this.pedir(
      this.http.put<TransacaoApi>(`${this.base}/api/transacoes/${id}`, {
        tipo: dados.tipo,
        valor: this.centavosParaReais(dados.valorCentavos),
        data: dados.data,
        descricao: dados.descricao,
        categoriaId: dados.categoriaId,
        contaId: dados.contaId,
      }),
    ).then((t) => this.mapearTransacao(t));
  }

  excluirTransacao(id: string): Promise<void> {
    return this.pedir(this.http.delete<void>(`${this.base}/api/transacoes/${id}`));
  }

  statusWhatsapp(): Promise<{
    vinculo: { numero: string; vinculadoEm: string } | null;
    codigoPendente: { numero: string; codigo: string; expiraEm: string } | null;
  }> {
    return this.pedir(
      this.http.get<{
        vinculo: { numero: string; vinculadoEm: string } | null;
        codigoPendente: { numero: string; codigo: string; expiraEm: string } | null;
      }>(`${this.base}/api/whatsapp`),
    );
  }

  gerarCodigoWhatsapp(numero: string): Promise<{ numero: string; codigo: string; expiraEm: string }> {
    return this.pedir(
      this.http.post<{ numero: string; codigo: string; expiraEm: string }>(`${this.base}/api/whatsapp/codigo`, {
        numero,
      }),
    );
  }

  cancelarCodigoWhatsapp(): Promise<void> {
    return this.pedir(this.http.delete<void>(`${this.base}/api/whatsapp/codigo`));
  }

  simularConfirmacaoWhatsapp(): Promise<{
    vinculo: { numero: string; vinculadoEm: string } | null;
    codigoPendente: { numero: string; codigo: string; expiraEm: string } | null;
  }> {
    return this.pedir(
      this.http.post<{
        vinculo: { numero: string; vinculadoEm: string } | null;
        codigoPendente: { numero: string; codigo: string; expiraEm: string } | null;
      }>(`${this.base}/api/whatsapp/simular-confirmacao`, {}),
    );
  }

  private mapearConta(c: ContaApi): ContaApiComSaldo {
    return {
      id: c.id,
      nome: c.nome,
      tipo: c.tipo,
      saldoInicialCentavos: this.reaisParaCentavos(c.saldoInicial),
      saldoCentavos: this.reaisParaCentavos(c.saldo),
      ativa: c.ativa,
      padrao: c.padrao,
      temLancamentos: c.temLancamentos,
      criadoEm: c.criadoEm,
    };
  }

  private mapearTransacao(t: TransacaoApi): Transacao {
    return {
      id: t.id,
      contaId: t.contaId,
      categoriaId: t.categoriaId,
      tipo: t.tipo,
      valorCentavos: this.reaisParaCentavos(t.valor),
      data: t.data,
      descricao: t.descricao,
      origem: t.origem,
      criadoEm: t.criadoEm,
      atualizadoEm: t.atualizadoEm,
      excluidaEm: null,
    };
  }

  private reaisParaCentavos(valor: number): number {
    return Math.round(Number(valor) * 100);
  }

  private centavosParaReais(centavos: number): number {
    return centavos / 100;
  }

  private async pedir<T>(obs: import('rxjs').Observable<T>): Promise<T> {
    try {
      return await firstValueFrom(obs);
    } catch (e) {
      throw this.mapearErro(e);
    }
  }

  private mapearErro(erro: unknown): Error {
    if (erro instanceof HttpErrorResponse) {
      const mensagem = (erro.error as { mensagem?: string } | null)?.mensagem;
      if (mensagem) {
        return new ErroRegra(mensagem);
      }
      if (erro.status === 0) {
        return new ErroRegra('Não foi possível falar com a API. Confira se o backend está no ar.');
      }
      return new ErroRegra('Não foi possível concluir a operação. Tente novamente.');
    }
    return erro instanceof Error ? erro : new Error('Erro desconhecido.');
  }
}
