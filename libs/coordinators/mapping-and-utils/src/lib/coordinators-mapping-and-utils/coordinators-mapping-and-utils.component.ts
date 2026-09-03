import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-coordinators-mapping-and-utils',
  imports: [CommonModule],
  templateUrl: './coordinators-mapping-and-utils.component.html',
  styleUrl: './coordinators-mapping-and-utils.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoordinatorsMappingAndUtilsComponent {}
