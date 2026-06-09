import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { APP_ROUTES } from '../../../utils/app-routes';
import { PermissionService } from '../../../core/services/permission.service';

interface SettingsCard {
  title: string;
  description: string;
  icon: string;
  route: string;
  cta: string;
  gradient: string;
  linkClass: string;
}

@Component({
  selector: 'app-settings-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  templateUrl: './settings-shell.component.html',
  styleUrl: './settings-shell.component.scss',
})
export class SettingsShellComponent {
  private readonly perm = inject(PermissionService);

  private readonly allCards: SettingsCard[] = [
    {
      title: 'Actions',
      description: 'Ici, on gère les actions disponibles (créer, modifier, supprimer, exporter).',
      icon: 'task_alt',
      route: APP_ROUTES.parametragesPaths.actions,
      cta: 'Configurer les actions',
      gradient: 'bg-gradient-to-br from-amber-500 to-orange-500',
      linkClass: 'text-amber-600',
    },
    {
      title: 'Menus',
      description: 'Ici, on gère les menus et les actions de chaque menu.',
      icon: 'dashboard_customize',
      route: APP_ROUTES.parametragesPaths.menus,
      cta: 'Gérer les menus',
      gradient: 'bg-gradient-to-br from-indigo-500 to-violet-500',
      linkClass: 'text-indigo-600',
    },
    {
      title: 'Entités',
      description:
        'Entités autonomes ou sous-entités rattachées à une entité parente (directions, pôles, équipes).',
      icon: 'groups',
      route: APP_ROUTES.parametragesPaths.entites,
      cta: 'Gérer les entités',
      gradient: 'bg-gradient-to-br from-emerald-500 to-teal-500',
      linkClass: 'text-emerald-700',
    },
    {
      title: 'Spécialité',
      description: 'Ici, on gère la liste des spécialités des ressources.',
      icon: 'engineering',
      route: APP_ROUTES.parametragesPaths.specialites,
      cta: 'Gérer les spécialités',
      gradient: 'bg-gradient-to-br from-rose-500 to-pink-500',
      linkClass: 'text-rose-600',
    },
    {
      title: 'Application',
      description: 'Ici, on gère la liste des applications liées à la gestion de production.',
      icon: 'inventory_2',
      route: APP_ROUTES.parametragesPaths.applications,
      cta: 'Gérer les applications',
      gradient: 'bg-gradient-to-br from-sky-500 to-cyan-500',
      linkClass: 'text-sky-600',
    },
    {
      title: 'Jalon',
      description: 'Ici, on gère les étapes du projet.',
      icon: 'signpost',
      route: APP_ROUTES.parametragesPaths.jalons,
      cta: 'Gérer les jalons',
      gradient: 'bg-gradient-to-br from-violet-500 to-purple-600',
      linkClass: 'text-violet-600',
    },
  ];

  readonly cards = computed(() =>
    this.perm.hasParametrageHubAccess()
      ? this.allCards
      : this.allCards.filter((card) => this.perm.canAccessRoute(card.route)),
  );
}
