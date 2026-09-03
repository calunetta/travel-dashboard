import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-coordinators-models',
  imports: [CommonModule],
  templateUrl: './coordinators-models.component.html',
  styleUrl: './coordinators-models.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoordinatorsModelsComponent {}
