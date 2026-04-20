import { Component, OnInit, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Service, ServiceService } from '../../../../core/services/service.service';
import { ServiceFormComponent, ServiceFormResult } from '../service-form/service-form';

@Component({
  selector: 'app-service-list',
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
  ],
  templateUrl: './service-list.html',
  styleUrl: './service-list.css',
})
export class ServiceListComponent implements OnInit {
  private readonly service = inject(ServiceService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly isLoading = signal(true);
  protected readonly services = signal<Service[]>([]);
  protected readonly totalItems = signal(0);
  protected readonly pageSize = signal(15);
  protected readonly pageIndex = signal(0);
  protected readonly pageSizeOptions = [10, 15, 25, 50];
  protected readonly displayedColumns = ['code', 'name', 'type', 'unit', 'status', 'actions'];

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.service.getAll(this.pageIndex() + 1, this.pageSize()).subscribe({
      next: (res) => {
        this.services.set(res.services);
        this.totalItems.set(res.meta.total);
        this.isLoading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load services.', 'Dismiss', { duration: 4000 });
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
    const ref = this.dialog.open(ServiceFormComponent, {
      data: null,
      disableClose: true,
      maxWidth: '920px',
      width: '100%',
    });

    ref.afterClosed().subscribe((result: ServiceFormResult | undefined) => {
      if (result) {
        this.snackBar.open(
          `${result.count} service${result.count !== 1 ? 's' : ''} added.`,
          undefined,
          { duration: 3000 },
        );
        this.pageIndex.set(0);
        this.loadData();
      }
    });
  }

  protected openEditDialog(item: Service): void {
    const ref = this.dialog.open(ServiceFormComponent, {
      data: item,
      disableClose: true,
      maxWidth: '560px',
      width: '100%',
    });

    ref.afterClosed().subscribe((result: ServiceFormResult | undefined) => {
      if (result) {
        this.snackBar.open('Service updated.', undefined, { duration: 3000 });
        this.loadData();
      }
    });
  }

  protected isActive(item: Service): boolean {
    return item.status?.code === 'ACT';
  }
}
