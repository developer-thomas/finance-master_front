import { Injectable, computed, inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import { CodigoVinculo } from '../models/financeiro.model';
import { BancoLocalService } from './banco-local.service';
import { ErroRegra } from './erro-regra';
import { FinanceiroApiService } from './financeiro-api.service';

const VALIDADE_CODIGO_MS = 15 * 60 * 1000;

/** Número brasileiro em formato internacional único: +55DDNNNNNNNNN. */
export function normalizarNumero(entrada: string): string | null {
  let digitos = entrada.replace(/\D/g, '');
  if (digitos.length === 12 || digitos.length === 13) {
    if (!digitos.startsWith('55')) return null;
    digitos = digitos.slice(2);
  }
  if (digitos.length !== 10 && digitos.length !== 11) {
    return null;
  }
  if (digitos.length === 11 && digitos[2] !== '9') {
    return null;
  }
  return `+55${digitos}`;
}

export function formatarNumero(numero: string): string {
  const local = numero.replace(/^\+55/, '');
  const ddd = local.slice(0, 2);
  const resto = local.slice(2);
  const corte = resto.length - 4;
  return `+55 (${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`;
}

@Injectable({ providedIn: 'root' })
export class WhatsappService {
  private readonly banco = inject(BancoLocalService);
  private readonly api = inject(FinanceiroApiService);

  readonly vinculo = computed(() => this.banco.dados().vinculo);

  readonly codigoPendente = computed<CodigoVinculo | null>(() => {
    const codigo = this.banco.dados().codigoVinculo;
    return codigo && new Date(codigo.expiraEm).getTime() > Date.now() ? codigo : null;
  });

  /** Emite código de vínculo (API ou local) e guarda no cache. */
  async gerarCodigo(numeroDigitado: string): Promise<CodigoVinculo> {
    if (!environment.dadosLocais) {
      const gerado = await this.api.gerarCodigoWhatsapp(numeroDigitado);
      const codigo: CodigoVinculo = {
        numero: gerado.numero,
        codigo: gerado.codigo,
        expiraEm: gerado.expiraEm,
      };
      this.banco.atualizar((banco) => ({ ...banco, codigoVinculo: codigo }));
      return codigo;
    }

    const numero = normalizarNumero(numeroDigitado);
    if (!numero) {
      throw new ErroRegra('Informe um celular válido com DDD, por exemplo (11) 98765-4321.');
    }
    if (this.vinculo()?.numero === numero) {
      throw new ErroRegra('Este número já está vinculado à sua conta.');
    }
    const aleatorio = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
    const codigo: CodigoVinculo = {
      numero,
      codigo: aleatorio.toString().padStart(6, '0'),
      expiraEm: new Date(Date.now() + VALIDADE_CODIGO_MS).toISOString(),
    };
    this.banco.atualizar((banco) => ({ ...banco, codigoVinculo: codigo }));
    return codigo;
  }

  /** Cancela o código pendente. */
  async cancelarCodigo(): Promise<void> {
    if (!environment.dadosLocais) {
      await this.api.cancelarCodigoWhatsapp();
    }
    this.banco.atualizar((banco) => ({ ...banco, codigoVinculo: null }));
  }

  /** Confirma o código pendente sem WhatsApp real (dev / dadosLocais). */
  async simularConfirmacao(): Promise<void> {
    if (!environment.dadosLocais) {
      const status = await this.api.simularConfirmacaoWhatsapp();
      this.aplicarStatus(status);
      return;
    }

    const pendente = this.codigoPendente();
    if (!pendente) {
      throw new ErroRegra('O código expirou. Gere um novo.');
    }
    this.banco.atualizar((banco) => ({
      ...banco,
      vinculo: { numero: pendente.numero, vinculadoEm: new Date().toISOString() },
      codigoVinculo: null,
    }));
  }

  /** Atualiza vínculo/código no cache a partir da resposta da API. */
  aplicarStatus(status: {
    vinculo: { numero: string; vinculadoEm: string } | null;
    codigoPendente: { numero: string; codigo: string; expiraEm: string } | null;
  }): void {
    const atual = this.banco.dados().codigoVinculo;
    const codigoApi = status.codigoPendente;
    let codigoVinculo: CodigoVinculo | null = null;
    if (codigoApi) {
      const digitos =
        codigoApi.codigo && codigoApi.codigo !== '******'
          ? codigoApi.codigo
          : atual?.numero === codigoApi.numero
            ? atual.codigo
            : codigoApi.codigo;
      codigoVinculo = {
        numero: codigoApi.numero,
        codigo: digitos,
        expiraEm: codigoApi.expiraEm,
      };
    }

    this.banco.atualizar((banco) => ({
      ...banco,
      vinculo: status.vinculo
        ? { numero: status.vinculo.numero, vinculadoEm: status.vinculo.vinculadoEm }
        : null,
      codigoVinculo,
    }));
  }
}
