import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MenuItem } from '../../../../models/menu';
import { AppAction, appActionId } from '../../../../models/authorization';
import { SettingsService } from '../../services/settings.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import {
  collectMenuDescendantIds,
  findParentIdOf,
  flattenMenuItems,
  flattenMenuWithDepth,
} from '../../../../utils/menu-tree';
import { ButtonLoadingDirective } from '../../../../shared/directives/button-loading.directive';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

interface ParentOption {
  id: string;
  label: string;
}

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
    MatSlideToggleModule,
    MatSnackBarModule,
    ButtonLoadingDirective,
  ],
  templateUrl: './menu-form-page.component.html',
})
export class MenuFormPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly errorHandler = inject(ErrorHandlerService);
  readonly settings = inject(SettingsService);

  isCreate = true;
  existingId: string | null = null;
  readonly loading = signal(false);

  code = '';
  label = '';
  icon = 'folder';
  routePath = '';
  active = true;
  parentId: string | null = null;

  /** actionId sélectionnés (même logique que formData.actionIds dans l'ancien backoffice). */
  readonly actionIds = signal<string[]>([]);
  /** État initial en édition — sert à détecter ajouts / retraits. */
  private initialAssignedKeys = new Set<string>();

  readonly loadingAssignedActions = signal(false);
  actionsDropdownOpen = false;

  readonly backRoute = '/parametrages/menus';

  readonly availableActions = computed<AppAction[]>(() =>
    [...this.settings.allActions()]
      .filter((a) => a.active)
      .sort((a, b) => appActionId(a).localeCompare(appActionId(b), 'fr')),
  );

  /** Actions sélectionnées affichées dans le champ (comme selectedActions dans l'ancien backoffice). */
  readonly selectedActions = computed<AppAction[]>(() => {
    const ids = new Set(this.actionIds().map((id) => this.normalizeActionKey(id)));
    const fromCatalog = this.availableActions().filter((a) =>
      ids.has(this.normalizeActionKey(appActionId(a))),
    );
    const catalogKeys = new Set(fromCatalog.map((a) => this.normalizeActionKey(appActionId(a))));
    const orphans = this.actionIds()
      .filter((id) => !catalogKeys.has(this.normalizeActionKey(id)))
      .map(
        (id) =>
          ({
            id,
            actionId: id,
            code: id,
            label: id,
            icon: 'bolt',
            active: true,
          }) satisfies AppAction,
      );
    return [...fromCatalog, ...orphans];
  });

  readonly pendingAdds = computed<string[]>(() => {
    if (this.isCreate) {
      return [];
    }
    return this.actionIds().filter(
      (id) => !this.initialAssignedKeys.has(this.normalizeActionKey(id)),
    );
  });

  readonly pendingRemoves = computed<string[]>(() => {
    if (this.isCreate) {
      return [];
    }
    return [...this.initialAssignedKeys].filter(
      (key) => !this.actionIds().some((id) => this.normalizeActionKey(id) === key),
    );
  });

  readonly hasPendingActionChanges = computed(
    () => this.pendingAdds().length > 0 || this.pendingRemoves().length > 0,
  );

  readonly pendingAddsLabel = computed(() =>
    this.pendingAdds().map((id) => this.displayActionId(id)).join(', '),
  );

  readonly pendingRemovesLabel = computed(() =>
    this.pendingRemoves().map((id) => this.displayActionId(id)).join(', '),
  );

  readonly parentOptions = computed<ParentOption[]>(() => {
    const self = this.existingId;
    const flat = flattenMenuWithDepth(this.settings.allMenus());

    if (this.isCreate) {
      return this.settings
        .allMenus()
        .filter((m) => m.active)
        .map((m) => ({ id: m.id, label: m.label }))
        .sort((a, b) => a.label.localeCompare(b.label, 'fr'));
    }

    const blocked = new Set<string>();
    if (self) {
      blocked.add(self);
      const current = this.settings.getMenuById(self);
      for (const id of collectMenuDescendantIds(current)) {
        blocked.add(id);
      }
    }

    return flat
      .filter(({ item }) => item.active && !blocked.has(item.id))
      .map(({ item, depth }) => ({
        id: item.id,
        label: depth > 0 ? `${'  '.repeat(depth)}└─ ${item.label}` : item.label,
      }));
  });

  get pageTitle(): string {
    return this.isCreate ? 'Nouveau menu' : 'Modifier le menu';
  }

  get canSave(): boolean {
    return !!(
      this.code.trim() &&
      this.label.trim() &&
      this.icon.trim() &&
      !this.loadingAssignedActions()
    );
  }

  ngOnInit(): void {
    const url = this.router.url;
    if (url.includes('/create') || url.includes('/nouveau')) {
      this.isCreate = true;
      this.existingId = null;
      const qpParent = this.route.snapshot.queryParamMap.get('parent');
      if (qpParent && this.settings.getMenuById(qpParent)) {
        this.parentId = qpParent;
      }
      this.actionIds.set([]);
      this.initialAssignedKeys = new Set();
      this.code = this.settings.generatePrefixedCode('MEN', flattenMenuItems(this.settings.allMenus()));
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
      this.routePath = m.route === '/' ? '' : m.route;
      this.active = m.active;
      this.code = m.code ?? '';
      this.parentId = findParentIdOf(this.settings.allMenus(), id);
      this.loadAssignedActionsFromApi(id);
    }
  }

  displayActionId(id: string): string {
    const action = this.settings
      .allActions()
      .find((a) => this.normalizeActionKey(appActionId(a)) === this.normalizeActionKey(id));
    return action ? appActionId(action) : id;
  }

  private normalizeActionKey(value: string): string {
    return value.trim().toUpperCase();
  }

  /** Charge les actions depuis GET /menus/:id avant toute modification (comme l'ancien backoffice). */
  private loadAssignedActionsFromApi(menuId: string): void {
    this.loadingAssignedActions.set(true);
    this.settings.fetchMenuActionIdsFromApi(menuId).subscribe({
      next: (ids) => {
        const canonical = ids.map((ref) => this.settings.canonicalActionId(ref));
        this.actionIds.set(canonical);
        this.initialAssignedKeys = new Set(canonical.map((ref) => this.normalizeActionKey(ref)));
        this.loadingAssignedActions.set(false);
      },
      error: () => {
        this.loadingAssignedActions.set(false);
      },
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.actions-dropdown-container')) {
      this.actionsDropdownOpen = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.actionsDropdownOpen = false;
  }

  toggleActionsDropdown(): void {
    if (this.loadingAssignedActions()) {
      return;
    }
    this.actionsDropdownOpen = !this.actionsDropdownOpen;
  }

  isActionSelected(actionId: string): boolean {
    const key = this.normalizeActionKey(actionId);
    return this.actionIds().some((id) => this.normalizeActionKey(id) === key);
  }

  toggleAction(actionId: string): void {
    const key = this.normalizeActionKey(actionId);
    if (this.isActionSelected(actionId)) {
      this.actionIds.update((list) =>
        list.filter((id) => this.normalizeActionKey(id) !== key),
      );
    } else {
      this.actionIds.update((list) => [
        ...list,
        this.settings.canonicalActionId(actionId),
      ]);
    }
  }

  removeAction(actionId: string, event: Event): void {
    event.stopPropagation();
    const key = this.normalizeActionKey(actionId);
    this.actionIds.update((list) =>
      list.filter((id) => this.normalizeActionKey(id) !== key),
    );
  }

  private actionIdsForSave(): string[] {
    return this.settings.resolveActionIdsForApi(this.actionIds());
  }

  save(): void {
    if (!this.canSave || this.loading()) return;
    this.loading.set(true);

    const route = this.routePath.trim();
    const item: MenuItem = {
      id: this.isCreate ? '' : this.existingId!,
      code: this.code.trim().toUpperCase(),
      label: this.label.trim(),
      icon: this.icon.trim() || 'folder',
      route: route ? (route.startsWith('/') ? route : `/${route}`) : '',
      active: this.active,
    };

    this.settings
      .persistMenu(item, {
        isCreate: this.isCreate,
        parentId: this.parentId,
        actionIds: this.actionIdsForSave(),
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.snackBar.open(
            this.isCreate ? 'Menu créé avec succès' : 'Menu modifié avec succès',
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
