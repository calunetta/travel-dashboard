import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-hotels-api-requests',
  imports: [CommonModule],
  templateUrl: './hotels-api-requests.component.html',
  styleUrl: './hotels-api-requests.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HotelsApiRequestsComponent {}
