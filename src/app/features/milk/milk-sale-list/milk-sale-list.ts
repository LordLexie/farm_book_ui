import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MilkSale, MilkSaleService } from '../../../core/services/milk-sale.service';
import { MilkSaleFormComponent, MilkSaleFormResult } from '../milk-sale-form/milk-sale-form';

@Component({
  selector: 'app-milk-sale-list',
  imports: [
    DecimalPipe,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
  ],
  templateUrl: './milk-sale-list.html',
  styleUrl: './milk-sale-list.css',
})
export class MilkSaleListComponent implements OnInit {
  private readonly milkSaleService = inject(MilkSaleService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly isLoading = signal(true);
  protected readonly milkSales = signal<MilkSale[]>([]);
  protected readonly totalItems = signal(0);
  protected readonly pageSize = signal(15);
  protected readonly pageIndex = signal(0);
  protected readonly pageSizeOptions = [10, 15, 25, 50];
  protected readonly displayedColumns = [
    'code', 'date', 'customer', 'quantity', 'unit_price', 'total', 'balance', 'currency', 'recorded_by', 'actions',
  ];

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.milkSaleService.getAll(this.pageIndex() + 1, this.pageSize()).subscribe({
      next: (res) => {
        this.milkSales.set(res.milk_sales);
        this.totalItems.set(res.meta.total);
        this.isLoading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load milk sales.', 'Dismiss', { duration: 4000 });
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
    const ref = this.dialog.open(MilkSaleFormComponent, {
      data: null,
      disableClose: true,
      maxWidth: '560px',
      width: '100%',
    });

    ref.afterClosed().subscribe((result: MilkSaleFormResult | undefined) => {
      if (result?.saved) {
        this.snackBar.open('Milk sale recorded.', undefined, { duration: 3000 });
        this.pageIndex.set(0);
        this.loadData();
      }
    });
  }

  protected openEditDialog(item: MilkSale): void {
    const ref = this.dialog.open(MilkSaleFormComponent, {
      data: item,
      disableClose: true,
      maxWidth: '560px',
      width: '100%',
    });

    ref.afterClosed().subscribe((result: MilkSaleFormResult | undefined) => {
      if (result?.saved) {
        this.snackBar.open('Milk sale updated.', undefined, { duration: 3000 });
        this.pageIndex.set(0);
        this.loadData();
      }
    });
  }
}
