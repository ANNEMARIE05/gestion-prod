import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Jalon, SettingsService } from '../../../services/settings.service';

@Component({
  selector: 'app-jalon-detail-page',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule],
  templateUrl: './jalon-detail-page.component.html',
})
export class JalonDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly settings = inject(SettingsService);

  jalon: Jalon | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }
    this.jalon = this.settings.getJalonById(id) ?? null;
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
