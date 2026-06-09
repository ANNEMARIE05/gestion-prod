import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MenuItem } from '../../../models/menu';
import { MenuAssignedAction } from '../../../models/authorization';
import { SettingsService } from '../../../services/settings.service';
import { PermissionService } from '../../../services/permission.service';
import { findParentIdOf } from '../../../utils/menu-tree';

@Component({
  selector: 'app-menu-detail-page',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule],
  templateUrl: './menu-detail-page.component.html',
})
export class MenuDetailPageComponent implements OnInit {
  readonly perm = inject(PermissionService);

  private readonly route = inject(ActivatedRoute);
  private readonly settings = inject(SettingsService);

  readonly menu = signal<MenuItem | null>(null);
  readonly loadingActions = signal(true);

  readonly menuActions = computed<MenuAssignedAction[]>(() => {
    const m = this.menu();
    if (!m) {
      return [];
    }
    this.settings.allMenuAssignedActions();
    return this.settings.getAssignedActionsForMenu(m.id);
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }
    const found = this.settings.getMenuById(id);
    if (!found) {
      return;
    }
    this.menu.set(found);
    this.settings.refreshMenuActionsFromApi(id).subscribe({
      complete: () => this.loadingActions.set(false),
    });
  }

  getParentLabel(): string {
    const m = this.menu();
    if (!m) {
      return '—';
    }
    const parentId = findParentIdOf(this.settings.allMenus(), m.id);
    if (!parentId) {
      return '—';
    }
    return this.settings.getMenuById(parentId)?.label ?? '—';
  }
}
