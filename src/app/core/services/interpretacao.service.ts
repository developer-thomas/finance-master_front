import { Injectable, inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import { TipoTransacao } from '../models/financeiro.model';
import { lerValorBR } from '../utils/dinheiro.util';
import { CategoriasService } from './categorias.service';
import { FinanceiroApiService } from './financeiro-api.service';
import { RelogioService } from './relogio.service';

/** Sugestão que só preenche o formulário. Nada é gravado aqui. */
export interface Sugestao {
  tipo: TipoTransacao | null;
  valorCentavos: number;
  data: string;
  descricao: string;
  categoriaId: string | null;
  /** Nome sugerido que não existe entre as categorias; o formulário mostra Outros. */
  categoriaNaoEncontrada: string | null;
}

export type ResultadoLeitura =
  | { ok: true; sugestao: Sugestao }
  | { ok: false; motivo: string };

const VERBOS_DESPESA = [
  'gastei', 'paguei', 'comprei', 'gasto', 'despesa', 'pagamento', 'pago', 'transferi', 'mandei', 'enviei', 'fiz um pix', 'fiz pix',
];
const VERBOS_RECEITA = [
  'recebi', 'ganhei', 'entrou', 'caiu', 'receita', 'recebimento', 'me pagou', 'me pagaram', 'me mandou', 'me transferiu',
];

/** Palavras que indicam categoria. A chave é o nome da categoria padrão. */
const PISTAS: Record<TipoTransacao, Record<string, string[]>> = {
  DESPESA: {
    'Alimentação': ['almoco', 'almocei', 'jantar', 'jantei', 'lanche', 'restaurante', 'ifood', 'cafe', 'padaria', 'pizza', 'hamburguer', 'comida'],
    Mercado: ['mercado', 'supermercado', 'feira', 'acougue', 'hortifruti', 'atacadao'],
    Transporte: ['uber', '99', 'gasolina', 'combustivel', 'onibus', 'metro', 'estacionamento', 'posto', 'taxi', 'pedagio'],
    Moradia: ['aluguel', 'condominio', 'luz', 'energia', 'agua', 'internet', 'gas', 'iptu'],
    'Saúde': ['farmacia', 'remedio', 'medico', 'consulta', 'dentista', 'exame', 'plano de saude', 'academia'],
    'Educação': ['curso', 'faculdade', 'escola', 'livro', 'mensalidade', 'apostila'],
    Lazer: ['cinema', 'show', 'bar', 'viagem', 'passeio', 'ingresso', 'cerveja'],
    Compras: ['roupa', 'tenis', 'loja', 'presente', 'shopping', 'amazon', 'shopee', 'mercado livre'],
    Assinaturas: ['netflix', 'spotify', 'assinatura', 'streaming', 'prime', 'disney', 'youtube premium', 'icloud'],
  },
  RECEITA: {
    'Salário': ['salario', 'pagamento do mes', 'holerite'],
    Freelance: ['freela', 'freelance', 'projeto', 'cliente', 'job'],
    Reembolso: ['reembolso', 'devolucao', 'estorno'],
    'Transferência recebida': ['transferencia', 'pix'],
    Investimentos: ['dividendo', 'dividendos', 'rendimento', 'rendimentos', 'juros', 'investimento'],
  },
};

const DIAS_SEMANA = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

const PALAVRAS_VAZIAS = new Set([
  'no', 'na', 'nos', 'nas', 'de', 'do', 'da', 'dos', 'das', 'com', 'em', 'o', 'a', 'os', 'as', 'um', 'uma',
  'pro', 'pra', 'para', 'por', 'reais', 'real', 'conto', 'contos', 'r$', 'hoje', 'ontem', 'anteontem', 'dia',
  'feira', 'e', 'que', 'eu', 'meu', 'minha',
]);

function normalizar(texto: string): string {
  return texto
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function contemPalavra(texto: string, termo: string): boolean {
  const escapado = termo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^\\p{L}\\d])${escapado}($|[^\\p{L}\\d])`, 'u').test(texto);
}

/**
 * Interpretação de texto/foto para preencher o formulário.
 * Com API ativa, chama o backend; se falhar a rede, cai na heurística local (US-053).
 */
@Injectable({ providedIn: 'root' })
export class InterpretacaoService {
  private readonly relogio = inject(RelogioService);
  private readonly categorias = inject(CategoriasService);
  private readonly api = inject(FinanceiroApiService);

  /** Lê texto livre e devolve sugestão estruturada (sem gravar). */
  async lerTexto(texto: string): Promise<ResultadoLeitura> {
    if (!environment.dadosLocais) {
      try {
        const remoto = await this.api.interpretarTexto(texto);
        if (!remoto.ok) {
          return { ok: false, motivo: remoto.motivo };
        }
        return {
          ok: true,
          sugestao: {
            tipo: remoto.sugestao.tipo,
            valorCentavos: Math.round(Number(remoto.sugestao.valor) * 100),
            data: remoto.sugestao.data,
            descricao: remoto.sugestao.descricao,
            categoriaId: remoto.sugestao.categoriaId,
            categoriaNaoEncontrada: remoto.sugestao.categoriaNaoEncontrada,
          },
        };
      } catch {
        // Mantém o app útil sem IA/API (US-053).
      }
    }

    return this.lerTextoLocal(texto);
  }

  /** Lê comprovante/nota: API (Gemini) ou falha amigável se indisponível. */
  async lerImagem(arquivo: File): Promise<ResultadoLeitura> {
    if (!environment.dadosLocais) {
      try {
        const remoto = await this.api.interpretarImagem(arquivo);
        if (!remoto.ok) {
          return { ok: false, motivo: remoto.motivo };
        }
        return {
          ok: true,
          sugestao: {
            tipo: remoto.sugestao.tipo,
            valorCentavos: Math.round(Number(remoto.sugestao.valor) * 100),
            data: remoto.sugestao.data,
            descricao: remoto.sugestao.descricao,
            categoriaId: remoto.sugestao.categoriaId,
            categoriaNaoEncontrada: remoto.sugestao.categoriaNaoEncontrada,
          },
        };
      } catch {
        // Sem API/IA, o formulário manual continua disponível.
      }
    }

    return {
      ok: false,
      motivo:
        'Não consegui ler o valor total desta imagem. Preencha o formulário ou tente outra foto, mais nítida.',
    };
  }

  /** Heurística local (fallback e modo dadosLocais). */
  private async lerTextoLocal(texto: string): Promise<ResultadoLeitura> {
    await this.esperar(300);
    const original = texto.trim();
    if (!original) {
      return { ok: false, motivo: 'Escreva o que aconteceu, por exemplo: "gastei 49,90 no almoço hoje".' };
    }
    const base = normalizar(original);

    const { data, semData } = this.lerData(base);
    const valor = this.lerValor(semData);
    if (!valor) {
      return {
        ok: false,
        motivo: 'Não encontrei o valor no texto. Preencha o formulário ou tente de novo com o valor, como "R$ 45".',
      };
    }

    const tipo = this.lerTipo(base);
    const categoria = tipo ? this.lerCategoria(tipo, base) : { id: null, naoEncontrada: null };

    return {
      ok: true,
      sugestao: {
        tipo,
        valorCentavos: valor.centavos,
        data,
        descricao: this.lerDescricao(original, valor.trecho),
        categoriaId: categoria.id,
        categoriaNaoEncontrada: categoria.naoEncontrada,
      },
    };
  }

  private lerTipo(texto: string): TipoTransacao | null {
    const despesa = VERBOS_DESPESA.some((v) => contemPalavra(texto, v));
    const receita = VERBOS_RECEITA.some((v) => contemPalavra(texto, v));
    if (despesa !== receita) {
      return despesa ? 'DESPESA' : 'RECEITA';
    }
    if (!despesa) {
      if (this.temPista('DESPESA', texto) && !this.temPista('RECEITA', texto)) return 'DESPESA';
      if (this.temPista('RECEITA', texto) && !this.temPista('DESPESA', texto) && !contemPalavra(texto, 'pix')) return 'RECEITA';
    }
    return null;
  }

  private temPista(tipo: TipoTransacao, texto: string): boolean {
    return Object.values(PISTAS[tipo]).some((termos) => termos.some((t) => contemPalavra(texto, t)));
  }

  private lerCategoria(tipo: TipoTransacao, texto: string): { id: string; naoEncontrada: string | null } {
    const propria = this.categorias
      .doTipo(tipo)
      .find((c) => c.escopo === 'PERSONALIZADA' && contemPalavra(texto, normalizar(c.nome)));
    if (propria) {
      return { id: propria.id, naoEncontrada: null };
    }
    for (const [nome, termos] of Object.entries(PISTAS[tipo])) {
      if (termos.some((t) => contemPalavra(texto, t))) {
        const categoria = this.categorias.porNome(tipo, nome);
        if (categoria) {
          return { id: categoria.id, naoEncontrada: null };
        }
        return { id: this.categorias.outros(tipo).id, naoEncontrada: nome };
      }
    }
    return { id: this.categorias.outros(tipo).id, naoEncontrada: null };
  }

  private lerData(texto: string): { data: string; semData: string } {
    const hoje = this.relogio.hoje();

    const explicita = texto.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
    if (explicita) {
      const [trecho, d, m, a] = explicita;
      const ano = a ? (a.length === 2 ? `20${a}` : a) : hoje.slice(0, 4);
      const data = `${ano}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      if (this.dataValida(data)) {
        return { data, semData: texto.replace(trecho, ' ') };
      }
    }

    const diaDoMes = texto.match(/\bdia (\d{1,2})\b/);
    if (diaDoMes) {
      let data = `${hoje.slice(0, 7)}-${diaDoMes[1].padStart(2, '0')}`;
      if (data > hoje) {
        data = `${this.relogio.mesAnterior(hoje.slice(0, 7))}-${diaDoMes[1].padStart(2, '0')}`;
      }
      if (this.dataValida(data)) {
        return { data, semData: texto.replace(diaDoMes[0], ' ') };
      }
    }

    if (contemPalavra(texto, 'anteontem')) {
      return { data: this.relogio.somarDias(hoje, -2), semData: texto };
    }
    if (contemPalavra(texto, 'ontem')) {
      return { data: this.relogio.somarDias(hoje, -1), semData: texto };
    }
    const indice = DIAS_SEMANA.findIndex((dia) => contemPalavra(texto, dia));
    if (indice >= 0) {
      const recuo = (this.relogio.diaDaSemana(hoje) - indice + 7) % 7;
      return { data: this.relogio.somarDias(hoje, -recuo), semData: texto };
    }
    return { data: hoje, semData: texto };
  }

  private lerValor(texto: string): { centavos: number; trecho: string } | null {
    const candidatos = [...texto.matchAll(/(r\$\s*)?(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)(\s*(?:reais|real|contos?))?/g)];
    const preferido =
      candidatos.find((c) => c[1] || c[3] || c[2].includes(',')) ??
      candidatos.find((c) => !/^99$/.test(c[2]) || candidatos.length === 1);
    if (!preferido) {
      return null;
    }
    const centavos = lerValorBR(preferido[2]);
    return centavos && centavos > 0 ? { centavos, trecho: preferido[0] } : null;
  }

  private lerDescricao(original: string, trechoValor: string): string {
    const termosRemovidos = new Set([...VERBOS_DESPESA, ...VERBOS_RECEITA].filter((v) => !v.includes(' ')));
    const palavras = original
      .replace(new RegExp(trechoValor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), ' ')
      .replace(/\b\d{1,2}\/\d{1,2}(\/\d{2,4})?\b/g, ' ')
      .replace(/\bdia \d{1,2}\b/gi, ' ')
      .split(/\s+/)
      .filter((p) => p && !/^[\d.,]+$/.test(p));

    const uteis = palavras.filter((p) => {
      const n = normalizar(p).replace(/[^\p{L}\d$]/gu, '');
      return n && !termosRemovidos.has(n) && !PALAVRAS_VAZIAS.has(n) && !DIAS_SEMANA.some((d) => n.startsWith(d));
    });
    const texto = uteis.join(' ').replace(/[,.;:!?]+$/, '').trim();
    return texto ? texto.charAt(0).toLocaleUpperCase('pt-BR') + texto.slice(1) : '';
  }

  private dataValida(data: string): boolean {
    const [ano, mes, dia] = data.split('-').map(Number);
    const teste = new Date(Date.UTC(ano, mes - 1, dia));
    return teste.getUTCFullYear() === ano && teste.getUTCMonth() === mes - 1 && teste.getUTCDate() === dia;
  }

  private esperar(ms: number): Promise<void> {
    return new Promise((resolver) => setTimeout(resolver, ms));
  }
}
