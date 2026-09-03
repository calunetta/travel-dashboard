import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-auth-models',
  imports: [CommonModule],
  templateUrl: './auth-models.component.html',
  styleUrl: './auth-models.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthModelsComponent {}
