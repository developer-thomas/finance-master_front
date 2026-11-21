import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-estado-vazio',
  templateUrl: './estado-vazio.component.html',
  styleUrls: ['./estado-vazio.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class EstadoVazioComponent {
  readonly icone = input('sparkles-outline');
  readonly titulo = input.required<string>();
  readonly texto = input<string>('');
}
