import { Component } from '@angular/core';
import { ProductionComponent } from '../components/production.component';

@Component({
  selector: 'app-veille-list-page',
  standalone: true,
  imports: [ProductionComponent],
  template: `<app-production typeInput="ENGINEERING"></app-production>`
})
export class VeilleListPageComponent {}
