import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe, SlicePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Invoice, InvoiceCustomer, InvoiceService } from '../../../../core/services/invoice.service';
import { InvoiceFormComponent, InvoiceFormResult } from '../invoice-form/invoice-form';
import { AuthService } from '../../../../core/services/auth.service';
import { DeliveryNoteActions } from '../../delivery-notes/delivery-note-actions';

@Component({
  selector: 'app-invoice-list',
  imports: [DecimalPipe, SlicePipe, MatTableModule, MatButtonModule, MatIconModule, MatMenuModule, MatProgressSpinnerModule, MatPaginatorModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './invoice-list.html',
  styleUrl: './invoice-list.css',
})
export class InvoiceListComponent implements OnInit {
  private readonly invoiceService = inject(InvoiceService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly router = inject(Router);
  protected readonly auth = inject(AuthService);
  private readonly deliveryNoteActions = inject(DeliveryNoteActions);

  protected readonly isLoading = signal(true);
  protected readonly invoices = signal<Invoice[]>([]);
  protected readonly totalItems = signal(0);
  protected readonly pageSize = signal(15);
  protected readonly pageIndex = signal(0);
  protected readonly printingId = signal<number | null>(null);
  protected readonly creatingDnId = signal<number | null>(null);
  protected readonly pageSizeOptions = [10, 15, 25, 50];
  protected readonly displayedColumns = ['code', 'date', 'customer', 'items', 'total', 'balance', 'status', 'actions'];

  // Filters
  protected readonly customers = signal<InvoiceCustomer[]>([]);
  protected readonly customerSearch = signal('');
  protected readonly filteredCustomers = computed(() => {
    const q = this.customerSearch().toLowerCase();
    return q ? this.customers().filter((c) => c.name.toLowerCase().includes(q)) : this.customers();
  });
  protected readonly customerId = signal<number | null>(null);
  protected readonly dateFrom = signal('');
  protected readonly dateTo = signal('');
  protected readonly hasFilters = computed(() => !!this.customerId() || !!this.dateFrom() || !!this.dateTo());

  ngOnInit(): void {
    this.invoiceService.getCustomers().subscribe({
      next: (res) => this.customers.set(res.customers),
    });
    this.loadData();
  }

  protected onFilterChange(): void {
    this.pageIndex.set(0);
    this.loadData();
  }

  protected clearFilters(): void {
    this.customerId.set(null);
    this.dateFrom.set('');
    this.dateTo.set('');
    this.onFilterChange();
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.invoiceService
      .getAll(this.pageIndex() + 1, this.pageSize(), {
        customer_id: this.customerId(),
        date_from: this.dateFrom(),
        date_to: this.dateTo(),
      })
      .subscribe({
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

  protected createDeliveryNote(item: Invoice): void {
    this.creatingDnId.set(item.id);
    this.deliveryNoteActions.createFromInvoice(item.id, () => this.creatingDnId.set(null));
  }

  protected isActive(item: Invoice): boolean {
    return item.status?.code === 'ACT';
  }

  protected printInvoice(item: Invoice): void {
    this.printingId.set(item.id);
    this.invoiceService.getPrintUrl(item.id).subscribe({
      next: ({ url }) => {
        this.printingId.set(null);
        window.open(url, '_blank');
      },
      error: () => {
        this.printingId.set(null);
        this.snackBar.open('Failed to get print URL.', 'Dismiss', { duration: 4000 });
      },
    });
  }
}
