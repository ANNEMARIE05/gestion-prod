import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Entity, SettingsService } from '../../../services/settings.service';

@Component({
  selector: 'app-entite-detail-page',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule],
  templateUrl: './entite-detail-page.component.html',
})
export class EntiteDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly settings = inject(SettingsService);

  entity: Entity | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }
    this.entity = this.settings.getEntityById(id) ?? null;
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
