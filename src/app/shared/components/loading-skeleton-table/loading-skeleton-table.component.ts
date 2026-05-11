import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-skeleton-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-4 animate-pulse">
      @if (showFilter()) {
        <div class="h-12 rounded-xl border border-slate-100 bg-white"></div>
      }

      <div class="premium-card overflow-hidden bg-white p-4">
        <div class="space-y-3">
          @for (row of rowsArray(); track $index) {
            <div class="grid gap-3" [style.gridTemplateColumns]="gridTemplate()">
              @for (col of colsArray(); track $index) {
                <div class="h-4 rounded bg-slate-100"></div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class LoadingSkeletonTableComponent {
  rows = input(7);
  cols = input(5);
  showFilter = input(true);

  readonly rowsArray = computed(() => Array.from({ length: this.rows() }));
  readonly colsArray = computed(() => Array.from({ length: this.cols() }));

  readonly gridTemplate = computed(() => `repeat(${this.cols()}, minmax(0, 1fr))`);
}
