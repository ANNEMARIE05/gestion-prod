import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthorizationProfile, AppAction, appActionId } from '../../../../models/authorization';
import { SettingsService } from '../../../settings/services/settings.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { flattenMenuItems } from '../../../../utils/menu-tree';
import { ButtonLoadingDirective } from '../../../../shared/directives/button-loading.directive';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

interface ProfileHabilitation {
  menuId: string;
  menuLabel: string;
  actionIds: string[];
}

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
    MatSelectModule,
    MatTooltipModule,
    MatSnackBarModule,
    ButtonLoadingDirective,
  ],
  templateUrl: './profile-form-page.component.html',
  styleUrl: './profile-form-page.component.scss',
})
export class ProfileFormPageComponent implements OnInit {
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
  readonly habilitations = signal<ProfileHabilitation[]>([]);
  readonly showAssignedHabilitations = signal<boolean>(true);

  selectedMenuId: string | null = null;
  readonly editingHabilitationIndex = signal<number | null>(null);
  readonly selectedActionIds = signal<string[]>([]);
  readonly menuAvailableActionIds = signal<string[]>([]);
  readonly loadingMenuActions = signal(false);
  private initialSelectedActionKeys = new Set<string>();
  actionsDropdownOpen = false;

  readonly backRoute = '/utilisateurs/profils';

  readonly allMenus = computed(() => {
    const assignedIds = new Set(this.habilitations().map((h) => h.menuId));
    return flattenMenuItems(this.settings.allMenus())
      .filter((m) => m.active && (!assignedIds.has(m.id) || m.id === this.selectedMenuId))
      .sort((a, b) => a.label.localeCompare(b.label, 'fr'));
  });



  readonly menuAvailableActions = computed<AppAction[]>(() => {
    const keys = new Set(this.menuAvailableActionIds().map((id) => this.normalizeActionKey(id)));
    const fromCatalog = this.settings
      .allActions()
      .filter((a) => a.active && keys.has(this.normalizeActionKey(appActionId(a))));
    const catalogKeys = new Set(fromCatalog.map((a) => this.normalizeActionKey(appActionId(a))));
    const orphans = this.menuAvailableActionIds()
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
    return [...fromCatalog, ...orphans].sort((a, b) =>
      appActionId(a).localeCompare(appActionId(b), 'fr'),
    );
  });

  readonly selectedActions = computed<AppAction[]>(() => {
    const ids = new Set(this.selectedActionIds().map((id) => this.normalizeActionKey(id)));
    const fromCatalog = this.menuAvailableActions().filter((a) =>
      ids.has(this.normalizeActionKey(appActionId(a))),
    );
    const catalogKeys = new Set(fromCatalog.map((a) => this.normalizeActionKey(appActionId(a))));
    const orphans = this.selectedActionIds()
      .filter((id) => !catalogKeys.has(this.normalizeActionKey(id)))
      .map(
        (id) =>
          ({
            id,
            actionId: id,
            code: id,
            label: this.displayActionId(id),
            icon: 'bolt',
            active: true,
          }) satisfies AppAction,
      );
    return [...fromCatalog, ...orphans];
  });

  readonly pendingAdds = computed(() =>
    this.selectedActionIds().filter(
      (id) => !this.initialSelectedActionKeys.has(this.normalizeActionKey(id)),
    ),
  );

  readonly pendingRemoves = computed(() =>
    [...this.initialSelectedActionKeys].filter(
      (key) => !this.selectedActionIds().some((id) => this.normalizeActionKey(id) === key),
    ),
  );

  readonly hasPendingActionChanges = computed(
    () => this.pendingAdds().length > 0 || this.pendingRemoves().length > 0,
  );

  readonly pendingAddsLabel = computed(() =>
    this.pendingAdds().map((id) => this.displayActionId(id)).join(', '),
  );

  readonly pendingRemovesLabel = computed(() =>
    this.pendingRemoves().map((id) => this.displayActionId(id)).join(', '),
  );

  get pageTitle(): string {
    return this.isCreate ? 'Nouveau profil' : 'Modifier le profil';
  }

  get canSave(): boolean {
    return !!this.label.trim() && !!this.code.trim();
  }

  get canCommitHabilitation(): boolean {
    return !!this.selectedMenuId && this.selectedActionIds().length > 0 && !this.loadingMenuActions();
  }

  get habilitationCommitLabel(): string {
    return this.editingHabilitationIndex() !== null ? 'Mettre à jour le menu' : 'Ajouter le menu';
  }

  ngOnInit(): void {
    const url = this.router.url;
    if (url.includes('/create') || url.includes('/nouveau')) {
      this.isCreate = true;
      this.existingId = null;
      this.showAssignedHabilitations.set(true);
      this.code = this.settings.generatePrefixedCode('PROF', this.settings.allProfiles());
      return;
    }
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isCreate = false;
      this.existingId = id;
      this.showAssignedHabilitations.set(false);
      this.settings.loadProfileById(id).subscribe((p) => {
        if (!p) {
          void this.router.navigate([this.backRoute]);
          return;
        }
        this.label = p.label;
        this.code = p.code ?? `PROF-${p.id}`;
      });
    }
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

  onMenuSelectChange(): void {
    if (!this.selectedMenuId) {
      this.resetHabilitationEditor();
      return;
    }
    const idx = this.habilitations().findIndex((h) => h.menuId === this.selectedMenuId);
    if (idx !== -1) {
      this.editingHabilitationIndex.set(idx);
      const hab = this.habilitations()[idx];
      this.loadActionsForSelectedMenu(hab.actionIds);
    } else {
      this.editingHabilitationIndex.set(null);
      this.loadActionsForSelectedMenu();
    }
  }

  editHabilitation(index: number): void {
    const hab = this.habilitations()[index];
    if (!hab) {
      return;
    }
    this.editingHabilitationIndex.set(index);
    this.selectedMenuId = hab.menuId;
    this.loadActionsForSelectedMenu(hab.actionIds);
  }

  cancelHabilitationEdit(): void {
    this.resetHabilitationEditor();
  }

  toggleActionsDropdown(): void {
    if (this.loadingMenuActions() || !this.selectedMenuId) {
      return;
    }
    this.actionsDropdownOpen = !this.actionsDropdownOpen;
  }

  isActionSelected(actionId: string): boolean {
    const key = this.normalizeActionKey(actionId);
    return this.selectedActionIds().some((id) => this.normalizeActionKey(id) === key);
  }

  toggleAction(actionId: string): void {
    const key = this.normalizeActionKey(actionId);
    if (this.isActionSelected(actionId)) {
      this.selectedActionIds.update((list) =>
        list.filter((id) => this.normalizeActionKey(id) !== key),
      );
    } else {
      this.selectedActionIds.update((list) => [
        ...list,
        this.settings.canonicalActionId(actionId),
      ]);
    }
  }

  removeAction(actionId: string, event: Event): void {
    event.stopPropagation();
    const key = this.normalizeActionKey(actionId);
    this.selectedActionIds.update((list) =>
      list.filter((id) => this.normalizeActionKey(id) !== key),
    );
  }

  commitHabilitation(): void {
    if (!this.canCommitHabilitation || !this.selectedMenuId) {
      return;
    }
    const menu = this.settings.getMenuById(this.selectedMenuId);
    const actionIds = this.settings.resolveActionIdsForApi(this.selectedActionIds());
    const entry: ProfileHabilitation = {
      menuId: this.selectedMenuId,
      menuLabel: menu?.label ?? this.selectedMenuId,
      actionIds,
    };

    const editing = this.editingHabilitationIndex();
    if (editing !== null) {
      this.habilitations.update((list) => {
        const next = [...list];
        next[editing] = entry;
        return next;
      });
    } else {
      const idx = this.habilitations().findIndex((h) => h.menuId === this.selectedMenuId);
      if (idx !== -1) {
        this.habilitations.update((list) => {
          const next = [...list];
          next[idx] = entry;
          return next;
        });
      } else {
        this.habilitations.update((list) => [...list, entry]);
      }
    }

    this.showAssignedHabilitations.set(true);
    this.resetHabilitationEditor();
  }

  toggleShowAssignedHabilitations(): void {
    this.showAssignedHabilitations.update((val) => !val);
  }

  removeHabilitation(index: number): void {
    this.habilitations.update((list) => list.filter((_, i) => i !== index));
    const editing = this.editingHabilitationIndex();
    if (editing === index) {
      this.resetHabilitationEditor();
    } else if (editing !== null && editing > index) {
      this.editingHabilitationIndex.set(editing - 1);
    }
  }

  displayActionId(id: string): string {
    const action = this.settings
      .allActions()
      .find((a) => this.normalizeActionKey(appActionId(a)) === this.normalizeActionKey(id));
    return action ? action.label || appActionId(action) : id;
  }

  getActionLabel(menuId: string, actionId: string): string {
    return this.displayActionId(actionId);
  }

  save(): void {
    if (!this.canSave || this.loading()) {
      return;
    }
    this.loading.set(true);
    const { visibleMenuIds, allowedActionsByMenu } = this.habilitationsToProfileFields();
    const profile: AuthorizationProfile = {
      id: this.isCreate ? '' : this.existingId!,
      code: this.code.trim(),
      label: this.label.trim(),
      visibleMenuIds,
      allowedActionsByMenu,
    };
    this.settings.persistProfile(profile, this.isCreate).subscribe({
      next: () => {
        this.loading.set(false);
        this.snackBar.open(
          this.isCreate ? 'Profil créé avec succès' : 'Profil modifié avec succès',
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

  private loadActionsForSelectedMenu(prefillActionIds?: string[]): void {
    if (!this.selectedMenuId) {
      return;
    }
    this.loadingMenuActions.set(true);
    this.settings.fetchMenuActionIdsFromApi(this.selectedMenuId).subscribe({
      next: (availableIds) => {
        const canonicalAvailable = availableIds.map((id) => this.settings.canonicalActionId(id));
        this.menuAvailableActionIds.set(canonicalAvailable);

        const source =
          prefillActionIds ??
          (this.editingHabilitationIndex() !== null
            ? this.habilitations()[this.editingHabilitationIndex()!]?.actionIds
            : []);

        const availableKeys = new Set(canonicalAvailable.map((id) => this.normalizeActionKey(id)));
        const preselected = (source ?? [])
          .map((id) => this.settings.canonicalActionId(id))
          .filter((id) => availableKeys.has(this.normalizeActionKey(id)));

        this.selectedActionIds.set(preselected);
        this.initialSelectedActionKeys = new Set(
          preselected.map((id) => this.normalizeActionKey(id)),
        );
        this.loadingMenuActions.set(false);
      },
      error: () => {
        this.loadingMenuActions.set(false);
        this.snackBar.open('Impossible de charger les actions du menu', 'Fermer', { duration: 4000 });
      },
    });
  }

  private resetHabilitationEditor(): void {
    this.selectedMenuId = null;
    this.editingHabilitationIndex.set(null);
    this.selectedActionIds.set([]);
    this.menuAvailableActionIds.set([]);
    this.initialSelectedActionKeys = new Set();
    this.actionsDropdownOpen = false;
    this.loadingMenuActions.set(false);
  }



  private habilitationsToProfileFields(): {
    visibleMenuIds: string[];
    allowedActionsByMenu: Record<string, string[]>;
  } {
    const visibleMenuIds: string[] = [];
    const allowedActionsByMenu: Record<string, string[]> = {};
    for (const hab of this.habilitations()) {
      if (!visibleMenuIds.includes(hab.menuId)) {
        visibleMenuIds.push(hab.menuId);
      }
      allowedActionsByMenu[hab.menuId] = hab.actionIds.map((id) =>
        this.settings.canonicalActionId(id),
      );
    }
    return { visibleMenuIds, allowedActionsByMenu };
  }

  private normalizeActionKey(value: string): string {
    return value.trim().toUpperCase();
  }
}
