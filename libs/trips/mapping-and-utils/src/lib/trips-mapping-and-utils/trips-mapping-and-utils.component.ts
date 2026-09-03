import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-trips-mapping-and-utils',
  imports: [CommonModule],
  templateUrl: './trips-mapping-and-utils.component.html',
  styleUrl: './trips-mapping-and-utils.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TripsMappingAndUtilsComponent {}
