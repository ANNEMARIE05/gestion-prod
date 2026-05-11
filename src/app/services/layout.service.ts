import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  private static readonly STORAGE_KEY = 'sidebar_collapsed';

  sidebarCollapsed = signal<boolean>(this.readInitialState());

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

  private readInitialState(): boolean {
    try {
      const raw = localStorage.getItem(LayoutService.STORAGE_KEY);
      return raw === null ? false : JSON.parse(raw) === true;
    } catch {
      return false;
    }
  }
}
