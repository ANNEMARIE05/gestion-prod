import { Component, Input, inject, signal, ViewChild, effect, OnChanges, SimpleChanges, OnInit, AfterViewInit } from '@angular/core';
import { PermissionService } from '../../../../core/services/permission.service';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { Router, RouterModule } from '@angular/router';
import { ProductionType, ProductionItem } from '../../../../models/production';
import {
  productionListRoute,
  productionCreateRoute,
  productionDetailRoute,
  productionEditRoute,
} from '../../../../utils/app-routes';
import { ProductionService } from '../../services/production.service';
import { SettingsService } from '../../../settings/services/settings.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSkeletonTableComponent } from '../../../../shared/components/loading-skeleton-table/loading-skeleton-table.component';
import { encodeTableFilter, decodeTableFilter } from '../../../../utils/table-filter';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    MatPaginatorModule,
    LoadingSkeletonTableComponent
  ],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.scss'
})
export class ProjectListComponent implements OnChanges, OnInit, AfterViewInit {
  readonly perm = inject(PermissionService);

  @Input() type: ProductionType = 'PROJECT';
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  /** Colonnes dynamiques : TPM affiché uniquement pour les projets */
  displayedColumns: string[] = [];

  private readonly typeFilter = signal<ProductionType>('PROJECT');

  readonly searchQuery = signal('');

  dataSource = new MatTableDataSource<ProductionItem>([]);
  isLoading = true;

  constructor(
    private productionService: ProductionService,
    private settingsService: SettingsService,
    private dialog: MatDialog,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {
    this.dataSource.filterPredicate = (item: ProductionItem, raw: string) => {
      const f = decodeTableFilter(raw);
      const q = (f.q ?? '').trim().toLowerCase();
      if (!q) {
        return true;
      }
      const tpmName = item.tpm ? this.resourceDisplayName(item.tpm) : '';
      const resNames = item.resources.map((r) => this.resourceDisplayName(r)).join(' ');
      const haystack = [item.libelle, item.description, tpmName, resNames].join(' ').toLowerCase();
      return haystack.includes(q);
    };

    effect(() => {
      const allItems = this.productionService.allProductionItems();
      const t = this.typeFilter();
      const filtered = allItems.filter(item => item.type === t);
      this.dataSource.data = filtered;
      this.displayedColumns = this.buildColumns(t);
      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
      }
      this.syncTableFilter();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['type']) {
      this.typeFilter.set(this.type);
      this.syncTableFilter();
    }
  }

  ngOnInit(): void {
    this.typeFilter.set(this.type);
    this.productionService.refreshItems().subscribe({
      next: () => {
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  applyFilter(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
    this.syncTableFilter();
  }

  syncTableFilter(): void {
    this.dataSource.filter = encodeTableFilter({
      q: this.searchQuery(),
    });
  }

  openDetail(item: ProductionItem): void {
    void this.router.navigate([productionDetailRoute(item.type, item.id)]);
  }

  openEdit(item: ProductionItem): void {
    void this.router.navigate([productionEditRoute(item.type, item.id)]);
  }

  confirmDelete(item: ProductionItem): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer ' + this.type.toLowerCase(),
        message: `Êtes-vous sûr de vouloir supprimer "${item.libelle}" ? Cette action est irréversible.`,
        isDelete: true,
        confirmText: 'Supprimer'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.productionService.deleteItem(item.id, item.type).subscribe({
          error: (err) => this.errorHandler.showError(err, 'Échec de la suppression'),
        });
      }
    });
  }

  /** Libellé affiché pour une ressource (id utilisateur ou ancienne valeur texte) */
  resourceDisplayName(idOrLegacy: string): string {
    const match = this.settingsService.allUsers().find(u => u.id === idOrLegacy || u.name === idOrLegacy);
    return match?.name ?? idOrLegacy;
  }

  initialsFromName(label: string): string {
    const parts = label.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return label.substring(0, 2).toUpperCase();
  }

  private buildColumns(t: ProductionType): string[] {
    const mid = t === 'PROJECT' ? ['tpm', 'resources'] : ['resources'];
    return ['numero', 'libelle', ...mid, 'createdAt', 'actions'];
  }

  /** En-tête de colonne : au singulier pour audit / veille (une ressource utilisateur) */
  resourcesColumnHeader(): string {
    return this.type === 'PROJECT' ? 'Ressources' : 'Ressource';
  }

  /** Numéro de ligne continu sur les pages (pagination) */
  rowNumber(indexOnPage: number): number {
    const p = this.paginator;
    if (!p) {
      return indexOnPage + 1;
    }
    return p.pageIndex * p.pageSize + indexOnPage + 1;
  }

  creationDate(item: ProductionItem): Date | null {
    return item.createdAt ?? null;
  }
}
