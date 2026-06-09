import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthStateService } from '../../services/auth-state.service';
import { APP_ROUTES, getLandingRoute } from '../../utils/app-routes';

@Component({
  selector: 'app-home-redirect',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center p-4 text-slate-600">
      Redirection...
    </div>
  `,
})
export class HomeRedirectComponent implements OnInit {
  private router = inject(Router);
  private authState = inject(AuthStateService);

  ngOnInit(): void {
    const destination = this.authState.isLoggedIn()
      ? getLandingRoute(this.authState.userInfos())
      : APP_ROUTES.login;
    void this.router.navigate([destination], { replaceUrl: true });
  }
}
