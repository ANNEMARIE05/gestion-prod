import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ProjectListComponent } from './project-list/project-list.component';
import { ProductionType } from '../../models/production';

interface ProductionPageMeta {
  title: string;
  subtitle: string;
  icon: string;
  accent: string;
  createLabel: string;
}

const PAGE_META: Record<ProductionType, ProductionPageMeta> = {
  PROJECT: {
    title: 'Projets',
    subtitle: 'Pilotez l\u2019ex\u00e9cution de vos projets de production.',
    icon: 'folder_open',
    accent: 'from-indigo-500 to-violet-500',
    createLabel: 'Nouveau projet'
  },
  AUDIT: {
    title: 'Audits IT',
    subtitle: 'Suivez vos missions d\u2019audit informatique de bout en bout.',
    icon: 'security',
    accent: 'from-rose-500 to-orange-500',
    createLabel: 'Nouvel audit'
  },
  ENGINEERING: {
    title: 'Ing\u00e9nierie & Veille',
    subtitle: 'Centralisez les activit\u00e9s d\u2019ing\u00e9nierie et de veille technologique.',
    icon: 'engineering',
    accent: 'from-emerald-500 to-teal-500',
    createLabel: 'Nouvelle veille'
  },
  MONITORING: {
    title: 'Monitoring',
    subtitle: 'Surveillez la production en temps r\u00e9el.',
    icon: 'monitor_heart',
    accent: 'from-sky-500 to-cyan-500',
    createLabel: 'Nouveau monitoring'
  }
};

@Component({
  selector: 'app-production',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    ProjectListComponent
  ],
  templateUrl: './production.component.html',
  styleUrl: './production.component.scss'
})
export class ProductionComponent {
  type = signal<ProductionType>('PROJECT');
  meta = signal<ProductionPageMeta>(PAGE_META['PROJECT']);

  constructor(private router: Router, private route: ActivatedRoute) {
    this.route.data.subscribe(data => {
      const t = (data['type'] as ProductionType) ?? 'PROJECT';
      this.type.set(t);
      this.meta.set(PAGE_META[t]);
    });
  }

  openCreate(): void {
    this.router.navigate(['/production/new'], { queryParams: { type: this.type() } });
  }
}
