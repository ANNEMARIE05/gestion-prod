import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="badgeClasses">
      {{ label }}
    </span>
  `,
  styles: []
})
export class StatusBadgeComponent {
  @Input() label: string = '';
  @Input() type: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO' | 'NEUTRAL' = 'NEUTRAL';

  get badgeClasses(): string {
    const base = 'px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase ';
    switch (this.type) {
      case 'SUCCESS': return base + 'bg-green-100 text-green-700';
      case 'WARNING': return base + 'bg-amber-100 text-amber-700';
      case 'ERROR': return base + 'bg-red-100 text-red-700';
      case 'INFO': return base + 'bg-blue-100 text-blue-700';
      default: return base + 'bg-gray-100 text-gray-700';
    }
  }
}
