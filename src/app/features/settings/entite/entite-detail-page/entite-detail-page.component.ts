import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Entity, SettingsService } from '../../services/settings.service';
import { PermissionService } from '../../../../core/services/permission.service';

@Component({
  selector: 'app-entite-detail-page',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule],
  templateUrl: './entite-detail-page.component.html',
})
export class EntiteDetailPageComponent implements OnInit {
  readonly perm = inject(PermissionService);

  private readonly route = inject(ActivatedRoute);
  private readonly settings = inject(SettingsService);

  entity: Entity | null = null;
  loading = true;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading = false;
      return;
    }
    const cached = this.settings.getEntityById(id);
    if (cached) {
      this.entity = cached;
      this.loading = false;
      return;
    }
    this.settings.loadEntityById(id).subscribe((e) => {
      this.entity = e;
      this.loading = false;
    });
  }

  displayCode(): string {
    if (!this.entity) {
      return '';
    }
    return this.entity.code || `ENT-${this.entity.id}`;
  }

  getParentLabel(): string {
    if (!this.entity?.parentId) return '';
    return this.settings.getEntityById(this.entity.parentId)?.name ?? '—';
  }

  /** Libellé sous le titre : « Entité » ou « Sous-entité de … ». */
  headerSubtitle(): string {
    if (!this.entity) return '';
    const parentName = this.getParentLabel();
    if (!this.entity.parentId || !parentName) {
      return 'Entité';
    }
    return `Sous-entité de ${parentName}`;
  }

  getChildLabels(): string[] {
    if (!this.entity?.children?.length) return [];
    return this.entity.children.map((c) => c.name);
  }
}
