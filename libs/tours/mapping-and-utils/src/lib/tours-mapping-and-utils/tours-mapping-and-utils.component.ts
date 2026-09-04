import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-tours-mapping-and-utils',
  imports: [CommonModule],
  templateUrl: './tours-mapping-and-utils.component.html',
  styleUrl: './tours-mapping-and-utils.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToursMappingAndUtilsComponent {}
