import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { User } from '../../../../models/menu';
import { Entity, SettingsService } from '../../../settings/services/settings.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { ButtonLoadingDirective } from '../../../../shared/directives/button-loading.directive';

function initialsFromPerson(firstName: string, lastName: string): string {
  const f = firstName.trim();
  const l = lastName.trim();
  if (f && l) {
    return (f[0] + l[0]).toUpperCase();
  }
  if (l.length >= 2) {
    return l.slice(0, 2).toUpperCase();
  }
  if (f.length >= 2) {
    return f.slice(0, 2).toUpperCase();
  }
  return (l[0] || f[0] || '?').toUpperCase() + (l[1] || f[1] || '?').toUpperCase();
}

@Component({
  selector: 'app-user-form-page',
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
    ButtonLoadingDirective,
  ],
  templateUrl: './user-form-page.component.html',
  styleUrl: './user-form-page.component.scss',
})
export class UserFormPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly settings = inject(SettingsService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly errorHandler = inject(ErrorHandlerService);

  isCreate = true;
  existingId: string | null = null;
  readonly loading = signal(false);

  code = '';
  lastName = '';
  firstName = '';
  email = '';
  contact = '';
  entityId = '';
  subEntityId = '';
  profileId = '';
  specialtyId = '';

  readonly backRoute = '/utilisateurs/ressources';

  get pageTitle(): string {
    return this.isCreate ? 'Nouvelle ressource' : 'Modifier la ressource';
  }

  get canSave(): boolean {
    return !!(
      this.lastName.trim() &&
      this.firstName.trim() &&
      this.email.trim() &&
      this.entityId &&
      (!this.hasSubEntities || this.subEntityId) &&
      this.profileId &&
      this.specialtyId
    );
  }

  get rootEntities(): Entity[] {
    return this.settings.allEntities();
  }

  get selectedEntityChildren(): Entity[] {
    if (!this.entityId) {
      return [];
    }
    return this.settings.getEntityById(this.entityId)?.children ?? [];
  }

  get hasSubEntities(): boolean {
    return this.selectedEntityChildren.length > 0;
  }

  ngOnInit(): void {
    const url = this.router.url;
    if (url.includes('/create') || url.includes('/nouveau')) {
      this.isCreate = true;
      this.existingId = null;
      this.code = this.settings.generatePrefixedCode('RES', this.settings.allUsers());
      const entities = this.rootEntities;
      this.entityId = entities.find((e) => e.active)?.id ?? entities[0]?.id ?? '';
      this.syncSubEntityState();
      this.profileId = this.settings.allProfiles()[0]?.id ?? '1';
      const activeSpecialty = this.settings.allSpecialties().find((s) => s.active);
      this.specialtyId = activeSpecialty?.id ?? this.settings.allSpecialties()[0]?.id ?? '';
      return;
    }
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isCreate = false;
      this.existingId = id;
      this.loading.set(true);
      this.settings.loadUserById(id).subscribe((u) => {
        this.loading.set(false);
        if (!u) {
          void this.router.navigate([this.backRoute]);
          return;
        }
        this.applyUser(u);
      });
    }
  }

  private applyUser(u: User): void {
    this.code = u.code ?? '';
    this.lastName = u.lastName;
    this.firstName = u.firstName;
    this.email = u.email;
    this.contact = u.contact ?? '';
    const selectedEntity = this.settings.getEntityById(u.entityId);
    if (selectedEntity?.parentId) {
      this.entityId = selectedEntity.parentId;
      this.subEntityId = selectedEntity.id;
    } else {
      this.entityId = u.entityId;
      this.syncSubEntityState();
    }
    this.profileId = u.profileId;
    this.specialtyId = u.specialtyId;
  }

  onEntityChange(): void {
    this.syncSubEntityState(true);
  }

  save(): void {
    if (this.loading() || !this.canSave) return;
    const ln = this.lastName.trim();
    const fn = this.firstName.trim();
    const e = this.email.trim();
    const selectedEntityId = this.subEntityId || this.entityId;
    if (!ln || !fn || !e || !selectedEntityId || !this.profileId || !this.specialtyId) {
      return;
    }
    this.loading.set(true);
    const displayName = `${fn} ${ln}`.trim();
    const existing = this.existingId ? this.settings.getUserById(this.existingId) : undefined;
    const user: User = {
      id: this.isCreate ? '' : this.existingId!,
      code: this.code.trim() || existing?.code,
      lastName: ln,
      firstName: fn,
      name: displayName,
      email: e,
      profileId: this.profileId,
      entityId: selectedEntityId,
      specialtyId: this.specialtyId,
      avatar: initialsFromPerson(fn, ln),
      createdAt: existing?.createdAt,
      ...(this.contact.trim() ? { contact: this.contact.trim() } : {}),
    };
    this.settings.persistUser(user, this.isCreate).subscribe({
      next: () => {
        this.loading.set(false);
        this.snackBar.open(
          this.isCreate ? 'Ressource créée avec succès' : 'Ressource modifiée avec succès',
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

  private syncSubEntityState(reset = false): void {
    const children = this.selectedEntityChildren;
    if (!children.length) {
      this.subEntityId = '';
      return;
    }
    if (reset || !children.some((child) => child.id === this.subEntityId)) {
      this.subEntityId = children.find((child) => child.active)?.id ?? children[0]?.id ?? '';
    }
  }
}
