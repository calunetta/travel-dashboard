import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-coordinators-api-requests',
  imports: [CommonModule],
  templateUrl: './coordinators-api-requests.component.html',
  styleUrl: './coordinators-api-requests.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoordinatorsApiRequestsComponent {}
