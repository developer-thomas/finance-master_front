export type TipoTransacao = 'RECEITA' | 'DESPESA';

export type TipoConta = 'CONTA_CORRENTE' | 'CONTA_DIGITAL' | 'DINHEIRO' | 'OUTROS';

export type OrigemTransacao = 'APP_MANUAL' | 'APP_AI' | 'WHATSAPP_TEXT' | 'WHATSAPP_IMAGE';

export type EscopoCategoria = 'PADRAO' | 'PERSONALIZADA';

/** Valores monetários sempre em centavos inteiros. Datas de movimentação no formato AAAA-MM-DD. */
export interface ContaFinanceira {
  id: string;
  nome: string;
  tipo: TipoConta;
  saldoInicialCentavos: number;
  ativa: boolean;
  padrao: boolean;
  criadoEm: string;
}

export interface Categoria {
  id: string;
  tipo: TipoTransacao;
  nome: string;
  escopo: EscopoCategoria;
}

export interface Transacao {
  id: string;
  contaId: string;
  categoriaId: string;
  tipo: TipoTransacao;
  valorCentavos: number;
  data: string;
  descricao: string;
  origem: OrigemTransacao;
  criadoEm: string;
  atualizadoEm: string;
  excluidaEm: string | null;
}

export interface VinculoWhatsapp {
  numero: string;
  vinculadoEm: string;
}

export interface CodigoVinculo {
  numero: string;
  codigo: string;
  expiraEm: string;
}

export interface UsuarioSessao {
  uid: string;
  nome: string;
  email: string;
}

export const ROTULO_TIPO_CONTA: Record<TipoConta, string> = {
  CONTA_CORRENTE: 'Conta corrente',
  CONTA_DIGITAL: 'Conta digital',
  DINHEIRO: 'Dinheiro',
  OUTROS: 'Outros',
};

export const ROTULO_ORIGEM: Record<OrigemTransacao, string> = {
  APP_MANUAL: 'Formulário do app',
  APP_AI: 'Texto ou foto lidos no app',
  WHATSAPP_TEXT: 'Mensagem no WhatsApp',
  WHATSAPP_IMAGE: 'Foto no WhatsApp',
};
