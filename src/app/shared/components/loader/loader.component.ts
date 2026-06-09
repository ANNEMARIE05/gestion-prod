import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoaderService } from '../../../core/services/loader.service';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loader-container" *ngIf="loaderService.loading$ | async">
      <div class="loader-content">
        <div class="spinner"></div>
        <p>Chargement en cours...</p>
      </div>
    </div>
  `,
  styles: [
    `
      .loader-container {
        position: fixed;
        inset: 0;
        background: rgba(255, 255, 255, 0.4);
        backdrop-filter: blur(8px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
      }
      .loader-content {
        background: white;
        padding: 2rem 3rem;
        border-radius: 16px;
        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .spinner {
        width: 48px;
        height: 48px;
        border: 4px solid #e5e7eb;
        border-top-color: #3b82f6;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin-bottom: 1rem;
      }
      p {
        margin: 0;
        color: #334155;
        font-weight: 500;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class LoaderComponent {
  constructor(public loaderService: LoaderService) {}
}
