import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ModuleDisabledGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    // Route is disabled, redirect user to dashboard
    this.router.navigate(['/admin/dashboard']);
    return false;
  }
}
