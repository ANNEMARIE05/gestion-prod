import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthorizationProfile } from '../../../models/authorization';
import { PermissionService } from '../../../services/permission.service';
import { SettingsService } from '../../../services/settings.service';

@Component({
  selector: 'app-profil-detail-page',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule],
  templateUrl: './profil-detail-page.component.html',
})
export class ProfilDetailPageComponent implements OnInit {
  readonly perm = inject(PermissionService);

  private readonly route = inject(ActivatedRoute);
  private readonly settings = inject(SettingsService);

  profile: AuthorizationProfile | null = null;
  loading = true;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading = false;
      return;
    }
    const cached = this.settings.getProfile(id);
    if (cached) {
      this.profile = cached;
      this.loading = false;
      return;
    }
    this.settings.loadProfileById(id).subscribe((p) => {
      this.profile = p;
      this.loading = false;
    });
  }

  displayCode(): string {
    if (!this.profile) {
      return '';
    }
    return this.profile.code || `PROF-${this.profile.id}`;
  }

  menuEntries(): { menuId: string; menuLabel: string; actions: string[] }[] {
    if (!this.profile) {
      return [];
    }
    return this.profile.visibleMenuIds.map((menuId) => {
      const menu = this.settings.getMenuById(menuId);
      const actionIds = this.profile!.allowedActionsByMenu[menuId] ?? [];
      const actions = actionIds.map((id) => this.settings.getActionById(id)?.label ?? id);
      return {
        menuId,
        menuLabel: menu?.label ?? menuId,
        actions,
      };
    });
  }
}
