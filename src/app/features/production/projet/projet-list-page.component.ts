import { Component } from '@angular/core';
import { ProductionComponent } from '../components/production.component';

@Component({
  selector: 'app-projet-list-page',
  standalone: true,
  imports: [ProductionComponent],
  template: `<app-production typeInput="PROJECT"></app-production>`
})
export class ProjetListPageComponent {}
