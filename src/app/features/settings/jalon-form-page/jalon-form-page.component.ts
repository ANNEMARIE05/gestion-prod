import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { Jalon, SettingsService } from '../../../services/settings.service';
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
    ButtonLoadingDirective,
  ],
  templateUrl: './jalon-form-page.component.html',
})
export class JalonFormPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly settings = inject(SettingsService);

  isCreate = true;
  existingId: string | null = null;
  readonly loading = signal(false);

  label = '';
  parentId: string | null = null;
  selectedApplicationId: string | null = null;

  readonly backRoute = '/settings/jalons';
  readonly parentOptions = computed(() =>
    this.settings.jalonSelectOptions().filter((opt) => opt.id !== this.existingId),
  );
  readonly applicationOptions = computed(() =>
    this.settings
      .allApplications()
      .sort((a, b) => a.label.localeCompare(b.label)),
  );

  get pageTitle(): string {
    return this.isCreate ? 'Nouveau jalon' : 'Modifier le jalon';
  }

  get canSave(): boolean {
    return !!this.label.trim();
  }

  get canSelectApplications(): boolean {
    return !!this.parentId;
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
      const j = this.settings.getJalonById(id);
      if (!j) {
        void this.router.navigate([this.backRoute]);
        return;
      }
      this.isCreate = false;
      this.existingId = id;
      this.label = j.label;
      this.parentId = j.parentId ?? null;
      this.selectedApplicationId = j.applicationIds?.[0] ?? null;
    }
  }

  onParentChange(parentId: string | null): void {
    if (!parentId) {
      this.selectedApplicationId = null;
    }
  }

  save(): void {
    if (!this.canSave || this.loading()) return;
    this.loading.set(true);
    setTimeout(() => {
      const existing = this.existingId ? this.settings.getJalonById(this.existingId) : undefined;
      const item: Jalon = {
        id: this.isCreate ? this.settings.generateId() : this.existingId!,
        code: existing?.code ?? this.label.trim().toUpperCase().replace(/\s+/g, '_'),
        label: this.label.trim(),
        parentId: this.parentId ?? undefined,
        applicationIds: this.parentId && this.selectedApplicationId ? [this.selectedApplicationId] : [],
        createdAt: existing?.createdAt ?? new Date(),
        createdBy: existing?.createdBy ?? 'Utilisateur courant',
      };
      if (this.isCreate) {
        this.settings.addJalon(item);
      } else {
        this.settings.updateJalon(item);
      }
      this.loading.set(false);
      void this.router.navigate([this.backRoute]);
    }, 600);
  }
}
