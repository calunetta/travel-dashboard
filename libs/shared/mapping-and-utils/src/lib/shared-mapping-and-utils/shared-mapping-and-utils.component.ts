import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-shared-mapping-and-utils',
  imports: [CommonModule],
  templateUrl: './shared-mapping-and-utils.component.html',
  styleUrl: './shared-mapping-and-utils.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SharedMappingAndUtilsComponent {}
