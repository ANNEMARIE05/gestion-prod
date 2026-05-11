import { Component, OnInit, inject, signal } from '@angular/core';

import { CommonModule } from '@angular/common';

import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';

import { MatInputModule } from '@angular/material/input';

import { MatSelectModule } from '@angular/material/select';

import { MatButtonModule } from '@angular/material/button';

import { MatIconModule } from '@angular/material/icon';

import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { ProductionService } from '../../../services/production.service';

import { SettingsService } from '../../../services/settings.service';

import { ProductionType, ProductionItem } from '../../../models/production';

import { ButtonLoadingDirective } from '../../../shared/directives/button-loading.directive';



@Component({

  selector: 'app-production-form-page',

  standalone: true,

  imports: [

    CommonModule,

    ReactiveFormsModule,

    RouterModule,

    MatFormFieldModule,

    MatInputModule,

    MatSelectModule,

    MatButtonModule,

    MatIconModule,

    MatSnackBarModule,

    ButtonLoadingDirective,

  ],

  templateUrl: './production-form-page.component.html',

  styleUrl: './production-form-page.component.scss'

})

export class ProductionFormPageComponent implements OnInit {

  private readonly settingsService = inject(SettingsService);

  readonly users = this.settingsService.allUsers;

  readonly loading = signal(false);



  form: FormGroup;

  isEdit = false;

  itemId: string | null = null;

  type: ProductionType = 'PROJECT';



  get backRoute(): string {

    return this.routeForType(this.type);

  }



  /** Titre du formulaire (Nouveau / Modifier + libellé du type) */

  get pageTitle(): string {

    const kind = this.typeLabel.toLowerCase();

    return this.isEdit ? `Modifier ${kind}` : `Nouveau ${kind}`;

  }



  get typeLabel(): string {

    switch (this.type) {

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

    private route: ActivatedRoute,

    private router: Router,

    private productionService: ProductionService,

    private snackBar: MatSnackBar

  ) {

    this.form = this.fb.group({

      libelle: ['', [Validators.required]],

      description: [''],

      resources: [[] as string[]],

      /** Utilisateur ressource (audit IT, ingénierie & veille) */
      resourceUser: [''],

      tpm: ['']

    });

  }



  private isAuditOrVeilleType(t: ProductionType): boolean {

    return t === 'AUDIT' || t === 'ENGINEERING' || t === 'MONITORING';

  }



  private applyValidatorsForType(): void {

    const ru = this.form.get('resourceUser');

    if (this.isAuditOrVeilleType(this.type)) {

      ru?.setValidators([Validators.required]);

    } else {

      ru?.clearValidators();

    }

    ru?.updateValueAndValidity({ emitEvent: false });

  }



  ngOnInit(): void {

    this.itemId = this.route.snapshot.paramMap.get('id');

    const typeParam = this.route.snapshot.queryParamMap.get('type');

    if (typeParam && !this.itemId) this.type = typeParam as ProductionType;



    if (this.itemId) {

      this.isEdit = true;

      const items = this.productionService.allProductionItems();

      const item = items.find(i => i.id === this.itemId);

      if (item) {

        this.type = item.type;

        this.form.patchValue({

          libelle: item.libelle,

          description: item.description ?? '',

          resources:

            item.type === 'PROJECT'

              ? (item.resources ?? []).map(r => this.resolveUserId(r))

              : [],

          resourceUser: this.isAuditOrVeilleType(item.type)

            ? this.resolveUserId(item.resources?.[0] ?? '')

            : '',

          tpm: item.tpm ? this.resolveUserId(item.tpm) : ''

        });

      }

    }



    this.applyValidatorsForType();

  }



  onSubmit(): void {

    if (!this.form.valid || this.loading()) return;

    this.loading.set(true);

    setTimeout(() => {

      const raw = this.form.value;

      const tpmVal = (raw.tpm as string)?.trim();



      if (this.isEdit && this.itemId) {

        const existing = this.productionService.allProductionItems().find(i => i.id === this.itemId);

        if (!existing) {

          this.loading.set(false);

          return;

        }



        const resUser = ((raw.resourceUser as string) ?? '').trim();

        const merged: ProductionItem = {

          ...existing,

          libelle: raw.libelle,

          description: (raw.description as string) ?? '',

          resources:

            this.type === 'PROJECT'

              ? ((raw.resources as string[]) ?? [])

              : resUser

                ? [resUser]

                : [],

          tpm: this.type === 'PROJECT' ? tpmVal || undefined : undefined

        };

        this.productionService.updateItem(merged).subscribe(() => {
          this.snackBar.open('Modifié avec succès', 'Fermer', { duration: 3000 });
          this.loading.set(false);
          this.router.navigate([this.routeForType(this.type)]);
        });
      } else {
        const resUser = ((raw.resourceUser as string) ?? '').trim();
        const data: Omit<ProductionItem, 'id'> = {
          libelle: raw.libelle,
          description: (raw.description as string) ?? '',
          type: this.type,
          resources:
            this.type === 'PROJECT'
              ? ((raw.resources as string[]) ?? [])
              : resUser
                ? [resUser]
                : [],
          tpm: this.type === 'PROJECT' ? tpmVal || undefined : undefined,
          createdAt: new Date(),
        };
        this.productionService.addItem(data).subscribe(() => {
          this.snackBar.open('Créé avec succès', 'Fermer', { duration: 3000 });
          this.loading.set(false);
          this.router.navigate([this.routeForType(this.type)]);
        });
      }
    }, 600);

  }



  private resolveUserId(idOrLabel: string): string {

    const users = this.settingsService.allUsers();

    if (users.some(u => u.id === idOrLabel)) return idOrLabel;

    const byName = users.find(u => u.name === idOrLabel);

    return byName?.id ?? idOrLabel;

  }



  private routeForType(type: ProductionType): string {

    switch (type) {

      case 'AUDIT':

        return '/production/audits';

      case 'ENGINEERING':

      case 'MONITORING':

        return '/production/veille';

      default:

        return '/production/projets';

    }

  }

}

