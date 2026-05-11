# Spécification backend complète — Gestion de production (frontend Angular)

Ce document est dérivé **exclusivement du code source du frontend** (`src/app`). Aujourd’hui l’application **ne consomme aucune API HTTP** : authentification démo, données paramétrage en mémoire, production / planification / audit dans `localStorage`. La section **API REST proposée** indique ce qu’un backend doit exposer pour reproduire le même comportement une fois le frontend branché.

---

## 1. État actuel du frontend (référence)

| Domaine | Persistance | Fichiers clés |
|--------|-------------|---------------|
| Session utilisateur | `localStorage` clé `user` (+ `user_password` pour changement MDP local) | `auth.service.ts` |
| Fiches production | `gestion_prod_items_v1` | `production.service.ts`, `local-storage-json.ts` |
| Tâches planification | `gestion_prod_plan_v1` | `planification.service.ts` |
| Piste d’audit | `gestion_prod_audit_v1` | `audit-trail.service.ts` |
| Menus, actions, profils, utilisateurs référentiels | **Mémoire uniquement** (rechargement page = perte sauf données ci-dessus) | `settings.service.ts`, `local-app-defaults.ts` |

**Connexion démo codée en dur :** email `admin@ngser.local`, mot de passe `admin123` (`local-app-defaults.ts`).

**Pagination et filtres :** entièrement **côté client** (Angular Material `MatTableDataSource` + `MatPaginator`). Le backend devra supporter équivalent si vous passez en mode serveur (voir §7).

---

## 2. Modèle métier — tables logiques (base de données)

Les noms de tables ci-dessous sont des **propositions** ; l’important est la sémantique et les clés étrangères.

**Découplage production / planification :** les filières **ne partagent pas le même schéma métier**. Ce document les traite **séparément** : pour chaque type (projet, audit IT, veille, monitoring), la **fiche production** est décrite en premier, puis **en dessous** la **ligne de planification** correspondante, avec uniquement les champs qui la concernent. Aucun mélange de champs entre filières.

### 2.1 `users` (ressources humaines / comptes applicatifs)

| Champ | Type suggéré | Rôle |
|-------|----------------|------|
| `id` | UUID / string | Identifiant stable (sélection TPM, ressources, propriétaire planif., etc.) |
| `email` | string unique | Connexion + affichage |
| `password_hash` | string | Hash (bcrypt, argon2…) — **jamais** renvoyé en clair |
| `first_name` | string | Prénom |
| `last_name` | string | Nom |
| `name` | string | Nom complet affiché (peut être dérivé `first_name` + `last_name`) |
| `profile_id` | FK → `authorization_profiles` | Droits menus + actions |
| `entity_id` | FK → `entities` | Entité d’affectation (feuille si hiérarchie) |
| `specialty_id` | FK → `specialties` | Spécialité |
| `contact` | string nullable | Téléphone / contact optionnel |
| `avatar` | string nullable | Initiales ou URL avatar |
| `active` | boolean | Compte actif (utile côté admin) |
| `created_at` / `updated_at` | timestamptz | Audit technique |

**Champ API uniquement (pas une colonne obligatoire en base) :** `habilitations` — objet `{ menus: [...] }` calculé à partir du profil et des référentiels menus/actions (voir §3.1). À inclure dans les réponses **login**, **refresh**, **`GET /users/me`**, et **`PATCH /users/me`** lorsque pertinent.

**Règles UI actuelles (création ressource) :** nom, prénom, email, entité (et sous-entité si enfants), profil, spécialité obligatoires.

---

### 2.2 `authorization_profiles`

| Champ | Type | Rôle |
|-------|------|------|
| `id` | string | Identifiant profil |
| `label` | string | Libellé (ex. `ADMIN`) |
| `visible_menu_ids` | JSON array of string | IDs de menus visibles (parents et/ou feuilles) |
| `allowed_actions_by_menu` | JSON object | Clé = `menu_id`, valeur = liste d’`action_id` autorisés pour ce profil |

**Fonctionnement :** pour une URL donnée, le frontend résout le **menu feuille** correspondant au `route`, puis vérifie que l’action demandée (code `VIEW`, `CREATE`, etc.) est à la fois dans le catalogue global, dans l’habilitation du menu, et dans `allowed_actions_by_menu[menuId]` du profil (`permission.service.ts`).

---

### 2.3 `app_actions` (catalogue global d’actions)

| Champ | Type | Rôle |
|-------|------|------|
| `id` | string | ID technique |
| `code` | string | Code métier : `VIEW`, `VIEW_DETAIL`, `CREATE`, `EDIT`, `DELETE`, `EXPORT`, `IMPORT`, `DOWNLOAD_TEMPLATE` |
| `label` | string | Libellé FR |
| `icon` | string | Nom icône Material |
| `active` | boolean | Si false, l’action ne s’applique pas aux droits |

---

### 2.4 `menus`

Structure **arborescente** (parent/enfants). Le modèle frontend est récursif.

| Champ | Type | Rôle |
|-------|------|------|
| `id` | string | Identifiant menu |
| `label` | string | Libellé |
| `icon` | string | Icône |
| `route` | string | Chemin Angular (ex. `/production/projets`) |
| `parent_id` | FK nullable | Parent dans l’arbre |
| `permissions` | string[] optionnel | Métadonnées éventuelles |
| `active` | boolean | Menu affichable |
| `sort_order` | int optionnel | Ordre d’affichage (à ajouter en backend si besoin) |

**Table d’association optionnelle** `menu_actions` (menu_id, action_id) si vous ne voulez pas dupliquer l’objet `MenuHabilitation` en JSON : c’est l’équivalent de `habilitation[menuId] = [action ids...]` en mémoire dans le frontend.

---

### 2.5 `entities` (entités organisationnelles)

| Champ | Type | Rôle |
|-------|------|------|
| `id` | string | Identifiant |
| `name` | string | Nom |
| `icon` | string | Icône |
| `active` | boolean | Filtrage selects |
| `parent_id` | FK nullable | Hiérarchie |
| `created_at` | timestamptz | Création |

Représentation frontend : arbre avec `children[]` embarqué ; en SQL classique : table plate + `parent_id` ou closure table.

---

### 2.6 `specialties`

| Champ | Type | Rôle |
|-------|------|------|
| `id` | string | Identifiant |
| `label` | string | Libellé |
| `icon` | string | Icône |
| `active` | boolean | |
| `created_at` | timestamptz | |

---

### 2.7 `applications` (applications métier rattachées aux jalons)

| Champ | Type | Rôle |
|-------|------|------|
| `id` | string | |
| `code` | string | Code court |
| `label` | string | Libellé |
| `description` | text nullable | |
| `active` | boolean | |
| `created_at` | timestamptz | |
| `created_by` | string nullable | Utilisateur ou système |

---

### 2.8 `jalons` (jalons / sous-jalons)

| Champ | Type | Rôle |
|-------|------|------|
| `id` | string | |
| `code` | string | Code unique logique (export CSV, import) |
| `label` | string | Libellé |
| `parent_id` | FK nullable | Jalon parent (sous-jalon) |
| `created_at` | timestamptz | |
| `created_by` | string nullable | |

**Table de liaison** `jalon_applications` (`jalon_id`, `application_id`) pour remplacer le tableau `applicationIds` du frontend.

**Export / import CSV (écran jalons) :**

- Export colonnes : `code`, `libelle`, `jalonParentCode`, `applications` (libellés joints par `|`), `creationDate` (ISO date `YYYY-MM-DD`).
- Modèle téléchargeable : `code`, `libelle`, `jalonParentCode`, `applications`.
- Import actuel (frontend) : **très simplifié** — lit surtout `code` et `libelle` (premières colonnes), ignore le reste ; crée des jalons sans parent ni applications si code absent dupliqué. Un backend devra faire mieux (validation, FK parent par code, résolution applications).

---

### 2.9 Filière **Projet** (`type = PROJECT`)

Ne pas confondre avec les autres filières : ici seulement la fiche **catalogue projet** et, distinctement, la **planification projet**.

#### 2.9.1 Production — fiche projet

Table logique : `production_projects` (ou `production_items` avec `type = PROJECT` uniquement).

| Champ | Type | Rôle |
|-------|------|------|
| `id` | string | Identifiant |
| `libelle` | string | Titre du projet (**obligatoire** UI) |
| `description` | text | Détail |
| `tpm` | FK → `users.id` nullable | Chef de projet technique (TPM) — **spécifique projet** |
| `created_at` | timestamptz | Date de création fiche |

**Ressources (plusieurs)** — table `production_project_resources` (`production_item_id`, `user_id`, `sort_order`) : membres affectés au projet.

**Champs non utilisés sur cette filière :** pas d’équipement, pas de sujet veille, pas de jalons sur la fiche production (les jalons sont côté planification).

---

#### 2.9.2 Planification — ligne **projet** (distincte de la fiche production)

Table logique : `plan_tasks` avec `type = PROJECT` **ou** table dédiée `plan_project_tasks` si vous séparez physiquement les schémas.

| Champ | Type | Rôle |
|-------|------|------|
| `id` | string | Identifiant ligne planif. |
| `created_at` | timestamptz | |
| `type` | constant `PROJECT` | |
| `production_type_label` | string | Ex. « Projet » |
| `project_id` | FK → fiche **production projet** | Lien vers le projet planifié |
| `project_label` | string | Dénorm. affichage / export |
| `owner_id` | FK users | Responsable (**requis** UI) |
| `start_date`, `expected_end_date`, `actual_end_date` | date | Planning |
| `progress` | int 0–100 | (**requis** UI) |
| `status` | enum | `TODO`, `IN_PROGRESS`, `DONE`, `CANCELLED` (**requis** ; libellés UI projet : NOK / En cours / Terminé) |
| `jalon_id`, `jalon_label` | string | Jalon racine (**requis** UI) |
| `sub_jalon_id`, `sub_jalon_label` | string nullable | Sous-jalon |
| `application_id`, `application_label` | string nullable | Application liée au sous-jalon |
| `specialty_id`, `specialty_label` | string | Spécialité (**requis** UI) |

**Comportement UI :** `entity_id` / `entity_label` sont **vidés** à l’enregistrement pour projet (pas d’entité sur cette variante de planif.). Pas de champs équipement ni veille (topic, watch, etc.) sur cette ligne.

---

### 2.10 Filière **Audit IT** (`type = AUDIT`)

#### 2.10.1 Production — fiche audit IT

Table logique : `production_audits` (ou `production_items` avec `type = AUDIT`).

| Champ | Type | Rôle |
|-------|------|------|
| `id` | string | |
| `libelle` | string | Titre de la mission d’audit (**obligatoire**) |
| `description` | text | |
| `created_at` | timestamptz | |

**Ressource unique** — une seule entrée utilisateur (table liaison 1 ligne ou `resources[0]`) : l’auditeur / ressource affectée (**obligatoire** UI).

**Champs absents de cette fiche :** pas de TPM (réservé projet), pas de champs matériel (ils sont sur la **planification** audit).

---

#### 2.10.2 Planification — ligne **audit IT** (distincte de la fiche audit)

Table logique : `plan_tasks` avec `type = AUDIT` **ou** `plan_audit_tasks`.

| Champ | Type | Rôle |
|-------|------|------|
| `id`, `created_at`, `type`, `production_type_label` | … | Identité ligne |
| `project_id` | FK → fiche **production audit** | Référence la mission (`audit_id` / même sémantique que `project_id` dans le modèle unifié) |
| `project_label` | string | Dénorm. |
| `audit_id` | string | Souvent aligné sur `project_id` (fiche audit) |
| `specialty_id`, `specialty_label` | string | (**requis** UI) |
| `entity_id`, `entity_label` | string | Contexte entité (audit) |
| `owner_id` | FK users | Propriétaire |
| `start_date`, `expected_end_date`, `actual_end_date` | date | |
| `progress` | int | |
| `status` | enum | Statut planification |
| `equipment_id` | string | Identification équipement |
| `equipment_type` | enum | `PC`, `SERVEUR`, `VM` |
| `location_type` | enum | `CLOUD`, `SITE`, `BUREAU` |
| `equipment_identifier` | string | |
| `assigned_resource_id`, `assigned_to` | string | Ressource affectée équipement |
| `commissioning_date`, `last_maintenance_date`, `next_maintenance_date`, `warranty_deadline` | date nullable | |
| `equipment_state` | enum | `FONCTIONNEL`, `DEFAILLANT`, `HORS_SERVICE` |
| `license_status` | enum | `OUI`, `NON`, `A_RENOUVELER` |
| `audit_remarks` | text | Remarques audit |

**Comportement UI :** `issues`, `corrective_actions`, `comments` sont **vidés** à la sauvegarde pour le type audit. Pas de champs veille (topic, source, maturité, etc.) sur cette ligne.

---

### 2.11 Filière **Veille / ingénierie** (`type = ENGINEERING`)

#### 2.11.1 Production — fiche veille

Table logique : `production_engineering_items` (ou `production_items` avec `type = ENGINEERING`).

| Champ | Type | Rôle |
|-------|------|------|
| `id` | string | |
| `libelle` | string | Titre (**obligatoire**) |
| `description` | text | |
| `created_at` | timestamptz | |

**Ressource unique** — un utilisateur ressource (**obligatoire** UI), comme pour l’audit.

**Pas de TPM** sur cette fiche.

---

#### 2.11.2 Planification — ligne **veille**

Table logique : `plan_tasks` avec `type = ENGINEERING` **ou** `plan_engineering_tasks`.

| Champ | Type | Rôle |
|-------|------|------|
| `id`, `created_at`, `type`, `production_type_label` | … | |
| `project_id` | FK fiche veille | Pointe vers la fiche veille (`watch_id` côté formulaire = même référence) |
| `project_label`, `watch_id`, `watch_label` | string | Lien + libellé fiche veille |
| `identification` | string | (**requis** UI) |
| `topic` | enum | `IA`, `CYBERSECURITE`, `CLOUD`, `DATA`, `DEVOPS`, `AUTRE` (**requis**) |
| `source` | enum | `CONFERENCE`, `ARTICLE`, `PROJET_INTERNE`, `FORMATION`, `AUTRE` (**requis**) |
| `discovery_date` | date | (UI : alignée sur la logique dates de suivi) |
| `opportunity` | text | (**requis** UI) |
| `maturity_level` | enum | `VEILLE`, `ETUDE`, `POC`, `DEVELOPPEMENT` (**requis**) |
| `potential_impact` | enum | `ELEVE`, `MOYEN`, `FAIBLE` (**requis**) |
| `action_taken` | text | |
| `specialty_id`, `specialty_label` | string | (**requis** UI) |
| `start_date`, `expected_end_date`, `actual_end_date` | date | (**requis** dates / progression) |
| `progress` | int 0–100 | (**requis**) |
| `status` | enum | (**requis**) |
| `jalon_id`, `jalon_label`, `sub_jalon_id`, `sub_jalon_label`, `application_id`, `application_label` | … | Jalons / application comme les projets |

**Filtre liste veille :** champ libre `q` + `specialty` + `status` + `extra` = `topic`.

---

### 2.12 Filière **Monitoring** (`type = MONITORING`)

Dans le frontend, la création « monitoring » partage des écrans proches de la veille pour la **production** ; la **planification** se rapproche du **projet** (jalons, spécialité, pas d’`application` forcée).

#### 2.12.1 Production — fiche monitoring

| Champ | Type | Rôle |
|-------|------|------|
| `id`, `libelle`, `description`, `created_at` | … | Comme fiche veille côté formulaire liste |
| Ressource | 1 utilisateur | Comme audit / veille sur l’UI actuelle |

#### 2.12.2 Planification — ligne **monitoring**

| Champ | Type | Rôle |
|-------|------|------|
| Champs communs | | `owner_id`, `project_id` (fiche monitoring), `project_label`, dates, `progress`, `status`, `jalon_id`, `specialty_id` (**requis** comme projet) |
| `entity_id` / `entity_label` | | **Vidés** à l’enregistrement (comme projet) |
| `application_id` | | Peut être omis (UI monitoring) |

**Filtre liste :** même logique statut que projet (bucket NOK inclut `CANCELLED` avec `TODO`).

---

### 2.13 `audit_trail`

| Champ | Type | Rôle |
|-------|------|------|
| `id` | string | |
| `user_id`, `user_name` | string | Qui |
| `action` | enum | `CREATE`, `UPDATE`, `DELETE`, `LOGIN`, `LOGOUT`, `PASSWORD_CHANGE` |
| `module` | enum | `AUTH`, `PROFILE`, `PRODUCTION`, `PLANIFICATION`, `SETTINGS` |
| `details` | text | Message libre |
| `timestamp` | timestamptz | |
| `ip_address` | string nullable | Affiché en UI ; non renseigné localement |

---

### 2.14 Sessions / tokens (non présents dans le frontend — à ajouter)

Pour un backend stateless type JWT :

| Table / store | Rôle |
|---------------|------|
| `refresh_tokens` (user_id, token_hash, expires_at, revoked_at, user_agent, ip) | Rotation refresh token |
| ou Redis | Blacklist access tokens courts |

Le frontend devra stocker `access_token` (mémoire ou `sessionStorage`) et optionnellement `refresh_token` (`httpOnly` cookie recommandé).

---

## 3. Authentification — processus et contrats attendus

### 3.1 Login

**Entrée (body JSON) :**

```json
{
  "email": "string",
  "password": "string"
}
```

**Réponse succès (200) — exemple :**

```json
{
  "accessToken": "jwt...",
  "expiresIn": 900,
  "refreshToken": "opaque-or-jwt...",
  "tokenType": "Bearer",
  "user": {
    "id": "uuid",
    "email": "admin@ngser.local",
    "firstName": "Administrateur",
    "lastName": "Local",
    "name": "Administrateur Local",
    "profileId": "profile-admin",
    "profileLabel": "ADMIN",
    "entityId": "ent-root",
    "specialtyId": "spec-1",
    "contact": null,
    "avatar": "AL",
    "habilitations": {
      "menus": [
        {
          "id": "2-1",
          "label": "Projets",
          "icon": "folder",
          "route": "/production/projets",
          "parentId": "2",
          "active": true,
          "actions": [
            {
              "id": "a1",
              "code": "VIEW",
              "label": "Consulter",
              "icon": "visibility",
              "active": true
            },
            {
              "id": "a2",
              "code": "CREATE",
              "label": "Créer",
              "icon": "add_circle",
              "active": true
            }
          ]
        },
        {
          "id": "3-1",
          "label": "Planing Projets",
          "icon": "calendar_today",
          "route": "/planification/projets",
          "parentId": "3",
          "active": true,
          "actions": [
            { "id": "a1", "code": "VIEW", "label": "Consulter", "icon": "visibility", "active": true },
            { "id": "a3", "code": "EDIT", "label": "Modifier", "icon": "edit", "active": true }
          ]
        }
      ]
    }
  }
}
```

#### Champ `user.habilitations` (obligatoire dans la réponse login / session)

| Propriété | Type | Rôle |
|-----------|------|------|
| `habilitations.menus` | array | **Uniquement les menus** auxquels l’utilisateur a accès via son profil (`visible_menu_ids`), enrichis pour l’UI. |
| Chaque élément `menus[]` | object | Métadonnées menu : `id`, `label`, `icon`, `route`, `parentId` (nullable), `active`. |
| `menus[].actions` | array | **Actions réellement autorisées** pour cet utilisateur **sur ce menu** : intersection de (1) actions globales du menu (`menu_actions` / habilitation catalogue), (2) actions autorisées par le profil (`allowed_actions_by_menu[menu_id]`), (3) actions actives du catalogue (`app_actions.active = true`). |
| Chaque élément `actions[]` | object | `id`, `code`, `label`, `icon`, `active` — mêmes codes que le frontend (`VIEW`, `CREATE`, `EDIT`, `DELETE`, `EXPORT`, etc.). |

**Règles de calcul côté serveur :**

1. Charger le profil de l’utilisateur (`profile_id`).
2. Pour chaque `menu_id` ∈ `visible_menu_ids` du profil, résoudre la ligne menu (libellé, icône, route, parent).
3. Pour chaque menu, `actions_effective = intersection( habilitation_catalogue[menu_id], profil.allowed_actions_by_menu[menu_id] )`, puis joindre les lignes `app_actions` pour renvoyer `code`, `label`, `icon`.
4. Si un menu est visible mais n’a aucune action après intersection, renvoyer quand même le menu avec `"actions": []` (navigation possible sans bouton d’action métier).

**Intérêt pour le frontend :** reproduire `PermissionService.hasPermission(actionCode)` sans recharger tout le référentiel paramétrage ; afficher/masquer les boutons selon `user.habilitations.menus` → menu courant (match par `route`) → `actions.some(a => a.code === 'EXPORT')`.

**Même structure** recommandée dans : réponse `POST /auth/refresh` (si vous renvoyez un `user` à jour), `GET /users/me`, et `PATCH /users/me` si le profil ou les droits ont changé.

**Erreurs :** `401` identifiants invalides ; `423` compte verrouillé (optionnel).

**Comportement frontend actuel :** en cas d’échec, `HttpErrorResponse` status 401 → message d’erreur dans un snackbar (`login.component.ts`).

---

### 3.2 Déconnexion

**Option A — stateless :** `POST /auth/logout` avec body `{ "refreshToken": "..." }` pour révoquer le refresh côté serveur ; réponse `204`.

**Option B :** simple suppression côté client du token (moins sécurisé si refresh long).

**Comportement actuel :** suppression `localStorage` clé `user`, log audit `LOGOUT`, navigation `/login`.

---

### 3.3 Refresh token

**Requête :** `POST /auth/refresh`  
Body : `{ "refreshToken": "..." }`  
**Réponse 200 :** nouveau couple `accessToken` (+ éventuellement nouveau `refreshToken` si rotation).  
**Recommandé :** inclure un objet `user` **complet** avec `habilitations` (même schéma que §3.1) si les droits ou le profil ont pu changer pendant la session, afin que le client resynchronise menu et boutons sans appel supplémentaire.

**Erreur :** `401` si refresh expiré ou révoqué → le frontend doit rediriger vers `/login`.

---

### 3.4 Mot de passe (profil utilisateur)

**Requête :** `POST /users/me/password`  
Body :

```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

**Réponse :** `204` ou `{ "message": "..." }`.  
**Règle UI actuelle :** nouveau mot de passe **≥ 8 caractères** (`auth.service.ts`).

**Important :** le hash doit être **uniquement** côté serveur ; ne jamais persister le mot de passe en clair (contrairement à la clé locale `user_password` du mode démo).

---

### 3.5 Mise à jour profil (coordonnées)

**Requête :** `PATCH /users/me`  
Body partiel : `firstName`, `lastName`, `email`, `contact`.

**Réponse :** objet `User` complet à jour, **y compris `habilitations`** (§3.1) si `profile_id` ou les référentiels menus/actions ont été modifiés côté serveur.

---

## 4. Autorisation HTTP

Toutes les routes métier (sauf login / refresh / health) : header  
`Authorization: Bearer <accessToken>`.

Côté serveur : résoudre `user_id` → charger `profile` → vérifier route/menu et code action si vous mappez les permissions comme le frontend (`VIEW`, `CREATE`, …).  
Les habilitations renvoyées dans `user.habilitations` servent au **rendu UI** ; **l’API reste la source de vérité** : chaque route protégée doit quand même contrôler les droits (ne jamais se fier seulement au JSON client).

**Endpoint complémentaire :** `GET /users/me` — retourne l’utilisateur connecté avec le même bloc `habilitations` que le login.

---

## 5. API REST proposée (ressources)

Préfixe exemple : `/api/v1`. Les IDs sont des strings (UUID ou codes stables).

### 5.1 Référentiels paramétrage

| Méthode | Chemin | Description |
|---------|--------|-------------|
| GET | `/menus` | Arbre menus |
| PUT | `/menus` | Remplacement arbre (admin) |
| GET | `/actions` | Catalogue actions |
| CRUD | `/profiles`, `/profiles/:id` | Profils autorisation |
| CRUD | `/entities`, `/entities/:id` | Entités |
| CRUD | `/specialties`, `/specialties/:id` | Spécialités |
| CRUD | `/applications`, `/applications/:id` | Applications |
| CRUD | `/jalons`, `/jalons/:id` | Jalons + liaison applications |
| GET | `/jalons/export.csv` | Équivalent export actuel |
| GET | `/jalons/import-template.csv` | Modèle |
| POST | `/jalons/import` | `multipart/form-data` fichier CSV |

### 5.2 Utilisateurs (ressources)

| Méthode | Chemin | Description |
|---------|--------|-------------|
| GET | `/users/me` | Utilisateur connecté + **`habilitations`** (menus + actions par menu, §3.1) |
| GET | `/users` | Liste (tri FR sur nom) |
| GET | `/users/:id` | Détail |
| POST | `/users` | Création (+ hash mot de passe si compte de connexion) |
| PATCH | `/users/:id` | Mise à jour |
| DELETE | `/users/:id` | Suppression (contrôler références planif / production) |

### 5.3 Production (par filière — ne pas fusionner les corps de requête)

Même famille d’URL possible avec `type` discriminant, ou routes séparées pour clarifier le backend.

| Filière | Exemple chemin | Ressource métier |
|---------|----------------|------------------|
| Projet | `GET/POST/PATCH/DELETE /production/projects` ou `...?type=PROJECT` | Champs §2.9.1 uniquement |
| Audit IT | `.../production/audits` ou `...?type=AUDIT` | Champs §2.10.1 uniquement |
| Veille | `.../production/engineering` ou `...?type=ENGINEERING` | Champs §2.11.1 uniquement |
| Monitoring | `...?type=MONITORING` | Champs §2.12.1 uniquement |

### 5.4 Planification (par filière — schémas distincts)

| Filière | Exemple chemin | Ressource métier |
|---------|----------------|------------------|
| Projet | `GET /plan-tasks/projects?...` ou `...?type=PROJECT` | Champs §2.9.2 uniquement |
| Audit IT | `...?type=AUDIT` | Champs §2.10.2 uniquement |
| Veille | `...?type=ENGINEERING` | Champs §2.11.2 uniquement |
| Monitoring | `...?type=MONITORING` | Champs §2.12.2 uniquement |

Opérations types : `GET` liste paginée + filtres (voir §7), `GET/:id`, `POST`, `PATCH/:id`, `DELETE/:id`. Le corps `POST`/`PATCH` ne doit contenir **que** les colonnes de la filière concernée.

### 5.5 Audit trail

| Méthode | Chemin | Description |
|---------|--------|-------------|
| GET | `/audit-trail?page=&pageSize=` | Liste paginée descendante (tri `timestamp` desc) |
| POST | `/audit-trail` | Réservé serveur (écriture après actions métier) ; le client ne l’appelle pas aujourd’hui |

---

## 6. Formats JSON — exemples minimaux (filières séparées)

Dates en **ISO 8601** (string) pour les API.

### 6.1 Projet — production puis planification

**Création fiche production projet** (pas de champs audit / veille ; `type` implicite si route dédiée `/production/projects`) :

```json
{
  "type": "PROJECT",
  "libelle": "Projet Alpha",
  "description": "...",
  "tpm": "user-uuid-chef-projet",
  "resourceIds": ["user-1", "user-2"]
}
```

**Création ligne planification projet** (sans entité ni équipement ni topic veille) :

```json
{
  "type": "PROJECT",
  "productionTypeLabel": "Projet",
  "projectId": "id-fiche-production-projet",
  "projectLabel": "Projet Alpha",
  "ownerId": "user-responsable",
  "startDate": "2026-05-01",
  "expectedEndDate": "2026-08-01",
  "actualEndDate": null,
  "progress": 35,
  "status": "IN_PROGRESS",
  "jalonId": "jalon-uuid",
  "subJalonId": "",
  "applicationId": "app-uuid",
  "specialtyId": "spec-uuid"
}
```

---

### 6.2 Audit IT — production puis planification

**Création fiche production audit** (pas de TPM, une ressource) :

```json
{
  "type": "AUDIT",
  "libelle": "Audit infrastructure 2026",
  "description": "...",
  "resourceIds": ["user-auditeur"]
}
```

**Création ligne planification audit** (champs matériel + spécialité ; pas de topic veille) :

```json
{
  "type": "AUDIT",
  "productionTypeLabel": "Audit IT",
  "projectId": "id-fiche-production-audit",
  "projectLabel": "Audit infrastructure 2026",
  "auditId": "id-fiche-production-audit",
  "specialtyId": "spec-uuid",
  "entityId": "ent-uuid",
  "ownerId": "user-uuid",
  "equipmentId": "EQ-001",
  "equipmentType": "SERVEUR",
  "locationType": "SITE",
  "equipmentIdentifier": "SRV-APP-01",
  "equipmentState": "FONCTIONNEL",
  "licenseStatus": "OUI"
}
```

---

### 6.3 Veille — production puis planification

**Création fiche production veille** :

```json
{
  "type": "ENGINEERING",
  "libelle": "Veille cybersécurité Q2",
  "description": "...",
  "resourceIds": ["user-ressource"]
}
```

**Création ligne planification veille** (identification, topic, source, maturité, etc. — pas de bloc équipement audit) :

```json
{
  "type": "ENGINEERING",
  "productionTypeLabel": "Veille / Ingenierie",
  "projectId": "id-fiche-veille",
  "projectLabel": "Veille cybersécurité Q2",
  "watchId": "id-fiche-veille",
  "identification": "REF-2026-042",
  "topic": "CYBERSECURITE",
  "source": "ARTICLE",
  "opportunity": "...",
  "maturityLevel": "VEILLE",
  "potentialImpact": "ELEVE",
  "specialtyId": "spec-uuid",
  "startDate": "2026-05-01",
  "expectedEndDate": "2026-06-01",
  "progress": 10,
  "status": "TODO",
  "jalonId": "jalon-uuid"
}
```

---

### 6.4 Monitoring

Aligner la **production** sur la même forme courte que la veille (une ressource) ; la **planification** sur le même style que le **projet** (jalon, spécialité, pas d’`application_id` obligatoire). Voir §2.12.

---

## 7. Pagination, tri et filtres (mode serveur recommandé)

Aujourd’hui le filtre tableau est encodé en JSON string (`utils/table-filter.ts`) avec notamment :

| Clé JSON | Usage |
|----------|--------|
| `q` | Recherche texte libre |
| `projectId` | ID fiche parent (planif.) |
| `specialty` | ID spécialité |
| `status` | Statut plan task |
| `extra` | Pour audits : `equipmentState` ; pour veille : `topic` |
| `entity`, `active`, `profileId`, `scope`, `entityRoot`, `entitySub` | Autres écrans / extensions |

**Query params API suggérés :**

- `page` (0-based) et `pageSize` (ex. 10, 25, 50)
- `sort` = champ, `direction` = `asc` | `desc`
- `q`, `type`, `projectId`, `specialtyId`, `status`, `equipmentState`, `topic`, …

**Réponse paginée type :**

```json
{
  "items": [ ... ],
  "total": 137,
  "page": 0,
  "pageSize": 10
}
```

**Planification — filtres par filière (ne pas les mélanger) :**

- **Projet / monitoring** : `projectId`, `specialty`, `status` ; si filtre `status === TODO`, traiter le bucket « NOK » comme `TODO` **ou** `CANCELLED`.
- **Audit** : `projectId`, `specialty`, `extra` = `equipment_state` (état équipement).
- **Veille** : `projectId`, `specialty`, `status`, `extra` = `topic`.
- **Recherche `q`** : champs différents selon filière (jalons, libellés, équipement pour audit, topic pour veille, etc.) — référence code `taskMatchesSearch` dans `planification-list.component.ts`.

**Production — filtres :**

- **Projets** : texte sur libellé, description, TPM, ressources.
- **Audits / veille / monitoring** : texte sur libellé, description, nom de la ressource unique (comportement actuel des listes).

---

## 8. Export / import / téléchargement

| Fonctionnalité | Écran | Implémentation actuelle | Backend attendu |
|----------------|-------|-------------------------|-----------------|
| Export CSV jalons | Paramétrage jalons | Génération client | `GET` CSV ou JSON + export BFF |
| Modèle CSV jalons | Idem | Fichier statique généré client | `GET` fichier modèle |
| Import CSV jalons | Idem | Parse minimal côté navigateur | `POST` import validé + rapport d’erreurs |
| Actions `EXPORT` / `IMPORT` / `DOWNLOAD_TEMPLATE` | Habilitations menu | Contrôle d’affichage boutons | Même matrice de droits côté API |

Aucun autre écran n’implémente export/import fichier dans le code parcouru ; les **permissions** existent pour extension future.

---

## 9. Enums et valeurs littérales (contrats)

- **ProductionType :** `PROJECT` | `AUDIT` | `ENGINEERING` | `MONITORING`
- **PlanTaskStatus :** `TODO` | `IN_PROGRESS` | `DONE` | `CANCELLED`
- **topic :** `IA` | `CYBERSECURITE` | `CLOUD` | `DATA` | `DEVOPS` | `AUTRE`
- **source :** `CONFERENCE` | `ARTICLE` | `PROJET_INTERNE` | `FORMATION` | `AUTRE`
- **maturityLevel :** `VEILLE` | `ETUDE` | `POC` | `DEVELOPPEMENT`
- **potentialImpact :** `ELEVE` | `MOYEN` | `FAIBLE`
- **equipmentType :** `PC` | `SERVEUR` | `VM`
- **locationType :** `CLOUD` | `SITE` | `BUREAU`
- **equipmentState :** `FONCTIONNEL` | `DEFAILLANT` | `HORS_SERVICE`
- **licenseStatus :** `OUI` | `NON` | `A_RENOUVELER`

---

## 10. Dashboard (agrégations)

Le tableau de bord affiche :

- Comptages **production** **séparés par filière** (`PROJECT`, `AUDIT`, `ENGINEERING`, etc.) et ressources uniques (TPM + ressources sur fiches — logique propre aux projets pour le TPM).
- Buckets planification **uniquement filière projet** (`type = PROJECT`) : `nok` = `TODO` + `CANCELLED`, `enCours` = `IN_PROGRESS`, `termines` = `DONE` (pas de mélange avec audit ou veille dans ce widget).

Endpoints agrégés possibles : `GET /dashboard/summary` avec sous-objets par filière si vous exposez le détail côté API.

---

## 11. Navigation et garde d’accès

Les routes applicatives vivent sous `MainShellComponent` ; la route `**` redirige vers `/login` dans `app.routes.ts` (comportement à durcir avec une **guard** `authGuard` + `redirectUrl` une fois le backend branché).

---

## 12. Checklist d’intégration frontend → backend

1. Remplacer `AuthService.login` par `HttpClient.post` vers `/auth/login`, stocker tokens + `user`.
2. Intercepteur HTTP : ajouter `Authorization` ; sur `401` tenter `refresh` puis retry ; sinon logout.
3. Remplacer lectures `localStorage` (`LS_PRODUCTION`, etc.) par services appelant les endpoints §5 ; respecter les **corps JSON par filière** (§6 et §2.9 à §2.12), sans envoyer un « méga-objet » commun à tous les types.
4. `SettingsService.loadLocalDefaults()` → `GET` initial bootstrap (`/menus`, `/actions`, `/profiles`, référentiels, utilisateur courant).
5. Journaliser côté serveur chaque mutation ; le client peut retirer les appels directs à `AuditTrailService` pour lecture seule depuis API.
6. Aligner les codes d’action (`AppAction.code`) avec les contrôles d’API (ou claims JWT).

---

## 13. Fichiers sources frontend de référence (modèle exact)

- Utilisateur / menu : `src/app/models/menu.ts`, `authorization.ts`, `settings-catalog.ts`, `production.ts`, `plan-task.ts`
- Services : `auth.service.ts`, `settings.service.ts`, `production.service.ts`, `planification.service.ts`, `audit-trail.service.ts`, `permission.service.ts`
- Filtres : `utils/table-filter.ts`
- Clés localStorage : `utils/local-storage-json.ts`
- Données démo : `data/local-app-defaults.ts`

---

*Document généré pour correspondre au code du dépôt frontend au moment de la rédaction. Adapter les URLs, versions (`/api/v1`) et choix SQL (JSON vs tables de liaison) à votre stack backend.*
