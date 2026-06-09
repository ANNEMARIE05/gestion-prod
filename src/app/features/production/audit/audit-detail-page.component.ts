import { Component } from '@angular/core';
import { ProductionDetailPageComponent } from '../components/production-detail-page/production-detail-page.component';

@Component({
  selector: 'app-audit-detail-page',
  standalone: true,
  imports: [ProductionDetailPageComponent],
  template: `<app-production-detail-page typeInput="AUDIT"></app-production-detail-page>`
})
export class AuditDetailPageComponent {}
