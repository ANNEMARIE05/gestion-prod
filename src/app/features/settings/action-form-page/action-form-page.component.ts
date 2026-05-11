import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AppAction } from '../../../models/authorization';
import { SettingsService } from '../../../services/settings.service';
import { ButtonLoadingDirective } from '../../../shared/directives/button-loading.directive';

@Component({
  selector: 'app-action-form-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSlideToggleModule,
    ButtonLoadingDirective,
  ],
  templateUrl: './action-form-page.component.html',
})
export class ActionFormPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly settings = inject(SettingsService);

  isCreate = true;
  existingId: string | null = null;
  readonly loading = signal(false);

  code = '';
  label = '';
  icon = 'bolt';
  active = true;

  readonly backRoute = '/settings/actions';

  get pageTitle(): string {
    return this.isCreate ? 'Nouvelle action' : 'Modifier l’action';
  }

  get canSave(): boolean {
    return !!(this.code.trim() && this.label.trim());
  }

  ngOnInit(): void {
    const url = this.router.url;
    if (url.includes('/nouveau')) {
      this.isCreate = true;
      this.existingId = null;
      this.icon = 'bolt';
      this.active = true;
      return;
    }
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const a = this.settings.getActionById(id);
      if (!a) {
        void this.router.navigate([this.backRoute]);
        return;
      }
      this.isCreate = false;
      this.existingId = id;
      this.code = a.code;
      this.label = a.label;
      this.icon = a.icon.trim() || 'bolt';
      this.active = a.active;
    }
  }

  save(): void {
    if (!this.canSave || this.loading()) return;
    this.loading.set(true);
    setTimeout(() => {
      const action: AppAction = {
        id: this.isCreate ? this.settings.generateId() : this.existingId!,
        code: this.code.trim().toUpperCase(),
        label: this.label.trim(),
        icon: this.icon.trim() || 'bolt',
        active: this.active,
      };
      if (this.isCreate) {
        this.settings.addAction(action);
      } else {
        this.settings.updateAction(action);
      }
      this.loading.set(false);
      void this.router.navigate([this.backRoute]);
    }, 600);
  }
}
