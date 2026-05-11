import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div
      class="flex items-center justify-center gap-3"
      [class.min-h-[120px]]="!compact()"
      [class.flex-col]="!inline()"
      [class.flex-row]="inline()"
      [class.rounded-xl]="overlay()"
      [class.bg-white/80]="overlay()"
      [class.backdrop-blur-sm]="overlay()"
      [class.p-6]="overlay()"
    >
      <mat-spinner [diameter]="size()"></mat-spinner>
      @if (message()) {
        <span class="text-sm font-medium text-slate-600">{{ message() }}</span>
      }
    </div>
  `,
})
export class LoadingSpinnerComponent {
  size = input(30);
  message = input('Chargement...');
  compact = input(false);
  inline = input(false);
  overlay = input(false);
}
