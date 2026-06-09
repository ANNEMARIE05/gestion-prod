import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { AuthStateService } from './auth-state.service';
import { getLandingRoute } from '../utils/app-routes';

@Injectable({
  providedIn: 'root',
})
export class LoginRedirectGuard implements CanActivate {
  constructor(
    private authState: AuthStateService,
    private router: Router,
  ) {}

  canActivate(
    _route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot,
  ): boolean | UrlTree {
    if (!this.authState.isLoggedIn()) {
      return true;
    }
    return this.router.parseUrl(getLandingRoute(this.authState.userInfos()));
  }
}
