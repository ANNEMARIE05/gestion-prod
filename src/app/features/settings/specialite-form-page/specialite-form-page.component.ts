import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { SettingsService, Specialty } from '../../../services/settings.service';
import { ButtonLoadingDirective } from '../../../shared/directives/button-loading.directive';

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
    ButtonLoadingDirective,
  ],
  templateUrl: './specialite-form-page.component.html',
})
export class SpecialiteFormPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly settings = inject(SettingsService);

  isCreate = true;
  existingId: string | null = null;
  readonly loading = signal(false);
  label = '';
  active = true;
  private iconValue = 'workspace_premium';
  /** Conservée à l’édition pour ne pas écraser la date de création. */
  private existingCreatedAt: Date | undefined;

  readonly backRoute = '/settings/specialites';

  get pageTitle(): string {
    return this.isCreate ? 'Nouvelle spécialité' : 'Modifier la spécialité';
  }

  get canSave(): boolean {
    return !!this.label.trim();
  }

  ngOnInit(): void {
    const url = this.router.url;
    if (url.includes('/nouveau')) {
      this.isCreate = true;
      this.existingId = null;
      this.existingCreatedAt = undefined;
      return;
    }
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const s = this.settings.getSpecialtyById(id);
      if (!s) {
        void this.router.navigate([this.backRoute]);
        return;
      }
      this.isCreate = false;
      this.existingId = id;
      this.label = s.label;
      this.iconValue = s.icon;
      this.active = s.active;
      this.existingCreatedAt = s.createdAt;
    }
  }

  save(): void {
    if (!this.canSave || this.loading()) return;
    this.loading.set(true);
    setTimeout(() => {
      const item: Specialty = {
        id: this.isCreate ? this.settings.generateId() : this.existingId!,
        label: this.label.trim(),
        icon: this.isCreate ? 'workspace_premium' : (this.iconValue || 'workspace_premium'),
        active: this.active,
        createdAt: this.isCreate ? new Date() : this.existingCreatedAt,
      };
      if (this.isCreate) {
        this.settings.addSpecialty(item);
      } else {
        this.settings.updateSpecialty(item);
      }
      this.loading.set(false);
      void this.router.navigate([this.backRoute]);
    }, 600);
  }
}
