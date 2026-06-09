import { Routes } from '@angular/router';
import { MainShellComponent } from './layout/main-shell/main-shell.component';
import { LoginComponent } from './features/auth/login/login.component';
import { ProfilePageComponent } from './features/users/profil/profile-page/profile-page.component';
import { HomeRedirectComponent } from './features/home-redirect/home-redirect.component';
import { AuthGuard } from './core/guards/auth.guard';
import { LoginRedirectGuard } from './core/guards/login-redirect.guard';
import { MenuPermissionGuard } from './core/guards/menu-permission.guard';

const planificationList = () =>
  import('./features/planification/projet/planification.component').then((m) => m.PlanificationComponent);
const planificationForm = () =>
  import('./features/planification/projet/planification-form-page/planification-form-page.component').then(
    (m) => m.PlanificationFormPageComponent,
  );
const planificationDetail = () =>
  import('./features/planification/projet/planification-detail-page/planification-detail-page.component').then(
    (m) => m.PlanificationDetailPageComponent,
  );

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: HomeRedirectComponent },
  { path: 'login', component: LoginComponent, canActivate: [LoginRedirectGuard] },
  {
    path: '',
    component: MainShellComponent,
    canActivate: [AuthGuard],
    canActivateChild: [MenuPermissionGuard],
    children: [
      {
        path: 'bienvenue',
        loadComponent: () =>
          import('./features/bienvenue/bienvenue.component').then((m) => m.BienvenueComponent),
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      { path: 'mon-profil', component: ProfilePageComponent },

      // Utilisateurs
      {
        path: 'utilisateurs/profils/create',
        loadComponent: () =>
          import('./features/users/profil/profile-form-page/profile-form-page.component').then(
            (m) => m.ProfileFormPageComponent,
          ),
      },
      {
        path: 'utilisateurs/profils/edit/:id',
        loadComponent: () =>
          import('./features/users/profil/profile-form-page/profile-form-page.component').then(
            (m) => m.ProfileFormPageComponent,
          ),
      },
      {
        path: 'utilisateurs/profils/:id',
        loadComponent: () =>
          import('./features/users/profil/profil-detail-page/profil-detail-page.component').then(
            (m) => m.ProfilDetailPageComponent,
          ),
      },
      {
        path: 'utilisateurs/profils',
        loadComponent: () =>
          import('./features/users/profil/profils-page/profils-page.component').then((m) => m.ProfilsPageComponent),
      },
      {
        path: 'utilisateurs/ressources/create',
        loadComponent: () =>
          import('./features/users/ressource/user-form-page/user-form-page.component').then(
            (m) => m.UserFormPageComponent,
          ),
      },
      {
        path: 'utilisateurs/ressources/edit/:id',
        loadComponent: () =>
          import('./features/users/ressource/user-form-page/user-form-page.component').then(
            (m) => m.UserFormPageComponent,
          ),
      },
      {
        path: 'utilisateurs/ressources/:id',
        loadComponent: () =>
          import('./features/users/ressource/ressource-detail-page/ressource-detail-page.component').then(
            (m) => m.RessourceDetailPageComponent,
          ),
      },
      {
        path: 'utilisateurs/ressources',
        loadComponent: () =>
          import('./features/users/ressource/ressources-page/ressources-page.component').then(
            (m) => m.RessourcesPageComponent,
          ),
      },

      // Productions
      {
        path: 'productions/projets',
        loadComponent: () =>
          import('./features/production/projet/projet-list-page.component').then(
            (m) => m.ProjetListPageComponent,
          ),
      },
      {
        path: 'productions/projets/create',
        loadComponent: () =>
          import('./features/production/projet/projet-form-page.component').then(
            (m) => m.ProjetFormPageComponent,
          ),
      },
      {
        path: 'productions/projets/edit/:id',
        loadComponent: () =>
          import('./features/production/projet/projet-form-page.component').then(
            (m) => m.ProjetFormPageComponent,
          ),
      },
      {
        path: 'productions/projets/:id',
        loadComponent: () =>
          import('./features/production/projet/projet-detail-page.component').then(
            (m) => m.ProjetDetailPageComponent,
          ),
      },
      {
        path: 'productions/audits',
        loadComponent: () =>
          import('./features/production/audit/audit-list-page.component').then(
            (m) => m.AuditListPageComponent,
          ),
      },
      {
        path: 'productions/audits/create',
        loadComponent: () =>
          import('./features/production/audit/audit-form-page.component').then(
            (m) => m.AuditFormPageComponent,
          ),
      },
      {
        path: 'productions/audits/edit/:id',
        loadComponent: () =>
          import('./features/production/audit/audit-form-page.component').then(
            (m) => m.AuditFormPageComponent,
          ),
      },
      {
        path: 'productions/audits/:id',
        loadComponent: () =>
          import('./features/production/audit/audit-detail-page.component').then(
            (m) => m.AuditDetailPageComponent,
          ),
      },
      {
        path: 'productions/ingenierie',
        loadComponent: () =>
          import('./features/production/veille/veille-list-page.component').then(
            (m) => m.VeilleListPageComponent,
          ),
      },
      {
        path: 'productions/ingenierie/create',
        loadComponent: () =>
          import('./features/production/veille/veille-form-page.component').then(
            (m) => m.VeilleFormPageComponent,
          ),
      },
      {
        path: 'productions/ingenierie/edit/:id',
        loadComponent: () =>
          import('./features/production/veille/veille-form-page.component').then(
            (m) => m.VeilleFormPageComponent,
          ),
      },
      {
        path: 'productions/ingenierie/:id',
        loadComponent: () =>
          import('./features/production/veille/veille-detail-page.component').then(
            (m) => m.VeilleDetailPageComponent,
          ),
      },


      // Planifications
      { path: 'planifications/projets', loadComponent: planificationList, data: { type: 'PROJECT' } },
      { path: 'planifications/projets/create', loadComponent: planificationForm, data: { type: 'PROJECT' } },
      { path: 'planifications/projets/edit/:id', loadComponent: planificationForm, data: { type: 'PROJECT' } },
      { path: 'planifications/projets/:id', loadComponent: planificationDetail, data: { type: 'PROJECT' } },
      {
        path: 'planifications/audits',
        loadComponent: () =>
          import('./features/planification/audit/audit-planification-list.component').then(
            (m) => m.AuditPlanificationListComponent,
          ),
      },
      {
        path: 'planifications/audits/nouveau',
        loadComponent: () =>
          import('./features/planification/audit/audit-planification-form.component').then(
            (m) => m.AuditPlanificationFormComponent,
          ),
      },
      {
        path: 'planifications/audits/edit/:id',
        loadComponent: () =>
          import('./features/planification/audit/audit-planification-form.component').then(
            (m) => m.AuditPlanificationFormComponent,
          ),
      },
      {
        path: 'planifications/audits/:id',
        loadComponent: () =>
          import('./features/planification/audit/audit-planification-detail.component').then(
            (m) => m.AuditPlanificationDetailComponent,
          ),
      },
      {
        path: 'planifications/ingenierie',
        loadComponent: () =>
          import('./features/planification/veille/veille-planification-list.component').then(
            (m) => m.VeillePlanificationListComponent,
          ),
      },
      {
        path: 'planifications/ingenierie/create',
        loadComponent: () =>
          import('./features/planification/veille/veille-planification-form.component').then(
            (m) => m.VeillePlanificationFormComponent,
          ),
      },
      {
        path: 'planifications/ingenierie/edit/:id',
        loadComponent: () =>
          import('./features/planification/veille/veille-planification-form.component').then(
            (m) => m.VeillePlanificationFormComponent,
          ),
      },
      {
        path: 'planifications/ingenierie/:id',
        loadComponent: () =>
          import('./features/planification/veille/veille-planification-detail.component').then(
            (m) => m.VeillePlanificationDetailComponent,
          ),
      },

      // Piste d'audit
      {
        path: 'piste-audit',
        loadComponent: () =>
          import('./features/audit-trail/audit-trail.component').then((m) => m.AuditTrailComponent),
      },

      // Paramétrages
      {
        path: 'parametrages',
        loadComponent: () =>
          import('./features/settings/settings-shell/settings-shell.component').then(
            (m) => m.SettingsShellComponent,
          ),
      },
      {
        path: 'parametrages/actions/create',
        loadComponent: () =>
          import('./features/settings/action/action-form-page/action-form-page.component').then(
            (m) => m.ActionFormPageComponent,
          ),
      },
      {
        path: 'parametrages/actions/edit/:id',
        loadComponent: () =>
          import('./features/settings/action/action-form-page/action-form-page.component').then(
            (m) => m.ActionFormPageComponent,
          ),
      },
      {
        path: 'parametrages/actions/:id',
        loadComponent: () =>
          import('./features/settings/action/action-form-page/action-form-page.component').then(
            (m) => m.ActionFormPageComponent,
          ),
      },
      {
        path: 'parametrages/actions',
        loadComponent: () =>
          import('./features/settings/action/actions-page/actions-page.component').then((m) => m.ActionsPageComponent),
      },
      {
        path: 'parametrages/menus/create',
        loadComponent: () =>
          import('./features/settings/menu/menu-form-page/menu-form-page.component').then(
            (m) => m.MenuFormPageComponent,
          ),
      },
      {
        path: 'parametrages/menus/edit/:id',
        loadComponent: () =>
          import('./features/settings/menu/menu-form-page/menu-form-page.component').then(
            (m) => m.MenuFormPageComponent,
          ),
      },
      {
        path: 'parametrages/menus/:id',
        loadComponent: () =>
          import('./features/settings/menu/menu-detail-page/menu-detail-page.component').then(
            (m) => m.MenuDetailPageComponent,
          ),
      },
      {
        path: 'parametrages/menus',
        loadComponent: () =>
          import('./features/settings/menu/menus-page/menus-page.component').then((m) => m.MenusPageComponent),
      },
      {
        path: 'parametrages/entites/create',
        loadComponent: () =>
          import('./features/settings/entite/entite-form-page/entite-form-page.component').then(
            (m) => m.EntiteFormPageComponent,
          ),
      },
      {
        path: 'parametrages/entites/edit/:id',
        loadComponent: () =>
          import('./features/settings/entite/entite-form-page/entite-form-page.component').then(
            (m) => m.EntiteFormPageComponent,
          ),
      },
      {
        path: 'parametrages/entites/:id',
        loadComponent: () =>
          import('./features/settings/entite/entite-detail-page/entite-detail-page.component').then(
            (m) => m.EntiteDetailPageComponent,
          ),
      },
      {
        path: 'parametrages/entites',
        loadComponent: () =>
          import('./features/settings/entite/entites-page/entites-page.component').then((m) => m.EntitesPageComponent),
      },
      {
        path: 'parametrages/specialites-techniques/create',
        loadComponent: () =>
          import('./features/settings/specialite/specialite-form-page/specialite-form-page.component').then(
            (m) => m.SpecialiteFormPageComponent,
          ),
      },
      {
        path: 'parametrages/specialites-techniques/edit/:id',
        loadComponent: () =>
          import('./features/settings/specialite/specialite-form-page/specialite-form-page.component').then(
            (m) => m.SpecialiteFormPageComponent,
          ),
      },
      {
        path: 'parametrages/specialites-techniques/:id',
        loadComponent: () =>
          import('./features/settings/specialite/specialite-detail-page/specialite-detail-page.component').then(
            (m) => m.SpecialiteDetailPageComponent,
          ),
      },
      {
        path: 'parametrages/specialites-techniques',
        loadComponent: () =>
          import('./features/settings/specialite/specialites-page/specialites-page.component').then(
            (m) => m.SpecialitesPageComponent,
          ),
      },
      {
        path: 'parametrages/applications/create',
        loadComponent: () =>
          import('./features/settings/application/application-form-page/application-form-page.component').then(
            (m) => m.ApplicationFormPageComponent,
          ),
      },
      {
        path: 'parametrages/applications/edit/:id',
        loadComponent: () =>
          import('./features/settings/application/application-form-page/application-form-page.component').then(
            (m) => m.ApplicationFormPageComponent,
          ),
      },
      {
        path: 'parametrages/applications/:id',
        loadComponent: () =>
          import('./features/settings/application/application-detail-page/application-detail-page.component').then(
            (m) => m.ApplicationDetailPageComponent,
          ),
      },
      {
        path: 'parametrages/applications',
        loadComponent: () =>
          import('./features/settings/application/applications-page/applications-page.component').then(
            (m) => m.ApplicationsPageComponent,
          ),
      },
      {
        path: 'parametrages/jalons/create',
        loadComponent: () =>
          import('./features/settings/jalon/jalon-form-page/jalon-form-page.component').then(
            (m) => m.JalonFormPageComponent,
          ),
      },
      {
        path: 'parametrages/jalons/edit/:id',
        loadComponent: () =>
          import('./features/settings/jalon/jalon-form-page/jalon-form-page.component').then(
            (m) => m.JalonFormPageComponent,
          ),
      },
      {
        path: 'parametrages/jalons/:id',
        loadComponent: () =>
          import('./features/settings/jalon/jalon-detail-page/jalon-detail-page.component').then(
            (m) => m.JalonDetailPageComponent,
          ),
      },
      {
        path: 'parametrages/jalons',
        loadComponent: () =>
          import('./features/settings/jalon/jalons-page/jalons-page.component').then((m) => m.JalonsPageComponent),
      },

      // Redirections compatibilité (anciennes routes refonte)
      { path: 'utilisateurs/profils/nouveau', redirectTo: 'utilisateurs/profils/create', pathMatch: 'full' },
      { path: 'utilisateurs/ressources/nouveau', redirectTo: 'utilisateurs/ressources/create', pathMatch: 'full' },
      { path: 'parametrages/actions/nouveau', redirectTo: 'parametrages/actions/create', pathMatch: 'full' },
      { path: 'parametrages/menus/nouveau', redirectTo: 'parametrages/menus/create', pathMatch: 'full' },
      { path: 'parametrages/entites/nouveau', redirectTo: 'parametrages/entites/create', pathMatch: 'full' },
      { path: 'parametrages/specialites-techniques/nouveau', redirectTo: 'parametrages/specialites-techniques/create', pathMatch: 'full' },
      { path: 'parametrages/applications/nouveau', redirectTo: 'parametrages/applications/create', pathMatch: 'full' },
      { path: 'parametrages/jalons/nouveau', redirectTo: 'parametrages/jalons/create', pathMatch: 'full' },
      { path: 'utilisateurs/profil', redirectTo: 'mon-profil', pathMatch: 'full' },
      { path: 'utilisateurs', redirectTo: 'utilisateurs/profils', pathMatch: 'full' },
      { path: 'production', redirectTo: 'productions/projets', pathMatch: 'prefix' },
      { path: 'planification', redirectTo: 'planifications/projets', pathMatch: 'prefix' },
      { path: 'settings', redirectTo: 'parametrages', pathMatch: 'prefix' },
      { path: 'audit', redirectTo: 'piste-audit', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
