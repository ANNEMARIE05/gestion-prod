import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from '../../features/auth/services/auth.service';
import { LayoutService } from '../../core/services/layout.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, MatToolbarModule, MatButtonModule, MatIconModule, MatBadgeModule, MatTooltipModule, MatDialogModule],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent {
  private layoutService = inject(LayoutService);

  currentUser = this.authService.currentUser;
  sidebarCollapsed = this.layoutService.sidebarCollapsed;
  mobileSidebarOpen = this.layoutService.mobileSidebarOpen;

  constructor(
    private authService: AuthService,
    private dialog: MatDialog,
  ) { }

  toggleSidebar() {
    this.layoutService.toggleSidebar();
  }

  toggleMobileSidebar() {
    this.layoutService.toggleMobileSidebar();
  }

  onLogout() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Se déconnecter',
        message: 'Êtes-vous sûr de vouloir vous déconnecter ?',
        confirmText: 'Se déconnecter',
        cancelText: 'Annuler',
        confirmColor: 'warn',
      },
    });

    dialogRef.afterClosed().subscribe((ok: boolean) => {
      if (ok) {
        this.authService.logout();
      }
    });
  }
}
