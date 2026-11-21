import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-moldura-acesso',
  templateUrl: './moldura-acesso.component.html',
  styleUrls: ['./moldura-acesso.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class MolduraAcessoComponent {
  readonly titulo = input.required<string>();
  readonly subtitulo = input('');
}
