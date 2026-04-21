import { Component, OnInit, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppUser, UserService } from '../../../../core/services/user.service';
import { UserFormComponent } from '../user-form/user-form';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-user-list',
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
  ],
  templateUrl: './user-list.html',
  styleUrl: './user-list.css',
})
export class UserListComponent implements OnInit {
  private readonly service = inject(UserService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly auth = inject(AuthService);

  protected readonly isLoading = signal(true);
  protected readonly users = signal<AppUser[]>([]);
  protected readonly totalItems = signal(0);
  protected readonly pageSize = signal(15);
  protected readonly pageIndex = signal(0);
  protected readonly pageSizeOptions = [10, 15, 25, 50];
  protected readonly displayedColumns = ['name', 'email', 'role', 'actions'];

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.service.getAll(this.pageIndex() + 1, this.pageSize()).subscribe({
      next: (res) => {
        this.users.set(res.users);
        this.totalItems.set(res.meta.total);
        this.isLoading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load users.', 'Dismiss', { duration: 4000 });
        this.isLoading.set(false);
      },
    });
  }

  protected onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadData();
  }

  protected openAddDialog(): void {
    const ref = this.dialog.open(UserFormComponent, {
      data: null,
      disableClose: true,
      width: '480px',
    });

    ref.afterClosed().subscribe((result: AppUser | undefined) => {
      if (result) {
        this.snackBar.open('User created.', undefined, { duration: 3000 });
        this.loadData();
      }
    });
  }

  protected openEditDialog(user: AppUser): void {
    const ref = this.dialog.open(UserFormComponent, {
      data: user,
      disableClose: true,
      width: '480px',
    });

    ref.afterClosed().subscribe((result: AppUser | undefined) => {
      if (result) {
        this.snackBar.open('User updated.', undefined, { duration: 3000 });
        this.loadData();
      }
    });
  }

  protected userRole(user: AppUser): string {
    return user.roles[0]?.name ?? '—';
  }
}
