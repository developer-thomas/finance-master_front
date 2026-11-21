import { Categoria } from '../../core/models/financeiro.model';

const ICONES: Record<string, string> = {
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

export function iconeCategoria(categoria: Categoria | undefined): string {
  if (!categoria) {
    return 'pricetag-outline';
  }
  return ICONES[categoria.id] ?? 'pricetag-outline';
}
