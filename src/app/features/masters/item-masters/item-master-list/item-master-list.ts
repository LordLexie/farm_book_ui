import { Component, OnInit, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { ItemMaster, ItemMasterService } from '../../../../core/services/item-master.service';
import { ItemMasterFormComponent, ItemMasterFormResult } from '../item-master-form/item-master-form';

@Component({
  selector: 'app-item-master-list',
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatChipsModule,
  ],
  templateUrl: './item-master-list.html',
  styleUrl: './item-master-list.css',
})
export class ItemMasterListComponent implements OnInit {
  private readonly service = inject(ItemMasterService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly isLoading = signal(true);
  protected readonly itemMasters = signal<ItemMaster[]>([]);
  protected readonly totalItems = signal(0);
  protected readonly pageSize = signal(15);
  protected readonly pageIndex = signal(0);
  protected readonly pageSizeOptions = [10, 15, 25, 50];
  protected readonly displayedColumns = ['code', 'name', 'category', 'unit_of_measure', 'description', 'actions'];

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.service.getAll(this.pageIndex() + 1, this.pageSize()).subscribe({
      next: (res) => {
        this.itemMasters.set(res.item_masters);
        this.totalItems.set(res.meta.total);
        this.isLoading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load item masters.', 'Dismiss', { duration: 4000 });
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
    const ref = this.dialog.open(ItemMasterFormComponent, {
      data: null,
      disableClose: true,
      maxWidth: '800px',
      width: '100%',
    });

    ref.afterClosed().subscribe((result: ItemMasterFormResult | undefined) => {
      if (result) {
        this.snackBar.open(
          `${result.count} item master${result.count !== 1 ? 's' : ''} created.`,
          undefined,
          { duration: 3000 },
        );
        this.pageIndex.set(0);
        this.loadData();
      }
    });
  }

  protected openEditDialog(item: ItemMaster): void {
    const ref = this.dialog.open(ItemMasterFormComponent, {
      data: item,
      disableClose: true,
    });

    ref.afterClosed().subscribe((result: ItemMasterFormResult | undefined) => {
      if (result) {
        this.snackBar.open('Item master updated.', undefined, { duration: 3000 });
        this.loadData();
      }
    });
  }
}
