import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PermissionService } from '../../services/permission.service';
import { LayoutService } from '../../services/layout.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatListModule, MatIconModule, MatExpansionModule, MatTooltipModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  private layoutService = inject(LayoutService);

  menus = this.permissionService.visibleMenus;
  expandedMenus = signal<string[]>([]);
  collapsed = this.layoutService.sidebarCollapsed;

  constructor(private permissionService: PermissionService) {}

  toggleExpand(id: string) {
    if (this.collapsed()) {
      this.layoutService.setSidebarCollapsed(false);
      this.expandedMenus.set([id]);
      return;
    }
    this.expandedMenus.update(ids =>
      ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]
    );
  }

  isExpanded(id: string): boolean {
    return !this.collapsed() && this.expandedMenus().includes(id);
  }

  toggleSidebar() {
    this.layoutService.toggleSidebar();
  }
}
