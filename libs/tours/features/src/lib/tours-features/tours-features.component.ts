import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-tours-features',
  imports: [CommonModule],
  templateUrl: './tours-features.component.html',
  styleUrl: './tours-features.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToursFeaturesComponent {}
