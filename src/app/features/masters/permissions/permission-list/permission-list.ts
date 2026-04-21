import { Component, OnInit, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Permission, PermissionService } from '../../../../core/services/permission.service';
import { PermissionFormComponent } from '../permission-form/permission-form';

@Component({
  selector: 'app-permission-list',
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
  ],
  templateUrl: './permission-list.html',
  styleUrl: './permission-list.css',
})
export class PermissionListComponent implements OnInit {
  private readonly service = inject(PermissionService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly isLoading = signal(true);
  protected readonly permissions = signal<Permission[]>([]);
  protected readonly totalItems = signal(0);
  protected readonly pageSize = signal(15);
  protected readonly pageIndex = signal(0);
  protected readonly pageSizeOptions = [10, 15, 25, 50];
  protected readonly displayedColumns = ['name', 'guard_name', 'actions'];

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.service.getAll(this.pageIndex() + 1, this.pageSize()).subscribe({
      next: (res) => {
        this.permissions.set(res.permissions);
        this.totalItems.set(res.meta.total);
        this.isLoading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load permissions.', 'Dismiss', { duration: 4000 });
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
    const ref = this.dialog.open(PermissionFormComponent, {
      data: null,
      disableClose: true,
      width: '440px',
    });

    ref.afterClosed().subscribe((result: Permission | undefined) => {
      if (result) {
        this.snackBar.open('Permission created.', undefined, { duration: 3000 });
        this.loadData();
      }
    });
  }

  protected openEditDialog(permission: Permission): void {
    const ref = this.dialog.open(PermissionFormComponent, {
      data: permission,
      disableClose: true,
      width: '440px',
    });

    ref.afterClosed().subscribe((result: Permission | undefined) => {
      if (result) {
        this.snackBar.open('Permission updated.', undefined, { duration: 3000 });
        this.loadData();
      }
    });
  }
}
