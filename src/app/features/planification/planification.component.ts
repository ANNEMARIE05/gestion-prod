import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PlanificationListComponent } from './planification-list/planification-list.component';
import { ProductionType } from '../../models/production';

interface PlanPageMeta {
  title: string;
  subtitle: string;
  icon: string;
  accent: string;
  createLabel: string;
}

const PAGE_META: Record<ProductionType, PlanPageMeta> = {
  PROJECT: {
    title: 'Planning Projets',
    subtitle: 'Organisez le calendrier prévisionnel de vos projets.',
    icon: 'folder_shared',
    accent: 'from-indigo-500 to-violet-500',
    createLabel: 'Planifier un projet'
  },
  AUDIT: {
    title: 'Planning Audits',
    subtitle: 'Préparez et suivez les missions d’audit IT.',
    icon: 'fact_check',
    accent: 'from-rose-500 to-orange-500',
    createLabel: 'Planifier un audit'
  },
  ENGINEERING: {
    title: 'Planning Veille',
    subtitle: 'Cadencez vos activités d’ingénierie et de veille technologique.',
    icon: 'analytics',
    accent: 'from-emerald-500 to-teal-500',
    createLabel: 'Planifier une veille'
  },
  MONITORING: {
    title: 'Planning Monitoring',
    subtitle: 'Programmez les routines de monitoring de production.',
    icon: 'monitor_heart',
    accent: 'from-sky-500 to-cyan-500',
    createLabel: 'Planifier un monitoring'
  }
};

@Component({
  selector: 'app-planification',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, PlanificationListComponent, RouterLink],
  templateUrl: './planification.component.html',
  styleUrl: './planification.component.scss'
})
export class PlanificationComponent {
  type = signal<ProductionType>('PROJECT');
  meta = signal<PlanPageMeta>(PAGE_META['PROJECT']);
  createRoute = signal('/planification/projets/new');

  constructor(private route: ActivatedRoute) {
    this.route.data.subscribe(data => {
      const t = (data['type'] as ProductionType) ?? 'PROJECT';
      this.type.set(t);
      this.meta.set(PAGE_META[t]);
      if (t === 'AUDIT') {
        this.createRoute.set('/planification/audits/new');
      } else if (t === 'ENGINEERING') {
        this.createRoute.set('/planification/veille/new');
      } else if (t === 'MONITORING') {
        this.createRoute.set('/planification/monitoring/new');
      } else {
        this.createRoute.set('/planification/projets/new');
      }
    });
  }
}
