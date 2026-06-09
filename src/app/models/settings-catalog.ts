/** Référentiels paramétrage (entités, spécialités, applications, jalons). */

export interface Entity {
  id: string;
  code?: string;
  name: string;
  icon: string;
  active: boolean;
  parentId?: string;
  children?: Entity[];
  createdAt?: Date;
}

export interface Specialty {
  id: string;
  code?: string;
  label: string;
  icon: string;
  active: boolean;
  createdAt?: Date;
}

export interface Application {
  id: string;
  code: string;
  label: string;
  description?: string;
  active: boolean;
  createdAt?: Date;
  createdBy?: string;
}

export interface Jalon {
  id: string;
  code: string;
  label: string;
  parentId?: string;
  applicationIds?: string[];
  createdAt?: Date;
  createdBy?: string;
}
