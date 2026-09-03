import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-trips-models',
  imports: [CommonModule],
  templateUrl: './trips-models.component.html',
  styleUrl: './trips-models.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TripsModelsComponent {}
