import { Component } from '@angular/core';
import { ProductionFormPageComponent } from '../components/production-form-page/production-form-page.component';

@Component({
  selector: 'app-audit-form-page',
  standalone: true,
  imports: [ProductionFormPageComponent],
  template: `<app-production-form-page typeInput="AUDIT"></app-production-form-page>`
})
export class AuditFormPageComponent {}
