import { Injectable } from '@angular/core';

/**
 * Service pour nettoyer toutes les données stockées dans localStorage
 * Permet de vider toutes les tables de l'application
 */
@Injectable({
  providedIn: 'root'
})
export class DataCleanupService {
  
  /**
   * Liste de toutes les clés localStorage utilisées dans l'application
   */
  private readonly localStorageKeys: string[] = [
    // Productions
    'productions_ingenierie',
    'productions_audits',
    'applications',
    'projets',
    
    // Paramétrages
    'services',
    'jalons',
    'technologies',
    'actions',
    'specialitesTechniques',
    'menus',
    
    // Utilisateurs
    'ressources',
    'profils',
    'habilitations',
    
    // Piste d'audit
    'piste_audit',
    'audit_trail',
    
    // Planifications (si stockées)
    'planifications_projets',
    'planifications_audits',
    'planifications_ingenierie'
  ];

  /**
   * Vide toutes les données des tables de l'application
   * @param preserveCodes Si true, préserve les clés de codes générés (lastCode_*)
   */
  clearAllTables(preserveCodes: boolean = true): void {
    // Vider toutes les clés identifiées
    this.localStorageKeys.forEach(key => {
      localStorage.removeItem(key);
    });

    // Vider toutes les autres clés de l'application (sauf les codes si demandé)
    if (!preserveCodes) {
      this.clearAllLocalStorageKeys();
    } else {
      // Vider uniquement les clés spécifiques, pas les codes
      this.clearCodesOnly();
    }

    console.log('✅ Toutes les données des tables ont été vidées');
  }

  /**
   * Vide toutes les clés localStorage (sans exception)
   */
  clearAllLocalStorageKeys(): void {
    const keysToRemove: string[] = [];
    
    // Collecter toutes les clés
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        keysToRemove.push(key);
      }
    }
    
    // Supprimer toutes les clés
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log(`✅ ${keysToRemove.length} clé(s) localStorage supprimée(s)`);
  }

  /**
   * Vide uniquement les clés de codes générés (lastCode_*)
   */
  clearCodesOnly(): void {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('lastCode_')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    if (keysToRemove.length > 0) {
      console.log(`✅ ${keysToRemove.length} clé(s) de code(s) supprimée(s)`);
    }
  }

  /**
   * Vide une table spécifique par sa clé
   */
  clearTable(tableKey: string): void {
    localStorage.removeItem(tableKey);
    console.log(`✅ Table "${tableKey}" vidée`);
  }

  /**
   * Liste toutes les clés localStorage actuellement stockées
   */
  listAllKeys(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        keys.push(key);
      }
    }
    return keys;
  }

  /**
   * Compte le nombre d'éléments dans une table
   */
  getTableCount(tableKey: string): number {
    const data = localStorage.getItem(tableKey);
    if (!data) {
      return 0;
    }
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Affiche un rapport des données actuellement stockées
   */
  showDataReport(): void {
    console.group('📊 Rapport des données localStorage');
    const keys = this.listAllKeys();
    
    if (keys.length === 0) {
      console.log('Aucune donnée stockée');
    } else {
      keys.forEach(key => {
        const count = this.getTableCount(key);
        const size = new Blob([localStorage.getItem(key) || '']).size;
        console.log(`- ${key}: ${count} élément(s) (${size} bytes)`);
      });
    }
    console.groupEnd();
  }
}