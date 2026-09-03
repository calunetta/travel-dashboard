import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-coordinators-ui',
  imports: [CommonModule],
  templateUrl: './coordinators-ui.component.html',
  styleUrl: './coordinators-ui.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoordinatorsUiComponent {}
