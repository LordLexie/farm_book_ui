import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
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
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected mastersOpen = false;
  protected expensesOpen = false;
  protected salesOpen = false;
  protected reportsOpen = false;
  protected accessControlOpen = false;

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
