import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { LayoutService } from '../../core/services/layout.service';
import { SettingsService } from '../../features/settings/services/settings.service';
import { PermissionService } from '../../core/services/permission.service';
import { ProductionService } from '../../features/production/services/production.service';
import { PlanificationService } from '../../features/planification/services/planification.service';
import { AuditTrailService } from '../../features/audit-trail/services/audit-trail.service';

@Component({
  selector: 'app-main-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, TopbarComponent],
  templateUrl: './main-shell.component.html',
  styleUrl: './main-shell.component.scss'
})
export class MainShellComponent implements OnInit {
  private layoutService = inject(LayoutService);
  private settingsService = inject(SettingsService);
  private permissionService = inject(PermissionService);
  private productionService = inject(ProductionService);
  private planificationService = inject(PlanificationService);
  private auditTrailService = inject(AuditTrailService);

  sidebarCollapsed = this.layoutService.sidebarCollapsed;
  mobileSidebarOpen = this.layoutService.mobileSidebarOpen;

  closeMobileSidebar(): void {
    this.layoutService.closeMobileSidebar();
  }

  ngOnInit(): void {
    this.permissionService.syncCurrentMenuFromRoute();
    this.settingsService.refreshSettings();
    this.productionService.refreshItems().subscribe();
    this.planificationService.refreshTasks().subscribe();
    this.auditTrailService.refreshEntries().subscribe();
  }
}
