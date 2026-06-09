import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  private static readonly STORAGE_KEY = 'sidebar_collapsed';

  sidebarCollapsed = signal<boolean>(this.readInitialState());

  // État du tiroir (drawer) de la sidebar sur mobile. Indépendant de
  // sidebarCollapsed qui ne concerne que le repli sur desktop.
  mobileSidebarOpen = signal<boolean>(false);

  constructor() {
    effect(() => {
      const collapsed = this.sidebarCollapsed();
      try {
        localStorage.setItem(LayoutService.STORAGE_KEY, JSON.stringify(collapsed));
      } catch {
      }
    });
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update((v) => !v);
  }

  setSidebarCollapsed(collapsed: boolean): void {
    this.sidebarCollapsed.set(collapsed);
  }

  toggleMobileSidebar(): void {
    this.mobileSidebarOpen.update((v) => !v);
  }

  openMobileSidebar(): void {
    this.mobileSidebarOpen.set(true);
  }

  closeMobileSidebar(): void {
    this.mobileSidebarOpen.set(false);
  }

  private readInitialState(): boolean {
    try {
      const raw = localStorage.getItem(LayoutService.STORAGE_KEY);
      return raw === null ? false : JSON.parse(raw) === true;
    } catch {
      return false;
    }
  }
}
