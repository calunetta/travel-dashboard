import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-coordinators-features',
  imports: [CommonModule],
  templateUrl: './coordinators-features.component.html',
  styleUrl: './coordinators-features.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoordinatorsFeaturesComponent {}
