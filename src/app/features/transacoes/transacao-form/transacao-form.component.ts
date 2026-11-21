import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { IonRouterOutlet, NavController, ToastController } from '@ionic/angular';
import { map } from 'rxjs';

import { OrigemTransacao, TipoTransacao, Transacao } from '../../../core/models/financeiro.model';
import { CategoriasService } from '../../../core/services/categorias.service';
import { ContasService } from '../../../core/services/contas.service';
import { ErroRegra } from '../../../core/services/erro-regra';
import { RelogioService } from '../../../core/services/relogio.service';
import { LIMITE_DESCRICAO, TransacoesService } from '../../../core/services/transacoes.service';
import { lerValorBR, valorParaCampo } from '../../../core/utils/dinheiro.util';
import { iconeCategoria } from '../../../shared/utils/icone-categoria';
import { LeituraConcluida } from '../entrada-rapida/entrada-rapida.component';

interface Aviso {
  icone: string;
  texto: string;
}

@Component({
  selector: 'app-transacao-form',
  templateUrl: './transacao-form.component.html',
  styleUrls: ['./transacao-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class TransacaoFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly nav = inject(NavController);
  private readonly outlet = inject(IonRouterOutlet, { optional: true });
  private readonly toast = inject(ToastController);
  private readonly transacoes = inject(TransacoesService);
  private readonly categorias = inject(CategoriasService);
  private readonly contas = inject(ContasService);
  private readonly relogio = inject(RelogioService);

  readonly limiteDescricao = LIMITE_DESCRICAO;
  readonly hoje = this.relogio.hoje();
  readonly ontem = this.relogio.somarDias(this.hoje, -1);

  readonly form = new FormGroup({
    tipo: new FormControl<TipoTransacao | null>('DESPESA', Validators.required),
    valor: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, (c) => ((lerValorBR(c.value) ?? 0) > 0 ? null : { valor: true })],
    }),
    descricao: new FormControl('', { nonNullable: true, validators: Validators.maxLength(LIMITE_DESCRICAO) }),
    categoriaId: new FormControl<string | null>(null, Validators.required),
    contaId: new FormControl<string | null>(null, Validators.required),
    data: new FormControl(this.hoje, { nonNullable: true, validators: Validators.required }),
  });

  private readonly valores = toSignal(this.form.valueChanges.pipe(map(() => this.form.getRawValue())), {
    initialValue: this.form.getRawValue(),
  });

  readonly original = signal<Transacao | null>(null);
  readonly naoEncontrada = signal(false);
  readonly editando = computed(() => !!this.original());
  readonly modoTexto = signal(false);
  readonly origem = signal<OrigemTransacao>('APP_MANUAL');
  readonly avisos = signal<Aviso[]>([]);
  readonly preenchidoPor = signal<'texto' | 'foto' | null>(null);
  readonly erro = signal('');
  readonly salvando = signal(false);

  readonly tipo = computed(() => this.valores().tipo ?? null);
  readonly valoresCategoria = computed(() => this.valores().categoriaId);
  readonly valoresData = computed(() => this.valores().data);
  readonly dataFutura = computed(() => (this.valores().data ?? '') > this.hoje);

  readonly opcoesCategoria = computed(() => {
    const tipo = this.tipo();
    return tipo
      ? this.categorias.doTipo(tipo).map((c) => ({ id: c.id, nome: c.nome, icone: iconeCategoria(c) }))
      : [];
  });

  /** Contas ativas; na edição, a conta atual continua na lista mesmo se estiver inativa. */
  readonly opcoesConta = computed(() => {
    const atualId = this.original()?.contaId;
    return this.contas
      .todas()
      .filter((c) => c.ativa || c.id === atualId)
      .map((c) => ({
        id: c.id,
        rotulo: `${c.nome}${c.padrao ? ' · padrão' : ''}${c.ativa ? '' : ' (inativa)'}`,
      }));
  });

  readonly semContaAtiva = computed(() => !this.editando() && this.contas.ativas().length === 0);

  readonly titulo = computed(() => (this.editando() ? 'Editar transação' : 'Nova transação'));

  readonly rotuloSalvar = computed(() => {
    const tipo = this.tipo();
    if (this.editando()) return 'Salvar alterações';
    return tipo === 'RECEITA' ? 'Salvar receita' : tipo === 'DESPESA' ? 'Salvar despesa' : 'Salvar';
  });

  ngOnInit(): void {
    this.modoTexto.set(this.route.snapshot.queryParamMap.get('modo') === 'texto');
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const transacao = this.transacoes.porId(id);
      if (!transacao) {
        this.naoEncontrada.set(true);
        return;
      }
      this.original.set(transacao);
      this.form.setValue({
        tipo: transacao.tipo,
        valor: valorParaCampo(transacao.valorCentavos),
        descricao: transacao.descricao,
        categoriaId: transacao.categoriaId,
        contaId: transacao.contaId,
        data: transacao.data,
      });
      this.form.controls.tipo.disable();
    } else {
      this.form.controls.contaId.setValue(this.contas.padrao()?.id ?? null);
    }
  }

  escolherTipo(tipo: TipoTransacao): void {
    if (this.editando() || this.tipo() === tipo) {
      return;
    }
    this.form.controls.tipo.setValue(tipo);
    const categoria = this.categorias.porId(this.form.controls.categoriaId.value ?? '');
    if (categoria && categoria.tipo !== tipo) {
      this.form.controls.categoriaId.setValue(null);
    }
    this.avisos.update((lista) => lista.filter((a) => a.icone !== 'help-circle-outline'));
  }

  escolherCategoria(id: string): void {
    this.form.controls.categoriaId.setValue(id);
    this.form.controls.categoriaId.markAsTouched();
  }

  escolherData(data: string): void {
    this.form.controls.data.setValue(data);
  }

  aplicarLeitura({ sugestao, origem }: LeituraConcluida): void {
    const contaPadrao = this.contas.padrao()?.id ?? null;
    this.form.reset({
      tipo: sugestao.tipo,
      valor: valorParaCampo(sugestao.valorCentavos),
      descricao: sugestao.descricao,
      categoriaId: sugestao.categoriaId,
      contaId: contaPadrao,
      data: sugestao.data,
    });
    this.origem.set('APP_AI');
    this.preenchidoPor.set(origem);
    this.erro.set('');

    const avisos: Aviso[] = [];
    if (!sugestao.tipo) {
      avisos.push({ icone: 'help-circle-outline', texto: 'Não ficou claro se é receita ou despesa. Escolha abaixo.' });
    }
    if (sugestao.categoriaNaoEncontrada) {
      avisos.push({
        icone: 'pricetag-outline',
        texto: `A categoria "${sugestao.categoriaNaoEncontrada}" não existe. Usamos Outros; troque se quiser.`,
      });
    }
    this.avisos.set(avisos);
  }

  /** Se a leitura anterior tinha preenchido o formulário, ele volta ao branco; o que a pessoa digitou fica. */
  leituraFalhou(): void {
    if (this.preenchidoPor()) {
      this.form.reset({
        tipo: 'DESPESA',
        valor: '',
        descricao: '',
        categoriaId: null,
        contaId: this.contas.padrao()?.id ?? null,
        data: this.hoje,
      });
    }
    this.preenchidoPor.set(null);
    this.avisos.set([]);
    this.origem.set('APP_MANUAL');
  }

  async salvar(): Promise<void> {
    this.erro.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.erro.set(this.primeiroErro());
      return;
    }
    const valores = this.form.getRawValue();
    const dados = {
      tipo: valores.tipo!,
      valorCentavos: lerValorBR(valores.valor)!,
      descricao: valores.descricao,
      categoriaId: valores.categoriaId!,
      contaId: valores.contaId!,
      data: valores.data,
    };

    this.salvando.set(true);
    try {
      const original = this.original();
      if (original) {
        this.transacoes.editar(original.id, dados);
      } else {
        this.transacoes.criar({ ...dados, origem: this.origem() });
      }
      await this.avisar(original ? 'Alterações salvas.' : dados.tipo === 'RECEITA' ? 'Receita salva.' : 'Despesa salva.');
      this.voltar();
    } catch (e) {
      this.erro.set(e instanceof ErroRegra ? e.message : 'Não foi possível salvar. Tente novamente.');
    } finally {
      this.salvando.set(false);
    }
  }

  voltar(): void {
    if (this.outlet?.canGoBack()) {
      this.nav.back();
      return;
    }
    const original = this.original();
    this.nav.navigateBack(original ? ['/app/transacoes', original.id] : '/app/inicio');
  }

  campoInvalido(nome: keyof typeof this.form.controls): boolean {
    const campo = this.form.controls[nome];
    return campo.invalid && campo.touched;
  }

  private primeiroErro(): string {
    const c = this.form.controls;
    if (c.tipo.invalid) return 'Escolha se é receita ou despesa.';
    if (c.valor.invalid) return 'Informe um valor maior que zero.';
    if (c.categoriaId.invalid) return 'Escolha uma categoria.';
    if (c.contaId.invalid) return 'Escolha uma conta.';
    if (c.data.invalid) return 'Informe a data.';
    return 'Revise os campos destacados.';
  }

  private async avisar(mensagem: string): Promise<void> {
    const toast = await this.toast.create({
      message: mensagem,
      duration: 2000,
      position: 'top',
      color: 'dark',
      icon: 'checkmark-circle-outline',
    });
    await toast.present();
  }
}
