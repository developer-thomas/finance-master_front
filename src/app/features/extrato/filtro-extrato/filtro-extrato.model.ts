import { TipoTransacao } from '../../../core/models/financeiro.model';

export type Periodo = 'TUDO' | 'MES_ATUAL' | 'MES_PASSADO' | 'PERSONALIZADO';

export interface FiltroExtrato {
  periodo: Periodo;
  de: string;
  ate: string;
  tipo: TipoTransacao | null;
  categoriaId: string | null;
  contaId: string | null;
}

export const FILTRO_INICIAL: FiltroExtrato = {
  periodo: 'TUDO',
  de: '',
  ate: '',
  tipo: null,
  categoriaId: null,
  contaId: null,
};

export const ROTULO_PERIODO: Record<Periodo, string> = {
  TUDO: 'Todo o período',
  MES_ATUAL: 'Este mês',
  MES_PASSADO: 'Mês passado',
  PERSONALIZADO: 'Escolher datas',
};
