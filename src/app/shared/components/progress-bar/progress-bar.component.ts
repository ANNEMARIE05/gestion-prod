import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  imports: [CommonModule, MatProgressBarModule],
  template: `
    <div class="flex items-center gap-3 w-full">
      <div class="flex-1">
        <div class="flex justify-between mb-1">
          <span class="text-[10px] font-medium text-gray-400">{{ label }}</span>
          <span class="text-[10px] font-bold text-gray-700">{{ value }}%</span>
        </div>
        <mat-progress-bar mode="determinate" [value]="value" class="h-1.5 rounded-full"></mat-progress-bar>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }
    ::ng-deep .mat-mdc-progress-bar {
      --mdc-linear-progress-active-indicator-color: #2196f3;
      --mdc-linear-progress-track-color: #f1f5f9;
    }
  `]
})
export class ProgressBarComponent {
  @Input() value: number = 0;
  @Input() label: string = 'Avancement';
}
