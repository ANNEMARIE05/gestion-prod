import { Component, inject, signal } from '@angular/core';
import { PermissionService } from '../../services/permission.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ProjectListComponent } from './project-list/project-list.component';
import { ProductionType } from '../../models/production';
import { APP_ROUTES, productionCreateRoute } from '../../utils/app-routes';
import { ProductionService } from '../../services/production.service';
import { ErrorHandlerService } from '../../services/error-handler.service';

interface ProductionPageMeta {
  title: string;
  subtitle: string;
  icon: string;
  accent: string;
  createLabel: string;
}

const PAGE_META: Record<ProductionType, ProductionPageMeta> = {
  PROJECT: {
    title: 'Projets',
    subtitle: 'Pilotez l\u2019ex\u00e9cution de vos projets de production.',
    icon: 'folder_open',
    accent: 'from-indigo-500 to-violet-500',
    createLabel: 'Nouveau projet'
  },
  AUDIT: {
    title: 'Audits IT',
    subtitle: 'Suivez vos missions d\u2019audit informatique de bout en bout.',
    icon: 'security',
    accent: 'from-rose-500 to-orange-500',
    createLabel: 'Nouvel audit'
  },
  ENGINEERING: {
    title: 'Ing\u00e9nierie & Veille',
    subtitle: 'Centralisez les activit\u00e9s d\u2019ing\u00e9nierie et de veille technologique.',
    icon: 'engineering',
    accent: 'from-emerald-500 to-teal-500',
    createLabel: 'Nouvelle veille'
  },
  MONITORING: {
    title: 'Monitoring',
    subtitle: 'Surveillez la production en temps r\u00e9el.',
    icon: 'monitor_heart',
    accent: 'from-sky-500 to-cyan-500',
    createLabel: 'Nouveau monitoring'
  }
};

@Component({
  selector: 'app-production',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    ProjectListComponent
  ],
  templateUrl: './production.component.html',
  styleUrl: './production.component.scss'
})
export class ProductionComponent {
  readonly perm = inject(PermissionService);
  private readonly productionService = inject(ProductionService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly errorHandler = inject(ErrorHandlerService);

  type = signal<ProductionType>('PROJECT');
  meta = signal<ProductionPageMeta>(PAGE_META['PROJECT']);

  constructor(private router: Router, private route: ActivatedRoute) {
    this.route.data.subscribe(data => {
      const t = (data['type'] as ProductionType) ?? 'PROJECT';
      this.type.set(t);
      this.meta.set(PAGE_META[t]);
    });
  }

  openCreate(): void {
    void this.router.navigate([productionCreateRoute(this.type())]);
  }

  /** Préfixe de fichier selon le type courant (projet, audit, veille). */
  private fileBaseName(): string {
    switch (this.type()) {
      case 'AUDIT':
        return 'audits';
      case 'ENGINEERING':
        return 'veilles';
      case 'MONITORING':
        return 'monitoring';
      default:
        return 'projets';
    }
  }

  exportCsv(): void {
    this.productionService.exportCsv(this.type()).subscribe({
      next: (blob) => {
        if (!blob) {
          return;
        }
        const date = new Date().toISOString().split('T')[0];
        this.downloadBlob(blob, `${this.fileBaseName()}_${date}.csv`);
      },
      error: (err: unknown) =>
        this.snackBar.open(this.errorHandler.getErrorMessage(err), 'Fermer', { duration: 5000 }),
    });
  }

  downloadTemplateCsv(): void {
    this.productionService.downloadTemplate(this.type()).subscribe({
      next: (blob) => {
        if (!blob) {
          return;
        }
        this.downloadBlob(blob, `modele_${this.fileBaseName()}.csv`);
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
    this.productionService.importCsv(this.type(), file).subscribe({
      next: (response) => {
        input.value = '';
        if (response.status >= 200 && response.status < 300) {
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
