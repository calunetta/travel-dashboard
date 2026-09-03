import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-shared-models',
  imports: [CommonModule],
  templateUrl: './shared-models.component.html',
  styleUrl: './shared-models.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SharedModelsComponent {}
