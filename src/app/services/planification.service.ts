import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { PlanTask, PlanTaskInput } from '../models/plan-task';
import { AuthService } from './auth.service';
import { AuditTrailService } from './audit-trail.service';
import { LS_PLANIFICATION, readJson, writeJson } from '../utils/local-storage-json';

function mapPlanTask(task: Record<string, unknown>): PlanTask {
  return {
    ...(task as unknown as PlanTask),
    startDate: task['startDate'] ? new Date(task['startDate'] as string) : new Date(),
    expectedEndDate: task['expectedEndDate'] ? new Date(task['expectedEndDate'] as string) : new Date(),
    actualEndDate: task['actualEndDate'] ? new Date(task['actualEndDate'] as string) : null,
    commissioningDate: task['commissioningDate'] ? new Date(task['commissioningDate'] as string) : null,
    lastMaintenanceDate: task['lastMaintenanceDate'] ? new Date(task['lastMaintenanceDate'] as string) : null,
    nextMaintenanceDate: task['nextMaintenanceDate'] ? new Date(task['nextMaintenanceDate'] as string) : null,
    warrantyDeadline: task['warrantyDeadline'] ? new Date(task['warrantyDeadline'] as string) : null,
    discoveryDate: task['discoveryDate'] ? new Date(task['discoveryDate'] as string) : null,
    createdAt: task['createdAt'] ? new Date(task['createdAt'] as string) : new Date(),
  };
}

function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2, 12);
}

@Injectable({
  providedIn: 'root',
})
export class PlanificationService {
  private auth = inject(AuthService);
  private auditTrail = inject(AuditTrailService);

  private tasks = signal<PlanTask[]>([]);
  allTasks = computed(() => this.tasks());

  constructor() {
    this.reloadFromStorage();
  }

  private reloadFromStorage(): void {
    const raw = readJson<Record<string, unknown>[]>(LS_PLANIFICATION);
    if (raw?.length) {
      this.tasks.set(raw.map((row) => mapPlanTask(row)));
    }
  }

  private persist(): void {
    writeJson(LS_PLANIFICATION, this.tasks());
  }

  refreshTasks(): void {
    this.reloadFromStorage();
  }

  getTaskById(id: string): PlanTask | undefined {
    return this.tasks().find((task) => task.id === id);
  }

  addTask(input: PlanTaskInput): Observable<PlanTask> {
    const created = mapPlanTask({
      ...(input as unknown as Record<string, unknown>),
      id: newId(),
      createdAt: new Date(),
    });
    this.tasks.update((list) => [...list, created]);
    this.persist();
    this.log('CREATE', `Tâche planifiée (${input.productionTypeLabel}) : ${input.projectLabel}`);
    return of(created);
  }

  updateTask(id: string, input: PlanTaskInput): Observable<PlanTask> {
    const updated = mapPlanTask({
      ...(input as unknown as Record<string, unknown>),
      id,
      createdAt: this.getTaskById(id)?.createdAt ?? new Date(),
    });
    this.tasks.update((list) => list.map((t) => (t.id === id ? updated : t)));
    this.persist();
    this.log('UPDATE', `Tâche planifiée (${input.productionTypeLabel}) modifiée : ${input.projectLabel}`);
    return of(updated);
  }

  deleteTask(id: string): Observable<void> {
    const removed = this.tasks().find((task) => task.id === id);
    this.tasks.update((list) => list.filter((task) => task.id !== id));
    this.persist();
    if (removed) {
      this.log('DELETE', `Tâche planifiée (${removed.productionTypeLabel}) supprimée : ${removed.projectLabel}`);
    }
    return of(undefined);
  }

  private log(action: 'CREATE' | 'UPDATE' | 'DELETE', details: string): void {
    const u = this.auth.currentUser();
    this.auditTrail.logAction({
      userId: u?.id ?? '-',
      userName: u?.name ?? 'Invité',
      action,
      module: 'PLANIFICATION',
      details,
    });
  }
}
