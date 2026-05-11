import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { LayoutService } from '../../services/layout.service';

@Component({
  selector: 'app-main-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, TopbarComponent],
  templateUrl: './main-shell.component.html',
  styleUrl: './main-shell.component.scss'
})
export class MainShellComponent {
  private layoutService = inject(LayoutService);
  sidebarCollapsed = this.layoutService.sidebarCollapsed;
}
