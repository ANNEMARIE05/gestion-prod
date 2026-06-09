import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { User } from '../../../../models/menu';
import { SettingsService } from '../../../settings/services/settings.service';
import { PermissionService } from '../../../../core/services/permission.service';

@Component({
  selector: 'app-ressource-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './ressource-detail-page.component.html',
  styleUrl: './ressource-detail-page.component.scss',
})
export class RessourceDetailPageComponent implements OnInit {
  readonly perm = inject(PermissionService);

  private readonly route = inject(ActivatedRoute);
  private readonly settings = inject(SettingsService);

  user: User | null = null;
  readonly loading = signal(false);

  readonly backRoute = '/utilisateurs/ressources';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }
    this.user = this.settings.getUserById(id) ?? null;
    this.loading.set(true);
    this.settings.loadUserById(id).subscribe((u) => {
      this.loading.set(false);
      if (u) {
        this.user = u;
      }
    });
  }

  entityBlock(user: User): { label: string; parentLabel?: string } {
    const node = this.settings.getEntityById(user.entityId);
    if (!node) {
      return { label: this.settings.getEntityLabel(user.entityId) };
    }
    if (node.parentId) {
      const parent = this.settings.getEntityById(node.parentId);
      return {
        label: node.name,
        parentLabel: parent?.name ?? this.settings.getEntityLabel(node.parentId),
      };
    }
    return { label: node.name };
  }

  profileLabel(profileId: string): string {
    return this.settings.getProfileLabel(profileId);
  }

  specialtyLabel(specialtyId: string): string {
    return this.settings.getSpecialtyLabel(specialtyId);
  }
}
