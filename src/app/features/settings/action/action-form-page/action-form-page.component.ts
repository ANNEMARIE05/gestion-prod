import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AppAction } from '../../../../models/authorization';
import { SettingsService } from '../../services/settings.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { ButtonLoadingDirective } from '../../../../shared/directives/button-loading.directive';

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
    MatSnackBarModule,
    ButtonLoadingDirective,
  ],
  templateUrl: './action-form-page.component.html',
})
export class ActionFormPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly errorHandler = inject(ErrorHandlerService);
  readonly settings = inject(SettingsService);

  isCreate = true;
  existingId: string | null = null;
  readonly loading = signal(false);

  code = '';
  label = '';
  icon = 'bolt';
  active = true;

  readonly backRoute = '/parametrages/actions';

  get pageTitle(): string {
    return this.isCreate ? 'Nouvelle action' : 'Modifier l’action';
  }

  get canSave(): boolean {
    return !!(this.code.trim() && this.label.trim());
  }

  ngOnInit(): void {
    const url = this.router.url;
    if (url.includes('/create') || url.includes('/nouveau')) {
      this.isCreate = true;
      this.existingId = null;
      this.code = this.settings.generatePrefixedCode('ACT', this.settings.allActions());
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
    const actionId = this.code.trim().toUpperCase();
    const action: AppAction = {
      id: this.isCreate ? '' : this.existingId!,
      actionId,
      code: actionId,
      label: this.label.trim(),
      icon: this.icon.trim() || 'bolt',
      active: this.active,
    };
    this.settings.persistAction(action, this.isCreate).subscribe({
      next: () => {
        this.loading.set(false);
        this.snackBar.open(
          this.isCreate ? 'Action créée avec succès' : 'Action modifiée avec succès',
          'Fermer',
          { duration: 3000 },
        );
        void this.router.navigate([this.backRoute]);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.snackBar.open(this.errorHandler.getErrorMessage(err), 'Fermer', { duration: 5000 });
      },
    });
  }
}
