import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { UserManagementComponent } from '../../settings/user-management/user-management.component';

@Component({
  selector: 'app-ressources-page',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, UserManagementComponent],
  templateUrl: './ressources-page.component.html',
  styleUrl: './ressources-page.component.scss'
})
export class RessourcesPageComponent {}
