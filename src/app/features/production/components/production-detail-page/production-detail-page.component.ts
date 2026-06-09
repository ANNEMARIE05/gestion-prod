import { Component, OnInit, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ProductionService } from '../../services/production.service';
import { SettingsService } from '../../../settings/services/settings.service';
import { PermissionService } from '../../../../core/services/permission.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { ProductionItem, ProductionType } from '../../../../models/production';
import { productionListRoute, productionEditRoute } from '../../../../utils/app-routes';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-production-detail-page',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatDialogModule],
  templateUrl: './production-detail-page.component.html',
  styleUrl: './production-detail-page.component.scss'
})
export class ProductionDetailPageComponent implements OnInit {
  private readonly settingsService = inject(SettingsService);
  readonly perm = inject(PermissionService);

  item: ProductionItem | undefined;
  @Input() typeInput?: ProductionType;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productionService: ProductionService,
    private dialog: MatDialog,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }
    const type = this.typeInput ?? (this.route.snapshot.data['type'] as ProductionType) ?? 'PROJECT';


    this.item = this.productionService.findItem(type, id);

    // Accès direct par URL : le cache peut être vide tant que la liste n'a pas été chargée.
    if (!this.item) {
      this.productionService.refreshItems().subscribe(() => {
        this.item = this.productionService.findItem(type, id);
      });
    }
  }

  get backRoute(): string {
    return productionListRoute(this.item?.type ?? 'PROJECT');
  }

  get editRoute(): string {
    if (!this.item) {
      return productionListRoute('PROJECT');
    }
    return productionEditRoute(this.item.type, this.item.id);
  }

  get typeLabel(): string {
    switch (this.item?.type) {
      case 'AUDIT':
        return 'Audit IT';
      case 'ENGINEERING':
      case 'MONITORING':
        return 'Ingénierie & veille';
      default:
        return 'Projet';
    }
  }

  confirmDelete(): void {
    const item = this.item;
    if (!item) {
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer ' + this.typeLabel.toLowerCase(),
        message: `Êtes-vous sûr de vouloir supprimer "${item.libelle}" ? Cette action est irréversible.`,
        isDelete: true,
        confirmText: 'Supprimer'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.productionService.deleteItem(item.id, item.type).subscribe({
          next: () => {
            void this.router.navigate([productionListRoute(item.type)]);
          },
          error: (err) => this.errorHandler.showError(err, 'Échec de la suppression'),
        });
      }
    });
  }

  userDisplayName(idOrLegacy: string): string {
    const users = this.settingsService.allUsers();
    return users.find(u => u.id === idOrLegacy || u.name === idOrLegacy)?.name ?? idOrLegacy;
  }

  initials(label: string): string {
    const parts = label.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return label.substring(0, 2).toUpperCase();
  }
}
