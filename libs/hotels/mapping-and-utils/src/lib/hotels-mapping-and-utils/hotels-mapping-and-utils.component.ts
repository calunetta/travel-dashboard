import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-hotels-mapping-and-utils',
  imports: [CommonModule],
  templateUrl: './hotels-mapping-and-utils.component.html',
  styleUrl: './hotels-mapping-and-utils.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HotelsMappingAndUtilsComponent {}
