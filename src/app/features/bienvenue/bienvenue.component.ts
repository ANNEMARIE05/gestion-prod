import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { APP_ROUTES } from '../../utils/app-routes';
import { PermissionService } from '../../core/services/permission.service';

@Component({
  selector: 'app-bienvenue',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  template: `
    <section class="max-w-3xl mx-auto py-16 px-6 text-center">
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-6">
        <mat-icon class="!text-4xl !w-10 !h-10">waving_hand</mat-icon>
      </div>
      <h1 class="text-3xl font-bold text-slate-900 mb-3">Bienvenue</h1>
      <p class="text-slate-600 mb-8 leading-relaxed">
        Vous êtes connecté. Utilisez le menu latéral pour accéder aux modules auxquels vous avez droit.
      </p>
      @if (perm.canAccessRoute(dashboardRoute)) {
        <a
          [routerLink]="dashboardRoute"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white font-medium hover:opacity-90 transition-opacity"
        >
          <mat-icon class="!text-lg">dashboard</mat-icon>
          Aller au tableau de bord
        </a>
      }
    </section>
  `,
})
export class BienvenueComponent {
  readonly perm = inject(PermissionService);
  readonly dashboardRoute = APP_ROUTES.dashboard;
}
