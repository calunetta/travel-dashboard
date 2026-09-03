import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-hotels-ui',
  imports: [CommonModule],
  templateUrl: './hotels-ui.component.html',
  styleUrl: './hotels-ui.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HotelsUiComponent {}
