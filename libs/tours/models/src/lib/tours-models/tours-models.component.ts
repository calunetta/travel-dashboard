import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-tours-models',
  imports: [CommonModule],
  templateUrl: './tours-models.component.html',
  styleUrl: './tours-models.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToursModelsComponent {}
