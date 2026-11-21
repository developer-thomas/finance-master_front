const formatador = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function formatarBRL(centavos: number): string {
  return formatador.format(centavos / 100);
}

/**
 * Lê valores digitados no padrão brasileiro: "45", "45,9", "49,90", "1.234,56", "R$ 1234,5".
 * Ponto seguido de exatamente 1 ou 2 dígitos no fim é tratado como separador decimal ("49.90").
 */
export function lerValorBR(texto: string | null | undefined): number | null {
  if (!texto) {
    return null;
  }
  let limpo = texto.replace(/r\$/gi, '').replace(/\s/g, '').trim();
  if (!limpo || !/^[\d.,]+$/.test(limpo)) {
    return null;
  }

  const pontoDecimal = /^\d+\.\d{1,2}$/.test(limpo);
  if (limpo.includes(',')) {
    limpo = limpo.replace(/\./g, '').replace(',', '.');
  } else if (!pontoDecimal) {
    limpo = limpo.replace(/\./g, '');
  }

  if (!/^\d+(\.\d{1,2})?$/.test(limpo)) {
    return null;
  }
  const [inteiros, decimais = ''] = limpo.split('.');
  const centavos = Number(inteiros) * 100 + Number(decimais.padEnd(2, '0'));
  return Number.isSafeInteger(centavos) ? centavos : null;
}

export function valorParaCampo(centavos: number | null | undefined): string {
  if (centavos == null) {
    return '';
  }
  const inteiros = Math.floor(centavos / 100);
  const resto = (centavos % 100).toString().padStart(2, '0');
  return `${inteiros.toLocaleString('pt-BR')},${resto}`;
}
