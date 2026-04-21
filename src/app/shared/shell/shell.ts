import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BreakpointObserver } from '@angular/cdk/layout';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class ShellComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected isMobile = signal(false);
  protected sidenavOpen = signal(true);

  protected mastersOpen = false;
  protected expensesOpen = false;
  protected salesOpen = false;
  protected reportsOpen = false;
  protected accessControlOpen = false;

  constructor() {
    inject(BreakpointObserver)
      .observe(['(max-width: 768px)'])
      .pipe(takeUntilDestroyed())
      .subscribe(result => {
        this.isMobile.set(result.matches);
        this.sidenavOpen.set(!result.matches);
      });
  }

  protected toggleSidenav(): void {
    this.sidenavOpen.set(!this.sidenavOpen());
  }

  protected closeOnMobile(): void {
    if (this.isMobile()) this.sidenavOpen.set(false);
  }

  protected toggleMasters(): void {
    this.mastersOpen = !this.mastersOpen;
  }

  protected toggleExpenses(): void {
    this.expensesOpen = !this.expensesOpen;
  }

  protected toggleSales(): void {
    this.salesOpen = !this.salesOpen;
  }

  protected toggleReports(): void {
    this.reportsOpen = !this.reportsOpen;
  }

  protected toggleAccessControl(): void {
    this.accessControlOpen = !this.accessControlOpen;
  }

  logout(): void {
    this.auth.logout().subscribe({
      complete: () => this.router.navigate(['/login']),
      error: () => {
        this.auth.clearToken();
        this.router.navigate(['/login']);
      },
    });
  }
}
