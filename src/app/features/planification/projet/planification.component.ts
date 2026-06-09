import { Component, inject, signal } from '@angular/core';
import { PermissionService } from '../../../core/services/permission.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PlanificationListComponent } from './planification-list/planification-list.component';
import { ProductionType } from '../../../models/production';
import { planificationCreateRoute } from '../../../utils/app-routes';
import { PlanificationProjetService } from '../services/planificationProjet.service';
import { PlanificationService } from '../services/planification.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';

interface PlanPageMeta {
  title: string;
  subtitle: string;
  icon: string;
  accent: string;
  createLabel: string;
}

const PAGE_META: Record<ProductionType, PlanPageMeta> = {
  PROJECT: {
    title: 'Planning Projets',
    subtitle: 'Organisez le calendrier prévisionnel de vos projets.',
    icon: 'folder_shared',
    accent: 'from-indigo-500 to-violet-500',
    createLabel: 'Planifier un projet'
  },
  AUDIT: {
    title: 'Planning Audits',
    subtitle: 'Préparez et suivez les missions d’audit IT.',
    icon: 'fact_check',
    accent: 'from-rose-500 to-orange-500',
    createLabel: 'Planifier un audit'
  },
  ENGINEERING: {
    title: 'Planning Veille',
    subtitle: 'Cadencez vos activités d’ingénierie et de veille technologique.',
    icon: 'analytics',
    accent: 'from-emerald-500 to-teal-500',
    createLabel: 'Planifier une veille'
  },
  MONITORING: {
    title: 'Planning Monitoring',
    subtitle: 'Programmez les routines de monitoring de production.',
    icon: 'monitor_heart',
    accent: 'from-sky-500 to-cyan-500',
    createLabel: 'Planifier un monitoring'
  }
};

@Component({
  selector: 'app-planification',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, PlanificationListComponent, RouterLink],
  templateUrl: './planification.component.html',
  styleUrl: './planification.component.scss'
})
export class PlanificationComponent {
  readonly perm = inject(PermissionService);
  private readonly planificationProjetService = inject(PlanificationProjetService);
  private readonly planService = inject(PlanificationService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly errorHandler = inject(ErrorHandlerService);

  type = signal<ProductionType>('PROJECT');
  meta = signal<PlanPageMeta>(PAGE_META['PROJECT']);
  createRoute = signal(planificationCreateRoute('PROJECT'));

  constructor(private route: ActivatedRoute) {
    this.route.data.subscribe(data => {
      const t = (data['type'] as ProductionType) ?? 'PROJECT';
      this.type.set(t);
      this.meta.set(PAGE_META[t]);
      this.createRoute.set(planificationCreateRoute(t));
    });
  }

  exportCsv(): void {
    this.planificationProjetService.exportCsv().subscribe({
      next: (response) => {
        if (!response.body) {
          return;
        }
        const date = new Date().toISOString().split('T')[0];
        this.downloadBlob(response.body, `planifications-projets_${date}.csv`);
      },
      error: (err: unknown) =>
        this.snackBar.open(this.errorHandler.getErrorMessage(err), 'Fermer', { duration: 5000 }),
    });
  }

  importCsv(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    this.planificationProjetService.importCsv(file).subscribe({
      next: (response) => {
        input.value = '';
        if (response.status >= 200 && response.status < 300) {
          this.planService.refreshTasks().subscribe();
          this.snackBar.open('Import réussi', 'Fermer', { duration: 3000 });
        } else {
          this.snackBar.open("Erreur lors de l'import", 'Fermer', { duration: 5000 });
        }
      },
      error: (err: unknown) => {
        input.value = '';
        this.snackBar.open(this.errorHandler.getErrorMessage(err), 'Fermer', { duration: 5000 });
      },
    });
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(new Blob([blob], { type: 'text/csv;charset=utf-8;' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
