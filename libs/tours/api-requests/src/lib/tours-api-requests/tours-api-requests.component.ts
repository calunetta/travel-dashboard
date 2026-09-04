import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-tours-api-requests',
  imports: [CommonModule],
  templateUrl: './tours-api-requests.component.html',
  styleUrl: './tours-api-requests.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToursApiRequestsComponent {}
