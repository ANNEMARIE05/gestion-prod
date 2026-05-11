import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ProfilsListComponent } from '../profils-list/profils-list.component';

@Component({
  selector: 'app-profils-page',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, ProfilsListComponent],
  templateUrl: './profils-page.component.html',
  styleUrl: './profils-page.component.scss',
})
export class ProfilsPageComponent {}
