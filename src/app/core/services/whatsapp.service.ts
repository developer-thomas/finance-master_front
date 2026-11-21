import { Injectable, computed, inject } from '@angular/core';

import { CodigoVinculo } from '../models/financeiro.model';
import { BancoLocalService } from './banco-local.service';
import { ErroRegra } from './erro-regra';

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

  readonly vinculo = computed(() => this.banco.dados().vinculo);

  readonly codigoPendente = computed<CodigoVinculo | null>(() => {
    const codigo = this.banco.dados().codigoVinculo;
    return codigo && new Date(codigo.expiraEm).getTime() > Date.now() ? codigo : null;
  });

  gerarCodigo(numeroDigitado: string): CodigoVinculo {
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

  cancelarCodigo(): void {
    this.banco.atualizar((banco) => ({ ...banco, codigoVinculo: null }));
  }

  /** No modo local não há WhatsApp de verdade: simula a chegada da mensagem com o código. */
  simularConfirmacao(): void {
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
}
