import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ProductionService } from '../production/services/production.service';
import { PlanificationService } from '../planification/services/planification.service';
import { StatistiquesService, StatistiquesResponse } from '../settings/services/statistiques.service';
import { ProductionItem, ProductionType } from '../../models/production';

function countByType(items: ProductionItem[], type: ProductionType): number {
  return items.filter((i) => i.type === type).length;
}

function collectUniqueResourceIds(items: ProductionItem[]): number {
  const ids = new Set<string>();
  for (const item of items) {
    if (item.tpm?.trim()) ids.add(item.tpm.trim());
    for (const r of item.resources ?? []) {
      if (r?.trim()) ids.add(r.trim());
    }
  }
  return ids.size;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private production = inject(ProductionService);
  private planification = inject(PlanificationService);
  private statistiquesApi = inject(StatistiquesService);

  private apiStats = signal<StatistiquesResponse | null>(null);

  stats = computed(() => {
    const api = this.apiStats();
    if (api) {
      return {
        total:
          (api.total_projets ?? 0) +
          (api.total_audits_informatiques ?? 0) +
          (api.total_veille_ingenierie ?? 0),
        projects: api.total_projets ?? 0,
        audits: api.total_audits_informatiques ?? 0,
        engineering: api.total_veille_ingenierie ?? 0,
        uniqueResources: api.total_ressources ?? 0,
      };
    }

    const items = this.production.allProductionItems();
    return {
      total: items.length,
      projects: countByType(items, 'PROJECT'),
      audits: countByType(items, 'AUDIT'),
      engineering: countByType(items, 'ENGINEERING'),
      uniqueResources: collectUniqueResourceIds(items),
    };
  });

  planBuckets = computed(() => {
    const tasks = this.planification.allTasks().filter((t) => t.type === 'PROJECT');
    let todo = 0,
      inProgress = 0,
      done = 0,
      cancelled = 0;
    for (const t of tasks) {
      switch (t.status) {
        case 'TODO':
          todo++;
          break;
        case 'IN_PROGRESS':
          inProgress++;
          break;
        case 'DONE':
          done++;
          break;
        case 'CANCELLED':
          cancelled++;
          break;
      }
    }
    return {
      nok: todo + cancelled,
      enCours: inProgress,
      termines: done,
    };
  });

  ngOnInit(): void {
    this.statistiquesApi.getStatistiques().subscribe({
      next: (resp) => {
        if (resp.body) {
          this.apiStats.set(resp.body);
        }
      },
      error: () => {
        this.apiStats.set(null);
      },
    });
  }
}
