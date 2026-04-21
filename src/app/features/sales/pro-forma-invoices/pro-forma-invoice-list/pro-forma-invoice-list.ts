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
import { ProFormaInvoice, ProFormaInvoiceService } from '../../../../core/services/pro-forma-invoice.service';
import { ProFormaInvoiceFormComponent, ProFormaInvoiceFormResult } from '../pro-forma-invoice-form/pro-forma-invoice-form';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-pro-forma-invoice-list',
  imports: [DecimalPipe, SlicePipe, MatTableModule, MatButtonModule, MatIconModule, MatMenuModule, MatProgressSpinnerModule, MatPaginatorModule],
  templateUrl: './pro-forma-invoice-list.html',
  styleUrl: './pro-forma-invoice-list.css',
})
export class ProFormaInvoiceListComponent implements OnInit {
  private readonly service = inject(ProFormaInvoiceService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  protected readonly isLoading = signal(true);
  protected readonly isConverting = signal<number | null>(null);
  protected readonly items = signal<ProFormaInvoice[]>([]);
  protected readonly totalItems = signal(0);
  protected readonly pageSize = signal(15);
  protected readonly pageIndex = signal(0);
  protected readonly pageSizeOptions = [10, 15, 25, 50];
  protected readonly displayedColumns = ['code', 'date', 'customer', 'items', 'total', 'status', 'actions'];

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.service.getAll(this.pageIndex() + 1, this.pageSize()).subscribe({
      next: (res) => {
        this.items.set(res.pro_forma_invoices);
        this.totalItems.set(res.meta.total);
        this.isLoading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load pro forma invoices.', 'Dismiss', { duration: 4000 });
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
    const ref = this.dialog.open(ProFormaInvoiceFormComponent, {
      data: null,
      disableClose: true,
      maxWidth: '860px',
      width: '100%',
    });

    ref.afterClosed().subscribe((result: ProFormaInvoiceFormResult | undefined) => {
      if (result?.saved) {
        this.snackBar.open('Pro forma invoice created.', undefined, { duration: 3000 });
        this.pageIndex.set(0);
        this.loadData();
      }
    });
  }

  protected convert(item: ProFormaInvoice): void {
    this.isConverting.set(item.id);
    this.service.convert(item.id).subscribe({
      next: (res) => {
        this.isConverting.set(null);
        this.snackBar.open('Converted to invoice ' + res.invoice.code, undefined, { duration: 4000 });
        this.router.navigate(['/sales/invoices', res.invoice.id]);
      },
      error: () => {
        this.isConverting.set(null);
        this.snackBar.open('Failed to convert pro forma.', 'Dismiss', { duration: 4000 });
      },
    });
  }

  protected isActive(item: ProFormaInvoice): boolean {
    return item.status?.code === 'ACT';
  }
}
