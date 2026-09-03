import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-shared-ui',
  imports: [CommonModule],
  templateUrl: './shared-ui.component.html',
  styleUrl: './shared-ui.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SharedUiComponent {}
