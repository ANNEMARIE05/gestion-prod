import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Jalon, SettingsService } from '../../../services/settings.service';
import { ErrorHandlerService } from '../../../services/error-handler.service';
import { ButtonLoadingDirective } from '../../../shared/directives/button-loading.directive';

@Component({
  selector: 'app-jalon-form-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    MatSnackBarModule,
    ButtonLoadingDirective,
  ],
  templateUrl: './jalon-form-page.component.html',
})
export class JalonFormPageComponent implements OnInit {
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
  parentId: string | null = null;
  selectedApplicationIds: string[] = [];

  readonly backRoute = '/parametrages/jalons';
  readonly parentOptions = computed(() =>
    this.settings
      .jalonSelectOptions()
      .filter((opt) => opt.id !== this.existingId)
      .filter((opt) => (this.isCreate ? this.isRootJalon(opt.id) : true)),
  );
  readonly applicationOptions = computed(() =>
    this.settings.allApplications().sort((a, b) => a.label.localeCompare(b.label)),
  );

  get pageTitle(): string {
    return this.isCreate ? 'Nouveau jalon' : 'Modifier le jalon';
  }

  get canSave(): boolean {
    return !!this.label.trim() && !!this.code.trim();
  }

  ngOnInit(): void {
    const url = this.router.url;
    if (url.includes('/create') || url.includes('/nouveau')) {
      this.isCreate = true;
      this.existingId = null;
      this.code = this.settings.generatePrefixedCode('JAL', this.settings.allJalons());
      return;
    }
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isCreate = false;
      this.existingId = id;
      this.settings.loadJalonById(id).subscribe((j) => {
        if (!j) {
          void this.router.navigate([this.backRoute]);
          return;
        }
        this.label = j.label;
        this.code = j.code || `JAL-${j.id}`;
        this.parentId = j.parentId ?? null;
        this.selectedApplicationIds = j.applicationIds ?? [];
      });
    }
  }

  private isRootJalon(jalonId: string): boolean {
    return !this.settings.getJalonById(jalonId)?.parentId;
  }

  save(): void {
    if (!this.canSave || this.loading()) return;
    this.loading.set(true);
    const existing = this.existingId ? this.settings.getJalonById(this.existingId) : undefined;
    const item: Jalon = {
      id: this.isCreate ? '' : this.existingId!,
      code: this.code.trim() || existing?.code || this.label.trim().toUpperCase().replace(/\s+/g, '_'),
      label: this.label.trim(),
      parentId: this.parentId ?? undefined,
      applicationIds: this.selectedApplicationIds ?? [],
      createdAt: existing?.createdAt,
      createdBy: existing?.createdBy,
    };
    this.settings.persistJalon(item, this.isCreate).subscribe({
      next: () => {
        this.loading.set(false);
        this.snackBar.open(
          this.isCreate ? 'Jalon créé avec succès' : 'Jalon modifié avec succès',
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
