import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { User } from '../../../models/menu';
import { SettingsService } from '../../../services/settings.service';

@Component({
  selector: 'app-ressource-detail-page',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule],
  templateUrl: './ressource-detail-page.component.html',
  styleUrl: './ressource-detail-page.component.scss',
})
export class RessourceDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly settings = inject(SettingsService);

  user: User | null = null;

  readonly backRoute = '/utilisateurs/ressources';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }
    this.user = this.settings.allUsers().find((u) => u.id === id) ?? null;
  }

  entityBlock(user: User): { label: string; parentLabel?: string } {
    const node = this.settings.getEntityById(user.entityId);
    if (!node) {
      return { label: this.settings.getEntityLabel(user.entityId) };
    }
    if (node.parentId) {
      const parent = this.settings.getEntityById(node.parentId);
      return {
        label: node.name,
        parentLabel: parent?.name ?? this.settings.getEntityLabel(node.parentId),
      };
    }
    return { label: node.name };
  }

  profileLabel(profileId: string): string {
    return this.settings.getProfileLabel(profileId);
  }

  specialtyLabel(specialtyId: string): string {
    return this.settings.getSpecialtyLabel(specialtyId);
  }
}
