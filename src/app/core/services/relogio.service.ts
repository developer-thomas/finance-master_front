import { Injectable } from '@angular/core';

const FUSO = 'America/Sao_Paulo';

const NOMES_MES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

const NOMES_DIA_CURTO = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'];

/** Dia civil do domínio. O fuso do aparelho não decide o que é "hoje". */
@Injectable({ providedIn: 'root' })
export class RelogioService {
  private readonly formatoDia = new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  hoje(): string {
    return this.formatoDia.format(new Date());
  }

  mesAtual(): string {
    return this.hoje().slice(0, 7);
  }

  somarDias(data: string, dias: number): string {
    const [ano, mes, dia] = data.split('-').map(Number);
    const base = new Date(Date.UTC(ano, mes - 1, dia + dias));
    return base.toISOString().slice(0, 10);
  }

  diaDaSemana(data: string): number {
    const [ano, mes, dia] = data.split('-').map(Number);
    return new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay();
  }

  mesAnterior(mes: string): string {
    const [ano, numero] = mes.split('-').map(Number);
    const data = new Date(Date.UTC(ano, numero - 2, 1));
    return data.toISOString().slice(0, 7);
  }

  ultimoDiaDoMes(mes: string): string {
    const [ano, numero] = mes.split('-').map(Number);
    return new Date(Date.UTC(ano, numero, 0)).toISOString().slice(0, 10);
  }

  nomeDoMes(mes: string): string {
    const numero = Number(mes.slice(5, 7));
    return NOMES_MES[numero - 1];
  }

  formatarData(data: string): string {
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  rotuloDoDia(data: string): string {
    const hoje = this.hoje();
    if (data === hoje) {
      return 'Hoje';
    }
    if (data === this.somarDias(hoje, -1)) {
      return 'Ontem';
    }
    return `${NOMES_DIA_CURTO[this.diaDaSemana(data)]} ${this.formatarData(data)}`;
  }
}
