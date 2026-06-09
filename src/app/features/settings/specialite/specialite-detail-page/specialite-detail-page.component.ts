import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PermissionService } from '../../../../core/services/permission.service';
import { SettingsService, Specialty } from '../../services/settings.service';

@Component({
  selector: 'app-specialite-detail-page',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule],
  templateUrl: './specialite-detail-page.component.html',
})
export class SpecialiteDetailPageComponent implements OnInit {
  readonly perm = inject(PermissionService);

  private readonly route = inject(ActivatedRoute);
  private readonly settings = inject(SettingsService);

  specialty: Specialty | null = null;
  loading = true;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading = false;
      return;
    }
    const cached = this.settings.getSpecialtyById(id);
    if (cached) {
      this.specialty = cached;
      this.loading = false;
      return;
    }
    this.settings.loadSpecialtyById(id).subscribe((s) => {
      this.specialty = s;
      this.loading = false;
    });
  }

  displayCode(): string {
    if (!this.specialty) {
      return '';
    }
    return this.specialty.code || `SPE-${this.specialty.id}`;
  }
}
