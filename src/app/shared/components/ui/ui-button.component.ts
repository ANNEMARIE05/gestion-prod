import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

type UiButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type UiButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-ui-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [attr.type]="type"
      [disabled]="disabled || loading"
      [attr.aria-busy]="loading ? 'true' : null"
      [class]="buttonClasses"
      (click)="onClick($event)"
    >
      <span class="inline-flex items-center justify-center gap-2">
        <svg
          *ngIf="loading"
          class="h-4 w-4 shrink-0"
          style="animation: app-ui-btn-spin 0.9s linear infinite"
          viewBox="0 0 50 50"
          aria-hidden="true"
        >
          <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-opacity="0.25" stroke-width="5"></circle>
          <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-dasharray="90 150"></circle>
        </svg>
        <span>{{ loading ? loadingLabel : label }}</span>
      </span>
    </button>
  `,
  styles: [
    `
      @keyframes app-ui-btn-spin {
        100% {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class UiButtonComponent {
  @Input() label = 'Valider';
  @Input() loadingLabel = 'Chargement...';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() variant: UiButtonVariant = 'primary';
  @Input() size: UiButtonSize = 'md';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() fullWidth = false;

  @Output() clicked = new EventEmitter<MouseEvent>();

  get buttonClasses(): string {
    const widthClass = this.fullWidth ? 'w-full' : '';
    const base =
      `${widthClass} inline-flex items-center justify-center rounded-lg font-semibold transition ` +
      'focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60';
    const variantClass = this.getVariantClasses(this.variant);
    const sizeClass = this.getSizeClasses(this.size);
    return `${base} ${variantClass} ${sizeClass}`;
  }

  onClick(event: MouseEvent): void {
    if (!this.disabled && !this.loading) {
      this.clicked.emit(event);
    }
  }

  private getVariantClasses(variant: UiButtonVariant): string {
    switch (variant) {
      case 'secondary':
        return 'border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50 focus:ring-slate-300';
      case 'danger':
        return 'bg-red-600 text-white shadow-sm hover:bg-red-700 focus:ring-red-300';
      case 'ghost':
        return 'bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-300';
      case 'primary':
      default:
        return 'bg-blue-600 text-white shadow-sm hover:bg-blue-700 focus:ring-blue-300';
    }
  }

  private getSizeClasses(size: UiButtonSize): string {
    switch (size) {
      case 'sm':
        return 'h-8 px-3 text-xs';
      case 'lg':
        return 'h-11 px-5 text-sm';
      case 'md':
      default:
        return 'h-10 px-4 text-sm';
    }
  }
}
