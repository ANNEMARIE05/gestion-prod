import { Routes } from '@angular/router';
import { MainShellComponent } from './layout/main-shell/main-shell.component';
import { LoginComponent } from './features/auth/login/login.component';
import { ProfilePageComponent } from './features/users/profile-page/profile-page.component';
import { HomeRedirectComponent } from './features/home-redirect/home-redirect.component';
import { AuthGuard } from './services/auth.guard';
import { LoginRedirectGuard } from './services/login-redirect.guard';
import { MenuPermissionGuard } from './services/menu-permission.guard';

const productionList = () =>
  import('./features/production/production.component').then((m) => m.ProductionComponent);
const productionForm = () =>
  import('./features/production/production-form-page/production-form-page.component').then(
    (m) => m.ProductionFormPageComponent,
  );
const productionDetail = () =>
  import('./features/production/production-detail-page/production-detail-page.component').then(
    (m) => m.ProductionDetailPageComponent,
  );

const planificationList = () =>
  import('./features/planification/planification.component').then((m) => m.PlanificationComponent);
const planificationForm = () =>
  import('./features/planification/planification-form-page/planification-form-page.component').then(
    (m) => m.PlanificationFormPageComponent,
  );
const planificationDetail = () =>
  import('./features/planification/planification-detail-page/planification-detail-page.component').then(
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
          import('./features/users/profile-form-page/profile-form-page.component').then(
            (m) => m.ProfileFormPageComponent,
          ),
      },
      {
        path: 'utilisateurs/profils/edit/:id',
        loadComponent: () =>
          import('./features/users/profile-form-page/profile-form-page.component').then(
            (m) => m.ProfileFormPageComponent,
          ),
      },
      {
        path: 'utilisateurs/profils/:id',
        loadComponent: () =>
          import('./features/users/profil-detail-page/profil-detail-page.component').then(
            (m) => m.ProfilDetailPageComponent,
          ),
      },
      {
        path: 'utilisateurs/profils',
        loadComponent: () =>
          import('./features/users/profils-page/profils-page.component').then((m) => m.ProfilsPageComponent),
      },
      {
        path: 'utilisateurs/ressources/create',
        loadComponent: () =>
          import('./features/settings/user-form-page/user-form-page.component').then(
            (m) => m.UserFormPageComponent,
          ),
      },
      {
        path: 'utilisateurs/ressources/edit/:id',
        loadComponent: () =>
          import('./features/settings/user-form-page/user-form-page.component').then(
            (m) => m.UserFormPageComponent,
          ),
      },
      {
        path: 'utilisateurs/ressources/:id',
        loadComponent: () =>
          import('./features/users/ressource-detail-page/ressource-detail-page.component').then(
            (m) => m.RessourceDetailPageComponent,
          ),
      },
      {
        path: 'utilisateurs/ressources',
        loadComponent: () =>
          import('./features/users/ressources-page/ressources-page.component').then(
            (m) => m.RessourcesPageComponent,
          ),
      },

      // Productions
      { path: 'productions/projets', loadComponent: productionList, data: { type: 'PROJECT' } },
      { path: 'productions/projets/create', loadComponent: productionForm, data: { type: 'PROJECT' } },
      { path: 'productions/projets/edit/:id', loadComponent: productionForm, data: { type: 'PROJECT' } },
      { path: 'productions/projets/:id', loadComponent: productionDetail, data: { type: 'PROJECT' } },
      { path: 'productions/audits', loadComponent: productionList, data: { type: 'AUDIT' } },
      { path: 'productions/audits/create', loadComponent: productionForm, data: { type: 'AUDIT' } },
      { path: 'productions/audits/edit/:id', loadComponent: productionForm, data: { type: 'AUDIT' } },
      { path: 'productions/audits/:id', loadComponent: productionDetail, data: { type: 'AUDIT' } },
      { path: 'productions/ingenierie', loadComponent: productionList, data: { type: 'ENGINEERING' } },
      { path: 'productions/ingenierie/create', loadComponent: productionForm, data: { type: 'ENGINEERING' } },
      { path: 'productions/ingenierie/edit/:id', loadComponent: productionForm, data: { type: 'ENGINEERING' } },
      { path: 'productions/ingenierie/:id', loadComponent: productionDetail, data: { type: 'ENGINEERING' } },

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
          import('./features/settings/action-form-page/action-form-page.component').then(
            (m) => m.ActionFormPageComponent,
          ),
      },
      {
        path: 'parametrages/actions/edit/:id',
        loadComponent: () =>
          import('./features/settings/action-form-page/action-form-page.component').then(
            (m) => m.ActionFormPageComponent,
          ),
      },
      {
        path: 'parametrages/actions/:id',
        loadComponent: () =>
          import('./features/settings/action-form-page/action-form-page.component').then(
            (m) => m.ActionFormPageComponent,
          ),
      },
      {
        path: 'parametrages/actions',
        loadComponent: () =>
          import('./features/settings/actions-page/actions-page.component').then((m) => m.ActionsPageComponent),
      },
      {
        path: 'parametrages/menus/create',
        loadComponent: () =>
          import('./features/settings/menu-form-page/menu-form-page.component').then(
            (m) => m.MenuFormPageComponent,
          ),
      },
      {
        path: 'parametrages/menus/edit/:id',
        loadComponent: () =>
          import('./features/settings/menu-form-page/menu-form-page.component').then(
            (m) => m.MenuFormPageComponent,
          ),
      },
      {
        path: 'parametrages/menus/:id',
        loadComponent: () =>
          import('./features/settings/menu-detail-page/menu-detail-page.component').then(
            (m) => m.MenuDetailPageComponent,
          ),
      },
      {
        path: 'parametrages/menus',
        loadComponent: () =>
          import('./features/settings/menus-page/menus-page.component').then((m) => m.MenusPageComponent),
      },
      {
        path: 'parametrages/entites/create',
        loadComponent: () =>
          import('./features/settings/entite-form-page/entite-form-page.component').then(
            (m) => m.EntiteFormPageComponent,
          ),
      },
      {
        path: 'parametrages/entites/edit/:id',
        loadComponent: () =>
          import('./features/settings/entite-form-page/entite-form-page.component').then(
            (m) => m.EntiteFormPageComponent,
          ),
      },
      {
        path: 'parametrages/entites/:id',
        loadComponent: () =>
          import('./features/settings/entite-detail-page/entite-detail-page.component').then(
            (m) => m.EntiteDetailPageComponent,
          ),
      },
      {
        path: 'parametrages/entites',
        loadComponent: () =>
          import('./features/settings/entites-page/entites-page.component').then((m) => m.EntitesPageComponent),
      },
      {
        path: 'parametrages/specialites-techniques/create',
        loadComponent: () =>
          import('./features/settings/specialite-form-page/specialite-form-page.component').then(
            (m) => m.SpecialiteFormPageComponent,
          ),
      },
      {
        path: 'parametrages/specialites-techniques/edit/:id',
        loadComponent: () =>
          import('./features/settings/specialite-form-page/specialite-form-page.component').then(
            (m) => m.SpecialiteFormPageComponent,
          ),
      },
      {
        path: 'parametrages/specialites-techniques/:id',
        loadComponent: () =>
          import('./features/settings/specialite-detail-page/specialite-detail-page.component').then(
            (m) => m.SpecialiteDetailPageComponent,
          ),
      },
      {
        path: 'parametrages/specialites-techniques',
        loadComponent: () =>
          import('./features/settings/specialites-page/specialites-page.component').then(
            (m) => m.SpecialitesPageComponent,
          ),
      },
      {
        path: 'parametrages/applications/create',
        loadComponent: () =>
          import('./features/settings/application-form-page/application-form-page.component').then(
            (m) => m.ApplicationFormPageComponent,
          ),
      },
      {
        path: 'parametrages/applications/edit/:id',
        loadComponent: () =>
          import('./features/settings/application-form-page/application-form-page.component').then(
            (m) => m.ApplicationFormPageComponent,
          ),
      },
      {
        path: 'parametrages/applications/:id',
        loadComponent: () =>
          import('./features/settings/application-detail-page/application-detail-page.component').then(
            (m) => m.ApplicationDetailPageComponent,
          ),
      },
      {
        path: 'parametrages/applications',
        loadComponent: () =>
          import('./features/settings/applications-page/applications-page.component').then(
            (m) => m.ApplicationsPageComponent,
          ),
      },
      {
        path: 'parametrages/jalons/create',
        loadComponent: () =>
          import('./features/settings/jalon-form-page/jalon-form-page.component').then(
            (m) => m.JalonFormPageComponent,
          ),
      },
      {
        path: 'parametrages/jalons/edit/:id',
        loadComponent: () =>
          import('./features/settings/jalon-form-page/jalon-form-page.component').then(
            (m) => m.JalonFormPageComponent,
          ),
      },
      {
        path: 'parametrages/jalons/:id',
        loadComponent: () =>
          import('./features/settings/jalon-detail-page/jalon-detail-page.component').then(
            (m) => m.JalonDetailPageComponent,
          ),
      },
      {
        path: 'parametrages/jalons',
        loadComponent: () =>
          import('./features/settings/jalons-page/jalons-page.component').then((m) => m.JalonsPageComponent),
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
