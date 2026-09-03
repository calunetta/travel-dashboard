import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-auth-api-requests',
  imports: [CommonModule],
  templateUrl: './auth-api-requests.component.html',
  styleUrl: './auth-api-requests.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthApiRequestsComponent {}
