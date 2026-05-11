import { Component, input, computed, signal, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { PlanificationService } from '../../../services/planification.service';
import { PlanTask, PlanTaskStatus } from '../../../models/plan-task';
import { ProductionType } from '../../../models/production';
import { SettingsService } from '../../../services/settings.service';
import { LoadingSkeletonTableComponent } from '../../../shared/components/loading-skeleton-table/loading-skeleton-table.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { encodeTableFilter, decodeTableFilter } from '../../../utils/table-filter';

function equipmentTypeShort(t: PlanTask['equipmentType']): string | undefined {
  if (!t) return undefined;
  if (t === 'PC') return 'PC';
  if (t === 'SERVEUR') return 'Serveur';
  if (t === 'VM') return 'VM';
  return undefined;
}

function equipmentStateShort(s: PlanTask['equipmentState']): string {
  if (s === 'FONCTIONNEL') return 'Fonctionnel';
  if (s === 'DEFAILLANT') return 'Défaillant';
  if (s === 'HORS_SERVICE') return 'Hors service';
  return '-';
}

const STATUS_LABEL: Record<PlanTaskStatus, string> = {
  TODO: 'À faire',
  IN_PROGRESS: 'En cours',
  DONE: 'Terminé',
  CANCELLED: 'NOK'
};

@Component({
  selector: 'app-planification-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    LoadingSkeletonTableComponent
  ],
  templateUrl: './planification-list.component.html',
  styleUrl: './planification-list.component.scss'
})
export class PlanificationListComponent {
  /** Filtre liste / stats selon l’onglet planification (projets, audits, veille). */
  type = input<ProductionType>('PROJECT');
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private readonly defaultDisplayedColumns = ['index', 'projectLabel', 'owner', 'startDate', 'endDate', 'progress', 'status', 'createdAt', 'action'];
  private readonly engineeringDisplayedColumns = ['index', 'identification', 'watch', 'topic', 'owner', 'watchDate', 'endDate', 'status', 'action'];
  private readonly auditDisplayedColumns = [
    'index',
    'equipmentId',
    'projectLabel',
    'specialty',
    'equipmentType',
    'assignedResource',
    'commissioningDate',
    'equipmentState',
    'createdAt',
    'action',
  ];
  dataSource = new MatTableDataSource<PlanTask>([]);
  isLoading = true;

  readonly filterSearch = signal('');
  readonly filterProjectId = signal('');
  readonly filterSpecialtyId = signal('');
  readonly filterStatus = signal('');
  /** Audits : état de l’équipement (distinct de statut de tâche). */
  readonly filterEquipmentState = signal('');
  /** Veille : thématique. */
  readonly filterTopic = signal('');

  readonly statusFilterOptions = computed(() => {
    if (this.type() === 'PROJECT' || this.type() === 'MONITORING') {
      return [
        { value: 'TODO' as PlanTaskStatus, label: 'NOK' },
        { value: 'IN_PROGRESS' as PlanTaskStatus, label: 'En cours' },
        { value: 'DONE' as PlanTaskStatus, label: 'Terminé' },
      ];
    }
    return (Object.entries(STATUS_LABEL) as [PlanTaskStatus, string][])
      .map(([value, label]) => ({ value, label }));
  });

  readonly auditStateFilterOptions = [
    { value: 'FONCTIONNEL', label: 'Fonctionnel' },
    { value: 'DEFAILLANT', label: 'Défaillant' },
    { value: 'HORS_SERVICE', label: 'Hors service' },
  ] as const;

  readonly topicFilterOptions = [
    { value: 'IA', label: 'IA' },
    { value: 'CYBERSECURITE', label: 'Cybersécurité' },
    { value: 'CLOUD', label: 'Cloud' },
    { value: 'DATA', label: 'Data' },
    { value: 'DEVOPS', label: 'DevOps' },
    { value: 'AUTRE', label: 'Autre' },
  ] as const;

  filteredTasks = computed(() =>
    this.planService.allTasks().filter(t => t.type === this.type())
  );

  /** Libellé du 1er filtre (parent production). */
  readonly parentFilterLabel = computed(() => {
    switch (this.type()) {
      case 'AUDIT':
        return 'Audit';
      case 'ENGINEERING':
        return 'Veille';
      case 'MONITORING':
        return 'Mission';
      default:
        return 'Projet';
    }
  });

  /** Options « projet / audit / veille / mission » déduites des tâches affichées. */
  readonly parentTaskOptions = computed(() => {
    const map = new Map<string, string>();
    for (const t of this.filteredTasks()) {
      map.set(t.projectId, t.projectLabel);
    }
    return [...map.entries()].map(([id, label]) => ({ id, label }));
  });

  readonly specialtySelectOptions = computed(() =>
    this.settingsService.allSpecialties().map((s) => ({ id: s.id, label: s.label })),
  );

  statusLabel = (s: PlanTaskStatus) => {
    const t = this.type();
    if (t === 'PROJECT' || t === 'MONITORING') {
      if (s === 'TODO' || s === 'CANCELLED') return 'NOK';
      if (s === 'IN_PROGRESS') return 'En cours';
      if (s === 'DONE') return 'Terminé';
    }
    return STATUS_LABEL[s];
  };

  get displayedColumns(): string[] {
    if (this.type() === 'AUDIT') {
      return this.auditDisplayedColumns;
    }
    if (this.type() === 'ENGINEERING') {
      return this.engineeringDisplayedColumns;
    }
    return this.defaultDisplayedColumns;
  }

  mainColumnLabel(): string {
    switch (this.type()) {
      case 'AUDIT':
        return 'Audit';
      case 'ENGINEERING':
        return 'Veille';
      case 'MONITORING':
        return 'Monitoring';
      default:
        return 'Projet';
    }
  }

  /** Message sous le tableau lorsque la liste filtrée est vide. */
  tableEmptyMessage(): string {
    if (this.filteredTasks().length === 0) {
      return this.noPlanificationDataMessage();
    }
    return 'Aucun résultat.';
  }

  private noPlanificationDataMessage(): string {
    switch (this.type()) {
      case 'AUDIT':
        return "Aucune planification d'audit.";
      case 'ENGINEERING':
        return 'Aucune planification veille.';
      case 'MONITORING':
        return 'Aucune planification monitoring.';
      default:
        return 'Aucune planification projet.';
    }
  }

  taskSecondaryInfo(task: PlanTask): string {
    if (task.type === 'AUDIT') {
      return '';
    }
    if (task.type === 'ENGINEERING') {
      const details = [task.identification, task.watchLabel, task.specialtyLabel].filter(Boolean);
      return details.length ? details.join(' - ') : '';
    }
    if (task.type === 'PROJECT') {
      return '';
    }
    return task.jalonLabel ?? task.productionTypeLabel;
  }

  topicLabel(topic: PlanTask['topic']): string {
    switch (topic) {
      case 'IA':
        return 'IA';
      case 'CYBERSECURITE':
        return 'Cybersécurité';
      case 'CLOUD':
        return 'Cloud';
      case 'DATA':
        return 'Data';
      case 'DEVOPS':
        return 'DevOps';
      case 'AUTRE':
        return 'Autre';
      default:
        return '-';
    }
  }

  constructor(
    private planService: PlanificationService,
    private router: Router,
    private settingsService: SettingsService,
    private dialog: MatDialog,
  ) {
    this.dataSource.filterPredicate = (task: PlanTask, raw: string) => {
      const f = decodeTableFilter(raw);
      if (f.projectId && task.projectId !== f.projectId) {
        return false;
      }
      if (f.specialty && task.specialtyId !== f.specialty) {
        return false;
      }
      if (f.status) {
        const projectLike = task.type === 'PROJECT' || task.type === 'MONITORING';
        if (projectLike && f.status === 'TODO') {
          if (task.status !== 'TODO' && task.status !== 'CANCELLED') {
            return false;
          }
        } else if (task.status !== f.status) {
          return false;
        }
      }
      if (f.extra) {
        if (task.type === 'AUDIT' && task.equipmentState !== f.extra) {
          return false;
        }
        if (task.type === 'ENGINEERING' && task.topic !== f.extra) {
          return false;
        }
      }
      const q = (f.q ?? '').trim().toLowerCase();
      if (!q) {
        return true;
      }
      return this.taskMatchesSearch(task, q);
    };

    effect(() => {
      this.type();
      this.filterProjectId.set('');
      this.filterSpecialtyId.set('');
      this.filterStatus.set('');
      this.filterEquipmentState.set('');
      this.filterTopic.set('');
      this.syncTableFilter();
    });

    effect(() => {
      const rows = this.filteredTasks();
      this.dataSource.data = rows;
      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
      }
      this.syncTableFilter();
    });

    window.setTimeout(() => {
      this.isLoading = false;
    }, 500);
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  applyFilter(event: Event): void {
    this.filterSearch.set((event.target as HTMLInputElement).value);
    this.syncTableFilter();
  }

  syncTableFilter(): void {
    const t = this.type();
    const base = {
      q: this.filterSearch(),
      projectId: this.filterProjectId() || undefined,
      specialty: this.filterSpecialtyId() || undefined,
    };
    if (t === 'PROJECT' || t === 'MONITORING') {
      this.dataSource.filter = encodeTableFilter({
        ...base,
        status: this.filterStatus() || undefined,
      });
      return;
    }
    if (t === 'AUDIT') {
      this.dataSource.filter = encodeTableFilter({
        ...base,
        extra: this.filterEquipmentState() || undefined,
      });
      return;
    }
    if (t === 'ENGINEERING') {
      this.dataSource.filter = encodeTableFilter({
        ...base,
        status: this.filterStatus() || undefined,
        extra: this.filterTopic() || undefined,
      });
      return;
    }
    this.dataSource.filter = encodeTableFilter(base);
  }

  parentFilterTrigger(): { primary: string } | null {
    const id = this.filterProjectId();
    if (!id) {
      return null;
    }
    const row = this.filteredTasks().find((x) => x.projectId === id);
    return row ? { primary: row.projectLabel } : null;
  }

  specialtyFilterTrigger(): { primary: string } | null {
    const id = this.filterSpecialtyId();
    if (!id) {
      return null;
    }
    return { primary: this.settingsService.getSpecialtyLabel(id) };
  }

  statusFilterTrigger(): { primary: string } | null {
    const v = this.filterStatus();
    if (!v) {
      return null;
    }
    const o = this.statusFilterOptions().find((x) => x.value === v);
    return o ? { primary: o.label } : null;
  }

  equipmentStateFilterTrigger(): { primary: string } | null {
    const v = this.filterEquipmentState();
    if (!v) {
      return null;
    }
    const o = this.auditStateFilterOptions.find((x) => x.value === v);
    return o ? { primary: o.label } : null;
  }

  topicFilterTrigger(): { primary: string } | null {
    const v = this.filterTopic();
    if (!v) {
      return null;
    }
    const o = this.topicFilterOptions.find((x) => x.value === v);
    return o ? { primary: o.label } : null;
  }

  rowNumber(indexOnPage: number): number {
    const p = this.paginator;
    if (!p) {
      return indexOnPage + 1;
    }
    return p.pageIndex * p.pageSize + indexOnPage + 1;
  }

  private taskMatchesSearch(task: PlanTask, q: string): boolean {
    const parts = [
      task.projectLabel,
      task.identification,
      task.watchLabel,
      task.specialtyLabel,
      task.equipmentId,
      task.jalonLabel,
      task.entityLabel,
      task.productionTypeLabel,
      task.applicationLabel,
      this.ownerLabel(task.ownerId),
      this.resourceAffectedCell(task),
      this.equipmentStateCell(task),
      this.equipmentTypeCell(task),
      this.topicLabel(task.topic),
      this.statusLabel(task.status),
      String(task.progress),
    ];
    const haystack = parts.filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(q);
  }

  editTask(task: PlanTask): void {
    void this.router.navigate(['/planification/edit', task.id]);
  }

  viewDetails(task: PlanTask): void {
    if (task.type === 'AUDIT') {
      void this.router.navigate(['/planification/audits/detail', task.id]);
      return;
    }
    if (task.type === 'ENGINEERING') {
      void this.router.navigate(['/planification/veille/detail', task.id]);
      return;
    }
    void this.router.navigate(['/planification/detail', task.id]);
  }

  deleteTask(task: PlanTask): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer la planification',
        message: `Supprimer « ${task.projectLabel} » ? Cette action est irréversible.`,
        isDelete: true,
        confirmText: 'Supprimer',
      },
    });
    dialogRef.afterClosed().subscribe((ok: boolean) => {
      if (ok) {
        this.planService.deleteTask(task.id).subscribe();
      }
    });
  }

  ownerLabel(ownerId: string): string {
    const u = this.settingsService.usersForSelect().find((user) => user.id === ownerId);
    return u?.name?.trim() || [u?.firstName, u?.lastName].filter(Boolean).join(' ').trim() || u?.email || ownerId;
  }

  resourceAffectedCell(task: PlanTask): string {
    if (task.assignedResourceId) {
      return this.ownerLabel(task.assignedResourceId);
    }
    return task.assignedTo?.trim() ? task.assignedTo : '-';
  }

  equipmentStateCell(task: PlanTask): string {
    return equipmentStateShort(task.equipmentState);
  }

  equipmentTypeCell(task: PlanTask): string {
    return equipmentTypeShort(task.equipmentType) ?? '-';
  }
}
