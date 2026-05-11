import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../services/auth.service';
import { Application, SettingsService } from '../../../services/settings.service';
import { ButtonLoadingDirective } from '../../../shared/directives/button-loading.directive';

function generateApplicationCode(label: string): string {
  const base = label
    .trim()
    .toUpperCase()
    // Retire les accents pour éviter des codes illisibles.
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
    ButtonLoadingDirective,
  ],
  templateUrl: './application-form-page.component.html',
})
export class ApplicationFormPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly settings = inject(SettingsService);
  private readonly auth = inject(AuthService);

  isCreate = true;
  existingId: string | null = null;
  readonly loading = signal(false);

  label = '';
  description = '';

  readonly backRoute = '/settings/applications';

  get pageTitle(): string {
    return this.isCreate ? 'Nouvelle application' : 'Modifier l’application';
  }

  get canSave(): boolean {
    return !!this.label.trim();
  }

  ngOnInit(): void {
    const url = this.router.url;
    if (url.includes('/nouveau')) {
      this.isCreate = true;
      this.existingId = null;
      return;
    }
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const a = this.settings.getApplicationById(id);
      if (!a) {
        void this.router.navigate([this.backRoute]);
        return;
      }
      this.isCreate = false;
      this.existingId = id;
      this.label = a.label;
      this.description = a.description ?? '';
    }
  }

  save(): void {
    if (!this.canSave || this.loading()) return;
    this.loading.set(true);
    setTimeout(() => {
      const code = generateApplicationCode(this.label);
      const existing = this.existingId ? this.settings.getApplicationById(this.existingId) : undefined;
      const author = this.auth.currentUser()?.name ?? 'Utilisateur inconnu';
      const item: Application = {
        id: this.isCreate ? this.settings.generateId() : this.existingId!,
        code,
        label: this.label.trim(),
        description: this.description.trim() || undefined,
        active: true,
        createdAt: this.isCreate ? new Date() : existing?.createdAt,
        createdBy: this.isCreate ? author : existing?.createdBy,
      };
      if (this.isCreate) {
        this.settings.addApplication(item);
      } else {
        this.settings.updateApplication(item);
      }
      this.loading.set(false);
      void this.router.navigate([this.backRoute]);
    }, 600);
  }
}
