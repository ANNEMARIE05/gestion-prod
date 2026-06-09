import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SettingsService, Specialty } from '../../services/settings.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { ButtonLoadingDirective } from '../../../../shared/directives/button-loading.directive';

@Component({
  selector: 'app-specialite-form-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    ButtonLoadingDirective,
  ],
  templateUrl: './specialite-form-page.component.html',
})
export class SpecialiteFormPageComponent implements OnInit {
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
  active = true;
  private iconValue = 'workspace_premium';
  private existingCreatedAt: Date | undefined;

  readonly backRoute = '/parametrages/specialites-techniques';

  get pageTitle(): string {
    return this.isCreate ? 'Nouvelle spécialité' : 'Modifier la spécialité';
  }

  get canSave(): boolean {
    return !!this.label.trim() && !!this.code.trim();
  }

  ngOnInit(): void {
    const url = this.router.url;
    if (url.includes('/create') || url.includes('/nouveau')) {
      this.isCreate = true;
      this.existingId = null;
      this.existingCreatedAt = undefined;
      this.code = this.settings.generatePrefixedCode('SPE', this.settings.allSpecialties());
      return;
    }
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isCreate = false;
      this.existingId = id;
      this.settings.loadSpecialtyById(id).subscribe((s) => {
        if (!s) {
          void this.router.navigate([this.backRoute]);
          return;
        }
        this.label = s.label;
        this.code = s.code ?? `SPE-${s.id}`;
        this.iconValue = s.icon;
        this.active = s.active;
        this.existingCreatedAt = s.createdAt;
      });
    }
  }

  save(): void {
    if (!this.canSave || this.loading()) return;
    this.loading.set(true);
    const item: Specialty = {
      id: this.isCreate ? '' : this.existingId!,
      code: this.code.trim() || undefined,
      label: this.label.trim(),
      icon: this.isCreate ? 'workspace_premium' : this.iconValue || 'workspace_premium',
      active: this.active,
      createdAt: this.isCreate ? undefined : this.existingCreatedAt,
    };
    this.settings.persistSpecialty(item, this.isCreate).subscribe({
      next: () => {
        this.loading.set(false);
        this.snackBar.open(
          this.isCreate ? 'Spécialité créée avec succès' : 'Spécialité modifiée avec succès',
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
