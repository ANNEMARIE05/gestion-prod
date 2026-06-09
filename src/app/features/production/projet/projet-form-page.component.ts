import { Component } from '@angular/core';
import { ProductionFormPageComponent } from '../components/production-form-page/production-form-page.component';

@Component({
  selector: 'app-projet-form-page',
  standalone: true,
  imports: [ProductionFormPageComponent],
  template: `<app-production-form-page typeInput="PROJECT"></app-production-form-page>`
})
export class ProjetFormPageComponent {}
