import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect } from '@angular/core';
import { PermissionService } from '../../core/services/permission.service';

@Directive({
  selector: '[appHasPermission]',
  standalone: true,
})
export class HasPermissionDirective {
  private permissionService = inject(PermissionService);
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);

  private hasView = false;
  private actionCode = '';

  @Input('appHasPermission') set hasPermission(action: string) {
    this.actionCode = action;
    this.updateView();
  }

  constructor() {
    // Réaction automatique aux changements de route/menu
    effect(() => {
      this.permissionService.currentMenuCode();
      this.updateView();
    });
  }

  private updateView(): void {
    if (!this.actionCode) {
      this.clearView();
      return;
    }

    const hasPerm = this.permissionService.canPerformAction(this.actionCode);
    if (hasPerm && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasPerm && this.hasView) {
      this.clearView();
    }
  }

  private clearView(): void {
    this.viewContainer.clear();
    this.hasView = false;
  }
}
