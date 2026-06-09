import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { LoaderComponent } from './shared/components/loader/loader.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, LoaderComponent],
  template: `
    <app-loader></app-loader>
    <router-outlet></router-outlet>
  `,
})
export class AppComponent {
  title = 'gestion-de-prod';
}
