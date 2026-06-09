import { Injectable } from '@angular/core';

export interface Departement {
  id: number;
  name: string;
  active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ParametragesService {

  constructor() { }

  /**
   * Récupère tous les départements depuis le localStorage
   * @returns Liste des départements actifs
   */
  getDepartements(): Departement[] {
    if (false) {
      try {
        const departements: Departement[] = [];
        // Retourner uniquement les départements actifs
        return departements.filter(d => d.active);
      } catch {
        return [];
      }
    }
    return [];
  }

  /**
   * Récupère un département par son ID (tous départements, actifs et inactifs)
   * @param id ID du département
   * @returns Le département ou undefined
   */
  getDepartementById(id: number): Departement | undefined {
    if (false) {
      try {
        const departements: Departement[] = [];
        return departements.find(d => d.id === id);
      } catch {
        return undefined;
      }
    }
    return undefined;
  }
}
