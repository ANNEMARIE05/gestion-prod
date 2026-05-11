export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  children?: MenuItem[];
  permissions?: string[];
  active: boolean;
}

export interface User {
  id: string;
  /** Nom complet affiché (liste, affectations). */
  name: string;
  lastName: string;
  firstName: string;
  email: string;
  /** Référence au profil d’habilitation (menus + actions). */
  profileId: string;
  entityId: string;
  specialtyId: string;
  avatar?: string;
  /** Téléphone ou autre moyen de contact (optionnel). */
  contact?: string;
}
