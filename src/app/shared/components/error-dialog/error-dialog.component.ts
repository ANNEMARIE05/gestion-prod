import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ErrorDialogData {
  title?: string;
  messages: string[];
}

@Component({
  selector: 'app-error-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="p-6">
      <div class="flex items-center gap-3 mb-4">
        <div
          class="w-10 h-10 rounded-full flex items-center justify-center bg-red-100 text-red-600"
        >
          <mat-icon>error_outline</mat-icon>
        </div>
        <h2 class="text-xl font-bold text-gray-900 m-0">
          {{ data.title || 'Une erreur est survenue' }}
        </h2>
      </div>

      <ng-container *ngIf="data.messages.length > 1; else single">
        <ul class="text-gray-600 mb-8 pl-5 space-y-1 list-disc">
          <li *ngFor="let message of data.messages">{{ message }}</li>
        </ul>
      </ng-container>
      <ng-template #single>
        <p class="text-gray-600 mb-8">{{ data.messages[0] }}</p>
      </ng-template>

      <div class="flex justify-end">
        <button
          mat-flat-button
          color="warn"
          class="!rounded-xl shadow-sm"
          (click)="onClose()"
        >
          Fermer
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; border-radius: 1rem; overflow: hidden; }
  `]
})
export class ErrorDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ErrorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ErrorDialogData
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }
}
