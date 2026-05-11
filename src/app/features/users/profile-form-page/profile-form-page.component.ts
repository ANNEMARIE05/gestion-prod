import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AuthorizationProfile } from '../../../models/authorization';
import { SettingsService } from '../../../services/settings.service';
import { flattenMenuWithDepth } from '../../../utils/menu-tree';
import { ButtonLoadingDirective } from '../../../shared/directives/button-loading.directive';

@Component({
  selector: 'app-profile-form-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatCheckboxModule,
    ButtonLoadingDirective,
  ],
  templateUrl: './profile-form-page.component.html',
  styleUrl: './profile-form-page.component.scss',
})
export class ProfileFormPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly settings = inject(SettingsService);

  isCreate = true;
  existingId: string | null = null;
  readonly loading = signal(false);

  label = '';
  visibleMenuIds = new Set<string>();
  allowedActionsByMenu: Record<string, string[]> = {};

  menusFlat = computed(() => flattenMenuWithDepth(this.settings.allMenus()));

  readonly backRoute = '/utilisateurs/profils';

  get pageTitle(): string {
    return this.isCreate ? 'Nouveau profil' : 'Modifier le profil';
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
      const p = this.settings.getProfile(id);
      if (!p) {
        void this.router.navigate([this.backRoute]);
        return;
      }
      this.isCreate = false;
      this.existingId = id;
      this.label = p.label;
      this.visibleMenuIds = new Set(p.visibleMenuIds);
      this.allowedActionsByMenu = { ...p.allowedActionsByMenu };
    }
  }

  toggleMenu(id: string, checked: boolean): void {
    if (checked) {
      this.visibleMenuIds.add(id);
      if (!this.allowedActionsByMenu[id]?.length) {
        const hab = this.settings.allHabilitation()[id] ?? [];
        this.allowedActionsByMenu[id] = [...hab];
      }
    } else {
      this.visibleMenuIds.delete(id);
      delete this.allowedActionsByMenu[id];
    }
  }

  isMenuOn(id: string): boolean {
    return this.visibleMenuIds.has(id);
  }

  toggleAction(menuId: string, actionId: string, checked: boolean): void {
    const hab = this.settings.allHabilitation()[menuId] ?? [];
    const cur = [...(this.allowedActionsByMenu[menuId] ?? [])];
    let next: string[];
    if (checked) {
      next = [...new Set([...cur, actionId])].filter((x) => hab.includes(x));
    } else {
      next = cur.filter((x) => x !== actionId);
    }
    this.allowedActionsByMenu[menuId] = next;
  }

  isActionOn(menuId: string, actionId: string): boolean {
    return (this.allowedActionsByMenu[menuId] ?? []).includes(actionId);
  }

  habActions(menuId: string) {
    const ids = this.settings.allHabilitation()[menuId] ?? [];
    return this.settings.allActions().filter((a) => ids.includes(a.id));
  }

  save(): void {
    if (!this.label.trim() || this.loading()) {
      return;
    }
    this.loading.set(true);
    setTimeout(() => {
      const profile: AuthorizationProfile = {
        id: this.isCreate ? this.settings.nextProfileId() : this.existingId!,
        label: this.label.trim(),
        visibleMenuIds: [...this.visibleMenuIds],
        allowedActionsByMenu: { ...this.allowedActionsByMenu },
      };
      this.settings.saveProfile(profile);
      this.loading.set(false);
      void this.router.navigate([this.backRoute]);
    }, 600);
  }
}
