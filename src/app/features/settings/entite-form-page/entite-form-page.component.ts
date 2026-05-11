import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { Entity, SettingsService } from '../../../services/settings.service';
import { ButtonLoadingDirective } from '../../../shared/directives/button-loading.directive';

@Component({
  selector: 'app-entite-form-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatSlideToggleModule,
    ButtonLoadingDirective,
  ],
  templateUrl: './entite-form-page.component.html',
})
export class EntiteFormPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly settings = inject(SettingsService);

  isCreate = true;
  existingId: string | null = null;
  readonly loading = signal(false);

  name = '';
  parentId: string | null = null;
  active = true;
  private iconValue = 'business';

  readonly backRoute = '/settings/entites';

  readonly parentOptions = computed(() =>
    this.settings
      .entitySelectOptions()
      .filter((opt) => opt.id !== this.existingId && !this.blockedParentIds().has(opt.id))
      .filter((opt) => (this.isCreate ? this.isRootEntity(opt.id) : true)),
  );
  readonly blockedParentIds = computed(() => {
    if (!this.existingId) {
      return new Set<string>();
    }
    const current = this.settings.getEntityById(this.existingId);
    return new Set<string>([this.existingId, ...this.collectDescendantIds(current)]);
  });

  get pageTitle(): string {
    return this.isCreate ? 'Nouvelle entité' : 'Modifier l’entité';
  }

  get canSave(): boolean {
    return !!this.name.trim();
  }

  ngOnInit(): void {
    const url = this.router.url;
    if (url.includes('/nouveau')) {
      this.isCreate = true;
      this.existingId = null;
      const qpParent = this.route.snapshot.queryParamMap.get('parent');
      this.parentId = qpParent ?? null;
      return;
    }
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const e = this.settings.getEntityById(id);
      if (!e) {
        void this.router.navigate([this.backRoute]);
        return;
      }
      this.isCreate = false;
      this.existingId = id;
      this.name = e.name;
      this.parentId = e.parentId ?? null;
      this.iconValue = e.icon;
      this.active = e.active;
    }
  }

  save(): void {
    if (!this.canSave || this.loading()) return;
    this.loading.set(true);
    setTimeout(() => {
      const existing = this.existingId ? this.settings.getEntityById(this.existingId) : undefined;
      const item: Entity = {
        id: this.isCreate ? this.settings.generateId() : this.existingId!,
        name: this.name.trim(),
        icon: existing?.icon ?? this.iconValue ?? 'business',
        active: this.active,
        parentId: this.parentId ?? undefined,
        createdAt: existing?.createdAt ?? new Date(),
      };
      this.settings.persistEntity(item, this.isCreate);
      this.loading.set(false);
      void this.router.navigate([this.backRoute]);
    }, 600);
  }

  private collectDescendantIds(root?: Entity | null): string[] {
    if (!root?.children?.length) {
      return [];
    }
    const out: string[] = [];
    for (const child of root.children) {
      out.push(child.id, ...this.collectDescendantIds(child));
    }
    return out;
  }

  private isRootEntity(entityId: string): boolean {
    return !this.settings.getEntityById(entityId)?.parentId;
  }
}
