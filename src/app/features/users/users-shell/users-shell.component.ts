import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-users-shell',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './users-shell.component.html',
  styleUrl: './users-shell.component.scss'
})
export class UsersShellComponent {}
