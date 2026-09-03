import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-trips-features',
  imports: [CommonModule],
  templateUrl: './trips-features.component.html',
  styleUrl: './trips-features.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TripsFeaturesComponent {}
