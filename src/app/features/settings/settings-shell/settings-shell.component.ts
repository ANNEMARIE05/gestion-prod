import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

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
  readonly cards: SettingsCard[] = [
    {
      title: 'Actions',
      description: 'Ici, on gère les actions disponibles (créer, modifier, supprimer, exporter).',
      icon: 'task_alt',
      route: '/settings/actions',
      cta: 'Configurer les actions',
      gradient: 'bg-gradient-to-br from-amber-500 to-orange-500',
      linkClass: 'text-amber-600',
    },
    {
      title: 'Menus',
      description: 'Ici, on gère les menus et les actions de chaque menu.',
      icon: 'dashboard_customize',
      route: '/settings/menus',
      cta: 'Gérer les menus',
      gradient: 'bg-gradient-to-br from-indigo-500 to-violet-500',
      linkClass: 'text-indigo-600',
    },
    {
      title: 'Entités',
      description:
        'Entités autonomes ou sous-entités rattachées à une entité parente (directions, pôles, équipes).',
      icon: 'groups',
      route: '/settings/entites',
      cta: 'Gérer les entités',
      gradient: 'bg-gradient-to-br from-emerald-500 to-teal-500',
      linkClass: 'text-emerald-700',
    },
    {
      title: 'Spécialité',
      description: 'Ici, on gère la liste des spécialités des ressources.',
      icon: 'engineering',
      route: '/settings/specialites',
      cta: 'Gérer les spécialités',
      gradient: 'bg-gradient-to-br from-rose-500 to-pink-500',
      linkClass: 'text-rose-600',
    },
    {
      title: 'Application',
      description: 'Ici, on gère la liste des applications liées à la gestion de production.',
      icon: 'inventory_2',
      route: '/settings/applications',
      cta: 'Gérer les applications',
      gradient: 'bg-gradient-to-br from-sky-500 to-cyan-500',
      linkClass: 'text-sky-600',
    },
    {
      title: 'Jalon',
      description: 'Ici, on gère les étapes du projet.',
      icon: 'signpost',
      route: '/settings/jalons',
      cta: 'Gérer les jalons',
      gradient: 'bg-gradient-to-br from-violet-500 to-purple-600',
      linkClass: 'text-violet-600',
    },
  ];
}
