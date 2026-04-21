import { Component, OnInit, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FarmItem, FarmItemService } from '../../../../core/services/farm-item.service';
import { FarmItemFormComponent, FarmItemFormResult } from '../farm-item-form/farm-item-form';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-farm-item-list',
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
  ],
  templateUrl: './farm-item-list.html',
  styleUrl: './farm-item-list.css',
})
export class FarmItemListComponent implements OnInit {
  private readonly service = inject(FarmItemService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly auth = inject(AuthService);

  protected readonly isLoading = signal(true);
  protected readonly farmItems = signal<FarmItem[]>([]);
  protected readonly totalItems = signal(0);
  protected readonly pageSize = signal(15);
  protected readonly pageIndex = signal(0);
  protected readonly pageSizeOptions = [10, 15, 25, 50];
  protected readonly displayedColumns = ['code', 'farm', 'item', 'quantity', 'status', 'actions'];

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.service.getAll(this.pageIndex() + 1, this.pageSize()).subscribe({
      next: (res) => {
        this.farmItems.set(res.farm_items);
        this.totalItems.set(res.meta.total);
        this.isLoading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load farm items.', 'Dismiss', { duration: 4000 });
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
    const ref = this.dialog.open(FarmItemFormComponent, {
      data: null,
      disableClose: true,
      maxWidth: '720px',
      width: '100%',
    });

    ref.afterClosed().subscribe((result: FarmItemFormResult | undefined) => {
      if (result) {
        this.snackBar.open(
          `${result.count} farm item${result.count !== 1 ? 's' : ''} added.`,
          undefined,
          { duration: 3000 },
        );
        this.pageIndex.set(0);
        this.loadData();
      }
    });
  }

  protected openEditDialog(item: FarmItem): void {
    const ref = this.dialog.open(FarmItemFormComponent, {
      data: item,
      disableClose: true,
      maxWidth: '720px',
      width: '100%',
    });

    ref.afterClosed().subscribe((result: FarmItemFormResult | undefined) => {
      if (result) {
        this.snackBar.open('Farm item updated.', undefined, { duration: 3000 });
        this.loadData();
      }
    });
  }

  protected isActive(item: FarmItem): boolean {
    return item.status?.code === 'ACT';
  }
}
