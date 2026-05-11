import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MenuItem } from '../../../models/menu';
import { SettingsService } from '../../../services/settings.service';
import { ButtonLoadingDirective } from '../../../shared/directives/button-loading.directive';

@Component({
  selector: 'app-menu-form-page',
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
    MatCheckboxModule,
    MatSlideToggleModule,
    ButtonLoadingDirective,
  ],
  templateUrl: './menu-form-page.component.html',
})
export class MenuFormPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly settings = inject(SettingsService);

  isCreate = true;
  existingId: string | null = null;
  readonly loading = signal(false);

  label = '';
  icon = 'folder';
  routePath = '/';
  active = true;
  /** Parent choisi dans la liste (menus racine uniquement), ou null pour une entrée racine. */
  parentId: string | null = null;
  /** En édition, parent actuel est un sous-menu : affichage en lecture seule. */
  parentReadOnlyLabel: string | null = null;
  /** Actions habilitées sur ce menu. */
  selectedActionIds = new Set<string>();

  readonly backRoute = '/settings/menus';

  /** Uniquement les menus de premier niveau (jamais les sous-menus comme options de parent). */
  readonly parentOptions = computed(() => {
    const self = this.existingId;
    return this.settings
      .allMenus()
      .filter((m) => m.id !== self)
      .map((m) => ({ id: m.id, label: m.label }));
  });

  get pageTitle(): string {
    return this.isCreate ? 'Nouveau menu' : 'Modifier le menu';
  }

  get canSave(): boolean {
    return !!(this.label.trim() && this.routePath.trim());
  }

  private isRootMenuId(id: string): boolean {
    return this.settings.allMenus().some((m) => m.id === id);
  }

  ngOnInit(): void {
    const url = this.router.url;
    if (url.includes('/nouveau')) {
      this.isCreate = true;
      this.existingId = null;
      const qpParent = this.route.snapshot.queryParamMap.get('parent');
      if (qpParent && this.isRootMenuId(qpParent)) {
        this.parentId = qpParent;
      }
      this.selectedActionIds = new Set(this.settings.allActions().map((a) => a.id));
      return;
    }
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const m = this.settings.getMenuById(id);
      if (!m) {
        void this.router.navigate([this.backRoute]);
        return;
      }
      this.isCreate = false;
      this.existingId = id;
      this.label = m.label;
      this.icon = m.icon;
      this.routePath = m.route;
      this.active = m.active;
      const pId = this.findParentIdOf(id);
      if (pId === null) {
        this.parentId = null;
        this.parentReadOnlyLabel = null;
      } else if (this.isRootMenuId(pId)) {
        this.parentId = pId;
        this.parentReadOnlyLabel = null;
      } else {
        const parentNode = this.settings.getMenuById(pId);
        this.parentId = null;
        this.parentReadOnlyLabel = parentNode?.label ?? pId;
      }
      this.selectedActionIds = new Set(this.settings.allHabilitation()[id] ?? []);
    }
  }

  private findParentIdOf(id: string): string | null {
    const findParent = (items: MenuItem[]): string | null => {
      for (const it of items) {
        if (it.children?.some((c) => c.id === id)) {
          return it.id;
        }
        if (it.children?.length) {
          const sub = findParent(it.children);
          if (sub !== null) {
            return sub;
          }
        }
      }
      return null;
    };
    return findParent(this.settings.allMenus());
  }

  isActionOn(actionId: string): boolean {
    return this.selectedActionIds.has(actionId);
  }

  toggleAction(actionId: string, checked: boolean): void {
    if (checked) {
      this.selectedActionIds.add(actionId);
    } else {
      this.selectedActionIds.delete(actionId);
    }
  }

  toggleAllActions(checked: boolean): void {
    this.selectedActionIds = checked
      ? new Set(this.settings.allActions().map((a) => a.id))
      : new Set();
  }

  get allActionsChecked(): boolean {
    const all = this.settings.allActions();
    if (!all.length) return false;
    return all.every((a) => this.selectedActionIds.has(a.id));
  }

  save(): void {
    if (!this.canSave || this.loading()) return;
    this.loading.set(true);
    setTimeout(() => {
      const item: MenuItem = {
        id: this.isCreate ? this.settings.nextMenuId() : this.existingId!,
        label: this.label.trim(),
        icon: this.icon.trim() || 'folder',
        route: this.routePath.trim(),
        active: this.active,
      };

      if (this.isCreate) {
        if (this.parentId) {
          this.settings.addChildMenu(this.parentId, item);
        } else {
          this.settings.addRootMenu(item);
        }
      } else {
        this.settings.updateMenuItem(item);
      }
      this.settings.setMenuHabilitation(item.id, [...this.selectedActionIds]);
      this.loading.set(false);
      void this.router.navigate([this.backRoute]);
    }, 600);
  }
}
