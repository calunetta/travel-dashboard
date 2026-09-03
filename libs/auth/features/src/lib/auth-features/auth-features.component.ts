import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-auth-features',
  imports: [CommonModule],
  templateUrl: './auth-features.component.html',
  styleUrl: './auth-features.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthFeaturesComponent {}
