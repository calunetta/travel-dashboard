import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-trips-api-requests',
  imports: [CommonModule],
  templateUrl: './trips-api-requests.component.html',
  styleUrl: './trips-api-requests.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TripsApiRequestsComponent {}
