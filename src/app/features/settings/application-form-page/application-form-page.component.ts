import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Application, SettingsService } from '../../../services/settings.service';
import { ErrorHandlerService } from '../../../services/error-handler.service';
import { ButtonLoadingDirective } from '../../../shared/directives/button-loading.directive';

function generateApplicationCode(label: string): string {
  const base = label
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const code = base.replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return code || 'APP';
}

@Component({
  selector: 'app-application-form-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSnackBarModule,
    ButtonLoadingDirective,
  ],
  templateUrl: './application-form-page.component.html',
})
export class ApplicationFormPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly errorHandler = inject(ErrorHandlerService);
  readonly settings = inject(SettingsService);

  isCreate = true;
  existingId: string | null = null;
  readonly loading = signal(false);

  label = '';
  code = '';
  description = '';

  readonly backRoute = '/parametrages/applications';

  get pageTitle(): string {
    return this.isCreate ? 'Nouvelle application' : 'Modifier l’application';
  }

  get canSave(): boolean {
    return !!this.label.trim() && !!this.code.trim();
  }

  ngOnInit(): void {
    const url = this.router.url;
    if (url.includes('/create') || url.includes('/nouveau')) {
      this.isCreate = true;
      this.existingId = null;
      this.code = this.settings.generatePrefixedCode('APP', this.settings.allApplications());
      return;
    }
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isCreate = false;
      this.existingId = id;
      this.settings.loadApplicationById(id).subscribe((a) => {
        if (!a) {
          void this.router.navigate([this.backRoute]);
          return;
        }
        this.label = a.label;
        this.code = a.code || `APP-${a.id}`;
        this.description = a.description ?? '';
      });
    }
  }

  save(): void {
    if (!this.canSave || this.loading()) return;
    this.loading.set(true);
    const existing = this.existingId ? this.settings.getApplicationById(this.existingId) : undefined;
    const code = this.code.trim() || existing?.code || generateApplicationCode(this.label);
    const item: Application = {
      id: this.isCreate ? '' : this.existingId!,
      code,
      label: this.label.trim(),
      description: this.description.trim() || undefined,
      active: existing?.active ?? true,
      createdAt: existing?.createdAt,
      createdBy: existing?.createdBy,
    };
    this.settings.persistApplication(item, this.isCreate).subscribe({
      next: () => {
        this.loading.set(false);
        this.snackBar.open(
          this.isCreate ? 'Application créée avec succès' : 'Application modifiée avec succès',
          'Fermer',
          { duration: 3000 },
        );
        void this.router.navigate([this.backRoute]);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.snackBar.open(this.errorHandler.getErrorMessage(err), 'Fermer', { duration: 5000 });
      },
    });
  }
}
