import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-trips-ui',
  imports: [CommonModule],
  templateUrl: './trips-ui.component.html',
  styleUrl: './trips-ui.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TripsUiComponent {}
