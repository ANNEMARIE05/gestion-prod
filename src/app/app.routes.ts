import { Routes } from '@angular/router';
import { MainShellComponent } from './layout/main-shell/main-shell.component';
import { LoginComponent } from './features/auth/login/login.component';
import { ProfilePageComponent } from './features/users/profile-page/profile-page.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: '',
    component: MainShellComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'utilisateurs',
        loadComponent: () => import('./features/users/users-shell/users-shell.component').then(m => m.UsersShellComponent),
        children: [
          {
            path: '',
            redirectTo: 'profils',
            pathMatch: 'full'
          },
          {
            path: 'profils/nouveau',
            loadComponent: () =>
              import('./features/users/profile-form-page/profile-form-page.component').then(m => m.ProfileFormPageComponent)
          },
          {
            path: 'profils/edit/:id',
            loadComponent: () =>
              import('./features/users/profile-form-page/profile-form-page.component').then(m => m.ProfileFormPageComponent)
          },
          {
            path: 'profils',
            loadComponent: () => import('./features/users/profils-page/profils-page.component').then(m => m.ProfilsPageComponent)
          },
          {
            path: 'profil',
            component: ProfilePageComponent
          },
          {
            path: 'ressources/nouveau',
            loadComponent: () =>
              import('./features/settings/user-form-page/user-form-page.component').then(m => m.UserFormPageComponent)
          },
          {
            path: 'ressources/detail/:id',
            loadComponent: () =>
              import('./features/users/ressource-detail-page/ressource-detail-page.component').then(
                m => m.RessourceDetailPageComponent,
              ),
          },
          {
            path: 'ressources/edit/:id',
            loadComponent: () =>
              import('./features/settings/user-form-page/user-form-page.component').then(m => m.UserFormPageComponent)
          },
          {
            path: 'ressources',
            loadComponent: () => import('./features/users/ressources-page/ressources-page.component').then(m => m.RessourcesPageComponent)
          }
        ]
      },
      {
        path: 'production',
        children: [
          {
            path: '',
            redirectTo: 'projets',
            pathMatch: 'full'
          },
          {
            path: 'projets',
            loadComponent: () => import('./features/production/production.component').then(m => m.ProductionComponent),
            data: { type: 'PROJECT' }
          },
          {
            path: 'audits',
            loadComponent: () => import('./features/production/production.component').then(m => m.ProductionComponent),
            data: { type: 'AUDIT' }
          },
          {
            path: 'veille',
            loadComponent: () => import('./features/production/production.component').then(m => m.ProductionComponent),
            data: { type: 'ENGINEERING' }
          },
          {
            path: 'new',
            loadComponent: () => import('./features/production/production-form-page/production-form-page.component').then(m => m.ProductionFormPageComponent)
          },
          {
            path: 'edit/:id',
            loadComponent: () => import('./features/production/production-form-page/production-form-page.component').then(m => m.ProductionFormPageComponent)
          },
          {
            path: 'detail/:id',
            loadComponent: () => import('./features/production/production-detail-page/production-detail-page.component').then(m => m.ProductionDetailPageComponent)
          }
        ]
      },
      {
        path: 'planification',
        children: [
          {
            path: '',
            redirectTo: 'projets',
            pathMatch: 'full'
          },
          {
            path: 'projets',
            loadComponent: () => import('./features/planification/planification.component').then(m => m.PlanificationComponent),
            data: { type: 'PROJECT' }
          },
          {
            path: 'audits',
            loadComponent: () => import('./features/planification/planification.component').then(m => m.PlanificationComponent),
            data: { type: 'AUDIT' }
          },
          {
            path: 'veille',
            loadComponent: () => import('./features/planification/planification.component').then(m => m.PlanificationComponent),
            data: { type: 'ENGINEERING' }
          },
          {
            path: 'monitoring',
            loadComponent: () => import('./features/planification/planification.component').then(m => m.PlanificationComponent),
            data: { type: 'MONITORING' }
          },
          {
            path: 'new',
            loadComponent: () =>
              import('./features/planification/planification-form-page/planification-form-page.component').then(m => m.PlanificationFormPageComponent),
            data: { type: 'AUDIT' }
          },
          {
            path: 'projets/new',
            loadComponent: () =>
              import('./features/planification/planification-form-page/planification-form-page.component').then(m => m.PlanificationFormPageComponent),
            data: { type: 'PROJECT' }
          },
          {
            path: 'audits/new',
            loadComponent: () =>
              import('./features/planification/planification-form-page/planification-form-page.component').then(m => m.PlanificationFormPageComponent),
            data: { type: 'AUDIT' }
          },
          {
            path: 'veille/new',
            loadComponent: () =>
              import('./features/planification/planification-form-page/planification-form-page.component').then(m => m.PlanificationFormPageComponent),
            data: { type: 'ENGINEERING' }
          },
          {
            path: 'monitoring/new',
            loadComponent: () =>
              import('./features/planification/planification-form-page/planification-form-page.component').then(m => m.PlanificationFormPageComponent),
            data: { type: 'MONITORING' }
          },
          {
            path: 'edit/:id',
            loadComponent: () =>
              import('./features/planification/planification-form-page/planification-form-page.component').then(m => m.PlanificationFormPageComponent)
          },
          {
            path: 'detail/:id',
            loadComponent: () =>
              import('./features/planification/planification-detail-page/planification-detail-page.component').then(m => m.PlanificationDetailPageComponent)
          },
          {
            path: 'audits/detail/:id',
            loadComponent: () =>
              import('./features/planification/planification-detail-page/planification-detail-page.component').then(m => m.PlanificationDetailPageComponent)
          },
          {
            path: 'veille/detail/:id',
            loadComponent: () =>
              import('./features/planification/planification-detail-page/planification-detail-page.component').then(m => m.PlanificationDetailPageComponent)
          }
        ]
      },
      {
        path: 'audit',
        loadComponent: () => import('./features/audit-trail/audit-trail.component').then(m => m.AuditTrailComponent)
      },
      {
        path: 'settings',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/settings/settings-shell/settings-shell.component').then(m => m.SettingsShellComponent)
          },
          {
            path: 'menus/nouveau',
            loadComponent: () =>
              import('./features/settings/menu-form-page/menu-form-page.component').then(m => m.MenuFormPageComponent)
          },
          {
            path: 'menus/edit/:id',
            loadComponent: () =>
              import('./features/settings/menu-form-page/menu-form-page.component').then(m => m.MenuFormPageComponent)
          },
          {
            path: 'menus',
            loadComponent: () =>
              import('./features/settings/menus-page/menus-page.component').then(m => m.MenusPageComponent)
          },
          {
            path: 'actions/nouveau',
            loadComponent: () =>
              import('./features/settings/action-form-page/action-form-page.component').then(m => m.ActionFormPageComponent)
          },
          {
            path: 'actions/edit/:id',
            loadComponent: () =>
              import('./features/settings/action-form-page/action-form-page.component').then(m => m.ActionFormPageComponent)
          },
          {
            path: 'actions',
            loadComponent: () =>
              import('./features/settings/actions-page/actions-page.component').then(m => m.ActionsPageComponent)
          },
          {
            path: 'entites/nouveau',
            loadComponent: () =>
              import('./features/settings/entite-form-page/entite-form-page.component').then(m => m.EntiteFormPageComponent)
          },
          {
            path: 'entites/edit/:id',
            loadComponent: () =>
              import('./features/settings/entite-form-page/entite-form-page.component').then(m => m.EntiteFormPageComponent)
          },
          {
            path: 'entites/:id',
            loadComponent: () =>
              import('./features/settings/entite-detail-page/entite-detail-page.component').then(m => m.EntiteDetailPageComponent)
          },
          {
            path: 'entites',
            loadComponent: () =>
              import('./features/settings/entites-page/entites-page.component').then(m => m.EntitesPageComponent)
          },
          {
            path: 'specialites/nouveau',
            loadComponent: () =>
              import('./features/settings/specialite-form-page/specialite-form-page.component').then(m => m.SpecialiteFormPageComponent)
          },
          {
            path: 'specialites/edit/:id',
            loadComponent: () =>
              import('./features/settings/specialite-form-page/specialite-form-page.component').then(m => m.SpecialiteFormPageComponent)
          },
          {
            path: 'specialites',
            loadComponent: () =>
              import('./features/settings/specialites-page/specialites-page.component').then(m => m.SpecialitesPageComponent)
          },
          {
            path: 'applications/nouveau',
            loadComponent: () =>
              import('./features/settings/application-form-page/application-form-page.component').then(m => m.ApplicationFormPageComponent)
          },
          {
            path: 'applications/edit/:id',
            loadComponent: () =>
              import('./features/settings/application-form-page/application-form-page.component').then(m => m.ApplicationFormPageComponent)
          },
          {
            path: 'applications',
            loadComponent: () =>
              import('./features/settings/applications-page/applications-page.component').then(m => m.ApplicationsPageComponent)
          },
          {
            path: 'jalons/nouveau',
            loadComponent: () =>
              import('./features/settings/jalon-form-page/jalon-form-page.component').then(m => m.JalonFormPageComponent)
          },
          {
            path: 'jalons/edit/:id',
            loadComponent: () =>
              import('./features/settings/jalon-form-page/jalon-form-page.component').then(m => m.JalonFormPageComponent)
          },
          {
            path: 'jalons/:id',
            loadComponent: () =>
              import('./features/settings/jalon-detail-page/jalon-detail-page.component').then(m => m.JalonDetailPageComponent)
          },
          {
            path: 'jalons',
            loadComponent: () =>
              import('./features/settings/jalons-page/jalons-page.component').then(m => m.JalonsPageComponent)
          }
        ]
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
