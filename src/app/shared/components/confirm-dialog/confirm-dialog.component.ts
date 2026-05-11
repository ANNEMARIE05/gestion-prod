import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ButtonLoadingDirective } from '../../directives/button-loading.directive';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDelete?: boolean;
  confirmColor?: 'primary' | 'accent' | 'warn';
  /**
   * Délai (ms) pendant lequel le bouton « Confirmer » affiche un loader avant
   * que la dialog ne se ferme. Permet de donner un retour visuel sur les
   * actions synchrones (services sans latence réseau).
   */
  confirmDelayMs?: number;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, ButtonLoadingDirective],
  template: `
    <div class="p-6">
      <div class="flex items-center gap-3 mb-4">
        <div [class]="data.isDelete ? 'bg-red-100 text-red-600' : 'bg-primary/10 text-primary'"
             class="w-10 h-10 rounded-full flex items-center justify-center">
          <mat-icon>{{ data.isDelete ? 'delete_outline' : 'info_outline' }}</mat-icon>
        </div>
        <h2 class="text-xl font-bold text-gray-900 m-0">{{ data.title }}</h2>
      </div>

      <p class="text-gray-600 mb-8">{{ data.message }}</p>

      <div class="flex justify-end gap-3">
        <button
          mat-button
          class="!rounded-xl"
          [disabled]="loading()"
          (click)="onCancel()"
        >
          {{ data.cancelText || 'Annuler' }}
        </button>
        <button
          mat-flat-button
          [color]="data.confirmColor || (data.isDelete ? 'warn' : 'primary')"
          class="!rounded-xl shadow-sm"
          [appBtnLoading]="loading()"
          (click)="onConfirm()"
        >
          {{ data.confirmText || 'Confirmer' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; border-radius: 1rem; overflow: hidden; }
  `]
})
export class ConfirmDialogComponent {
  readonly loading = signal(false);

  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {
    this.dialogRef.disableClose = false;
  }

  onCancel(): void {
    if (this.loading()) return;
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    if (this.loading()) return;
    const delay = this.data.confirmDelayMs ?? 600;
    this.loading.set(true);
    this.dialogRef.disableClose = true;
    setTimeout(() => {
      this.dialogRef.close(true);
    }, delay);
  }
}
