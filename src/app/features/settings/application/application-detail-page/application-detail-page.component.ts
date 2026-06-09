import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PermissionService } from '../../../../core/services/permission.service';
import { Application, SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-application-detail-page',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule],
  templateUrl: './application-detail-page.component.html',
})
export class ApplicationDetailPageComponent implements OnInit {
  readonly perm = inject(PermissionService);

  private readonly route = inject(ActivatedRoute);
  private readonly settings = inject(SettingsService);

  application: Application | null = null;
  loading = true;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading = false;
      return;
    }
    const cached = this.settings.getApplicationById(id);
    if (cached) {
      this.application = cached;
      this.loading = false;
      return;
    }
    this.settings.loadApplicationById(id).subscribe((a) => {
      this.application = a;
      this.loading = false;
    });
  }

  displayCode(): string {
    if (!this.application) {
      return '';
    }
    return this.application.code || `APP-${this.application.id}`;
  }
}
