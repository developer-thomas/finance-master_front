import { Categoria } from './financeiro.model';

export const CATEGORIAS_PADRAO: readonly Categoria[] = [
  { id: 'padrao-despesa-alimentacao', tipo: 'DESPESA', nome: 'Alimentação', escopo: 'PADRAO' },
  { id: 'padrao-despesa-mercado', tipo: 'DESPESA', nome: 'Mercado', escopo: 'PADRAO' },
  { id: 'padrao-despesa-transporte', tipo: 'DESPESA', nome: 'Transporte', escopo: 'PADRAO' },
  { id: 'padrao-despesa-moradia', tipo: 'DESPESA', nome: 'Moradia', escopo: 'PADRAO' },
  { id: 'padrao-despesa-saude', tipo: 'DESPESA', nome: 'Saúde', escopo: 'PADRAO' },
  { id: 'padrao-despesa-educacao', tipo: 'DESPESA', nome: 'Educação', escopo: 'PADRAO' },
  { id: 'padrao-despesa-lazer', tipo: 'DESPESA', nome: 'Lazer', escopo: 'PADRAO' },
  { id: 'padrao-despesa-compras', tipo: 'DESPESA', nome: 'Compras', escopo: 'PADRAO' },
  { id: 'padrao-despesa-assinaturas', tipo: 'DESPESA', nome: 'Assinaturas', escopo: 'PADRAO' },
  { id: 'padrao-despesa-outros', tipo: 'DESPESA', nome: 'Outros', escopo: 'PADRAO' },
  { id: 'padrao-receita-salario', tipo: 'RECEITA', nome: 'Salário', escopo: 'PADRAO' },
  { id: 'padrao-receita-freelance', tipo: 'RECEITA', nome: 'Freelance', escopo: 'PADRAO' },
  { id: 'padrao-receita-reembolso', tipo: 'RECEITA', nome: 'Reembolso', escopo: 'PADRAO' },
  { id: 'padrao-receita-transferencia', tipo: 'RECEITA', nome: 'Transferência recebida', escopo: 'PADRAO' },
  { id: 'padrao-receita-investimentos', tipo: 'RECEITA', nome: 'Investimentos', escopo: 'PADRAO' },
  { id: 'padrao-receita-outros', tipo: 'RECEITA', nome: 'Outros', escopo: 'PADRAO' },
];

export const CATEGORIA_OUTROS = {
  DESPESA: 'padrao-despesa-outros',
  RECEITA: 'padrao-receita-outros',
} as const;
