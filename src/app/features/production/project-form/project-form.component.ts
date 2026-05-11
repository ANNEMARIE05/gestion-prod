import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ProductionItem, ProductionType } from '../../../models/production';
import { SettingsService } from '../../../services/settings.service';
import { ButtonLoadingDirective } from '../../../shared/directives/button-loading.directive';

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    ButtonLoadingDirective,
  ],
  templateUrl: './project-form.component.html',
  styleUrl: './project-form.component.scss',
})
export class ProjectFormComponent implements OnInit {
  private readonly settingsService = inject(SettingsService);
  readonly users = this.settingsService.allUsers;
  readonly loading = signal(false);

  form: FormGroup;
  isEdit: boolean;

  get typeLabel(): string {
    switch (this.data.type) {
      case 'AUDIT':
        return 'Audit IT';
      case 'ENGINEERING':
      case 'MONITORING':
        return 'Ingénierie & veille';
      default:
        return 'projet';
    }
  }

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ProjectFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { item?: ProductionItem; type: ProductionType },
  ) {
    this.isEdit = !!data.item;
    const item = data.item;
    this.form = this.fb.group({
      libelle: [item?.libelle || '', [Validators.required]],
      description: [item?.description || ''],
      resources: [((item?.resources ?? []) as string[]).map((r) => this.resolveUserId(r))],
      resourceUser: [
        item && (data.type === 'AUDIT' || data.type === 'ENGINEERING' || data.type === 'MONITORING')
          ? this.resolveUserId(item.resources?.[0] ?? '')
          : '',
      ],
      tpm: [item?.tpm ? this.resolveUserId(item.tpm) : ''],
    });
  }

  ngOnInit(): void {
    this.applyValidatorsForType();
  }

  isAuditOrVeille(): boolean {
    return (
      this.data.type === 'AUDIT' ||
      this.data.type === 'ENGINEERING' ||
      this.data.type === 'MONITORING'
    );
  }

  private applyValidatorsForType(): void {
    const ru = this.form.get('resourceUser');
    if (this.isAuditOrVeille()) {
      ru?.setValidators([Validators.required]);
    } else {
      ru?.clearValidators();
    }
    ru?.updateValueAndValidity({ emitEvent: false });
  }

  private resolveUserId(idOrLabel: string): string {
    const users = this.settingsService.allUsers();
    if (users.some((u) => u.id === idOrLabel)) return idOrLabel;
    return users.find((u) => u.name === idOrLabel)?.id ?? idOrLabel;
  }

  onSubmit(): void {
    if (!this.form.valid || this.loading()) return;
    this.loading.set(true);
    this.dialogRef.disableClose = true;
    setTimeout(() => {
      const v = this.form.value;
      const tpmVal = (v.tpm as string)?.trim();
      const resUser = ((v.resourceUser as string) ?? '').trim();
      const payload: Partial<ProductionItem> & Pick<ProductionItem, 'libelle' | 'description' | 'type' | 'resources'> = {
        ...this.data.item,
        libelle: v.libelle,
        description: (v.description as string) ?? '',
        type: this.data.type,
        resources:
          this.data.type === 'PROJECT'
            ? ((v.resources as string[]) ?? [])
            : resUser
              ? [resUser]
              : [],
        tpm: this.data.type === 'PROJECT' ? tpmVal || undefined : undefined,
      };
      this.dialogRef.close(payload);
    }, 400);
  }

  onCancel(): void {
    if (this.loading()) return;
    this.dialogRef.close();
  }
}
