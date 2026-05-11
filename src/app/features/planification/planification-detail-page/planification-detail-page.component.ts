import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PlanificationService } from '../../../services/planification.service';
import { PlanTask } from '../../../models/plan-task';
import { SettingsService } from '../../../services/settings.service';

@Component({
  selector: 'app-planification-detail-page',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule],
  templateUrl: './planification-detail-page.component.html',
})
export class PlanificationDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly planificationService = inject(PlanificationService);
  private readonly settingsService = inject(SettingsService);

  task: PlanTask | null = null;

  get backRoute(): string {
    const type = this.task?.type ?? 'PROJECT';
    if (type === 'AUDIT') {
      return '/planification/audits';
    }
    if (type === 'ENGINEERING') {
      return '/planification/veille';
    }
    if (type === 'MONITORING') {
      return '/planification/monitoring';
    }
    return '/planification/projets';
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }
    this.task = this.planificationService.getTaskById(id) ?? null;
  }

  ownerLabel(ownerId: string): string {
    const u = this.settingsService.usersForSelect().find((user) => user.id === ownerId);
    return u?.name?.trim() || [u?.firstName, u?.lastName].filter(Boolean).join(' ').trim() || u?.email || ownerId;
  }

  /** Ressource affectée (id) ou libellé libre hérité */
  resourceAffectedLabel(task: PlanTask): string {
    if (task.assignedResourceId) {
      return this.ownerLabel(task.assignedResourceId);
    }
    return task.assignedTo?.trim() ? task.assignedTo : '-';
  }

  typeLabel(type: PlanTask['type']): string {
    switch (type) {
      case 'AUDIT':
        return 'Audit IT';
      case 'ENGINEERING':
        return 'Veille / Ingenierie';
      case 'MONITORING':
        return 'Monitoring';
      default:
        return 'Projet';
    }
  }

  statusLabel(status: PlanTask['status']): string {
    const t = this.task?.type;
    if (t === 'PROJECT' || t === 'MONITORING') {
      if (status === 'TODO' || status === 'CANCELLED') return 'NOK';
      if (status === 'IN_PROGRESS') return 'En cours';
      if (status === 'DONE') return 'Terminé';
      return '-';
    }
    switch (status) {
      case 'TODO':
        return 'À faire';
      case 'IN_PROGRESS':
        return 'En cours';
      case 'DONE':
        return 'Terminé';
      case 'CANCELLED':
        return 'Annulé';
      default:
        return '-';
    }
  }

  equipmentTypeLabel(type: PlanTask['equipmentType']): string {
    switch (type) {
      case 'SERVEUR':
        return 'Serveur';
      case 'VM':
        return 'VM';
      case 'PC':
        return 'PC';
      default:
        return '-';
    }
  }

  locationTypeLabel(type: PlanTask['locationType']): string {
    switch (type) {
      case 'CLOUD':
        return 'Cloud';
      case 'SITE':
        return 'Site';
      case 'BUREAU':
        return 'Bureau';
      default:
        return '-';
    }
  }

  equipmentStateLabel(state: PlanTask['equipmentState']): string {
    switch (state) {
      case 'FONCTIONNEL':
        return 'Fonctionnel';
      case 'DEFAILLANT':
        return 'Defaillant';
      case 'HORS_SERVICE':
        return 'Hors service';
      default:
        return '-';
    }
  }

  licenseStatusLabel(status: PlanTask['licenseStatus']): string {
    switch (status) {
      case 'OUI':
        return 'Oui';
      case 'NON':
        return 'Non';
      case 'A_RENOUVELER':
        return 'A renouveler';
      default:
        return '-';
    }
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

  sourceLabel(source: PlanTask['source']): string {
    switch (source) {
      case 'CONFERENCE':
        return 'Conférence';
      case 'ARTICLE':
        return 'Article';
      case 'PROJET_INTERNE':
        return 'Projet interne';
      case 'FORMATION':
        return 'Formation';
      case 'AUTRE':
        return 'Autre';
      default:
        return '-';
    }
  }

  maturityLevelLabel(level: PlanTask['maturityLevel']): string {
    switch (level) {
      case 'VEILLE':
        return 'Veille';
      case 'ETUDE':
        return 'Étude';
      case 'POC':
        return 'PoC';
      case 'DEVELOPPEMENT':
        return 'Développement';
      default:
        return '-';
    }
  }

  potentialImpactLabel(impact: PlanTask['potentialImpact']): string {
    switch (impact) {
      case 'ELEVE':
        return 'Élevé';
      case 'MOYEN':
        return 'Moyen';
      case 'FAIBLE':
        return 'Faible';
      default:
        return '-';
    }
  }
}
