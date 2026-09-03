import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-hotels-models',
  imports: [CommonModule],
  templateUrl: './hotels-models.component.html',
  styleUrl: './hotels-models.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HotelsModelsComponent {}
