import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-hotels-features',
  imports: [CommonModule],
  templateUrl: './hotels-features.component.html',
  styleUrl: './hotels-features.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HotelsFeaturesComponent {}
