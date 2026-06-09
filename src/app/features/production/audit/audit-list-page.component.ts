import { Component } from '@angular/core';
import { ProductionComponent } from '../components/production.component';

@Component({
  selector: 'app-audit-list-page',
  standalone: true,
  imports: [ProductionComponent],
  template: `<app-production typeInput="AUDIT"></app-production>`
})
export class AuditListPageComponent {}
