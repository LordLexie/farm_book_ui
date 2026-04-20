import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe, SlicePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Invoice, InvoiceService } from '../../../../core/services/invoice.service';
import { InvoiceFormComponent, InvoiceFormResult } from '../invoice-form/invoice-form';

@Component({
  selector: 'app-invoice-list',
  imports: [DecimalPipe, SlicePipe, MatTableModule, MatButtonModule, MatIconModule, MatMenuModule, MatProgressSpinnerModule, MatPaginatorModule],
  templateUrl: './invoice-list.html',
  styleUrl: './invoice-list.css',
})
export class InvoiceListComponent implements OnInit {
  private readonly invoiceService = inject(InvoiceService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly router = inject(Router);

  protected readonly isLoading = signal(true);
  protected readonly invoices = signal<Invoice[]>([]);
  protected readonly totalItems = signal(0);
  protected readonly pageSize = signal(15);
  protected readonly pageIndex = signal(0);
  protected readonly pageSizeOptions = [10, 15, 25, 50];
  protected readonly displayedColumns = ['code', 'date', 'customer', 'items', 'total', 'balance', 'status', 'actions'];

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.invoiceService.getAll(this.pageIndex() + 1, this.pageSize()).subscribe({
      next: (res) => {
        this.invoices.set(res.invoices);
        this.totalItems.set(res.meta.total);
        this.isLoading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load invoices.', 'Dismiss', { duration: 4000 });
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
    const ref = this.dialog.open(InvoiceFormComponent, {
      data: null,
      disableClose: true,
      maxWidth: '860px',
      width: '100%',
    });

    ref.afterClosed().subscribe((result: InvoiceFormResult | undefined) => {
      if (result) {
        this.snackBar.open('Invoice created.', undefined, { duration: 3000 });
        this.pageIndex.set(0);
        this.loadData();
      }
    });
  }

  protected navigateToEdit(item: Invoice): void {
    this.router.navigate(['/sales/invoices', item.id, 'edit']);
  }

  protected navigateToView(item: Invoice): void {
    this.router.navigate(['/sales/invoices', item.id]);
  }

  protected isActive(item: Invoice): boolean {
    return item.status?.code === 'ACT';
  }
}
