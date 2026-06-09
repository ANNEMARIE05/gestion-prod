import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Jalon, SettingsService } from '../../../services/settings.service';
import { PermissionService } from '../../../services/permission.service';

@Component({
  selector: 'app-jalon-detail-page',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule],
  templateUrl: './jalon-detail-page.component.html',
})
export class JalonDetailPageComponent implements OnInit {
  readonly perm = inject(PermissionService);

  private readonly route = inject(ActivatedRoute);
  private readonly settings = inject(SettingsService);

  jalon: Jalon | null = null;
  loading = true;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading = false;
      return;
    }
    const cached = this.settings.getJalonById(id);
    if (cached) {
      this.jalon = cached;
      this.loading = false;
      return;
    }
    this.settings.loadJalonById(id).subscribe((j) => {
      this.jalon = j;
      this.loading = false;
    });
  }

  displayCode(): string {
    if (!this.jalon) {
      return '';
    }
    return this.jalon.code || `JAL-${this.jalon.id}`;
  }

  getChildLabels(): string[] {
    if (!this.jalon) {
      return [];
    }
    return this.settings.getJalonChildLabels(this.jalon.id);
  }

  getParentLabel(): string {
    if (!this.jalon?.parentId) return 'Aucun';
    return this.settings.getJalonById(this.jalon.parentId)?.label ?? 'Aucun';
  }

  getApplicationLabels(): string[] {
    if (!this.jalon?.applicationIds?.length) return [];
    return this.jalon.applicationIds
      .map((id) => this.settings.getApplicationById(id)?.label)
      .filter((label): label is string => !!label);
  }
}
