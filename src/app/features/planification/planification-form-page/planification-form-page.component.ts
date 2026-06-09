import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProductionType } from '../../../models/production';
import { PlanificationService } from '../../../services/planification.service';
import { PlanTask, PlanTaskInput } from '../../../models/plan-task';
import { planificationListRoute } from '../../../utils/app-routes';
import { PlanificationFormComponent } from '../planification-form/planification-form.component';

@Component({
  selector: 'app-planification-form-page',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatSnackBarModule, PlanificationFormComponent],
  templateUrl: './planification-form-page.component.html',
})
export class PlanificationFormPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly planificationService = inject(PlanificationService);
  private readonly snackBar = inject(MatSnackBar);

  isEdit = false;
  taskId: string | null = null;
  taskType: ProductionType = 'PROJECT';
  initialTask: PlanTask | null = null;
  readonly loading = signal(false);

  get pageTitle(): string {
    if (this.isEdit) {
      return 'Modifier la planification';
    }
    if (this.taskType === 'AUDIT') {
      return 'Planifier un audit informatique';
    }
    if (this.taskType === 'ENGINEERING') {
      return 'Planifier une ingénierie / veille';
    }
    return 'Nouvelle planification';
  }

  get pageSubtitle(): string {
    if (this.taskType === 'AUDIT') {
      return 'Fiche equipement : audit de production, specialite, jalons, maintenance, garantie et remarques.';
    }
    if (this.taskType === 'ENGINEERING') {
      return 'Creation de la planification avec identification, thematique, source, jalon et action de veille.';
    }
    if (this.taskType === 'MONITORING') {
      return 'Meme filiere que la planification projet : jalons et suivi, sans choix d application.';
    }
    return 'Gestion detaillee des jalons, applications et suivi.';
  }

  ngOnInit(): void {
    this.taskId = this.route.snapshot.paramMap.get('id');
    if (this.taskId) {
      this.isEdit = true;
      this.initialTask = this.planificationService.getTaskById(this.taskId) ?? null;
      this.taskType = this.initialTask?.type ?? 'PROJECT';
      return;
    }
    this.taskType =
      (this.route.snapshot.data['type'] as ProductionType) ??
      (this.route.snapshot.queryParamMap.get('type') as ProductionType) ??
      'PROJECT';
  }

  onSave(task: PlanTaskInput): void {
    if (this.loading()) return;
    this.loading.set(true);
    if (this.isEdit && this.taskId) {
      this.planificationService.updateTask(this.taskId, task).subscribe(() => {
        this.snackBar.open('Planification modifiee avec succes.', 'Fermer', { duration: 2500 });
        this.loading.set(false);
        void this.router.navigate([this.routeForType(task.type)]);
      });
    } else {
      this.planificationService.addTask(task).subscribe(() => {
        this.snackBar.open('Planification creee avec succes.', 'Fermer', { duration: 2500 });
        this.loading.set(false);
        void this.router.navigate([this.routeForType(task.type)]);
      });
    }
  }

  onCancel(): void {
    if (this.loading()) return;
    void this.router.navigate([this.routeForType(this.taskType)]);
  }

  private routeForType(type: ProductionType): string {
    return planificationListRoute(type);
  }
}
