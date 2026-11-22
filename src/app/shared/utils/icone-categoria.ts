import { Categoria } from '../../core/models/financeiro.model';

const ICONES_POR_ID: Record<string, string> = {
  'padrao-despesa-alimentacao': 'restaurant-outline',
  'padrao-despesa-mercado': 'cart-outline',
  'padrao-despesa-transporte': 'car-outline',
  'padrao-despesa-moradia': 'home-outline',
  'padrao-despesa-saude': 'medkit-outline',
  'padrao-despesa-educacao': 'school-outline',
  'padrao-despesa-lazer': 'happy-outline',
  'padrao-despesa-compras': 'bag-handle-outline',
  'padrao-despesa-assinaturas': 'repeat-outline',
  'padrao-despesa-outros': 'ellipsis-horizontal',
  'padrao-receita-salario': 'briefcase-outline',
  'padrao-receita-freelance': 'laptop-outline',
  'padrao-receita-reembolso': 'return-down-back-outline',
  'padrao-receita-transferencia': 'arrow-down-outline',
  'padrao-receita-investimentos': 'trending-up-outline',
  'padrao-receita-outros': 'ellipsis-horizontal',
};

const ICONES_POR_NOME: Record<string, string> = {
  alimentacao: 'restaurant-outline',
  mercado: 'cart-outline',
  transporte: 'car-outline',
  moradia: 'home-outline',
  saude: 'medkit-outline',
  educacao: 'school-outline',
  lazer: 'happy-outline',
  compras: 'bag-handle-outline',
  assinaturas: 'repeat-outline',
  outros: 'ellipsis-horizontal',
  salario: 'briefcase-outline',
  freelance: 'laptop-outline',
  reembolso: 'return-down-back-outline',
  'transferencia recebida': 'arrow-down-outline',
  investimentos: 'trending-up-outline',
};

function chave(nome: string): string {
  return nome
    .trim()
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Ícone da categoria: por id local (offline) ou pelo nome (API/GUID). */
export function iconeCategoria(categoria: Categoria | undefined): string {
  if (!categoria) {
    return 'pricetag-outline';
  }
  return (
    ICONES_POR_ID[categoria.id] ??
    ICONES_POR_NOME[chave(categoria.nome)] ??
    'pricetag-outline'
  );
}
