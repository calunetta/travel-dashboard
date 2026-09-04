import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-tours-ui',
  imports: [CommonModule],
  templateUrl: './tours-ui.component.html',
  styleUrl: './tours-ui.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToursUiComponent {}
