import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Payment, PaymentService } from '../../../../core/services/payment.service';
import { PaymentFormComponent, PaymentFormResult } from '../payment-form/payment-form';

@Component({
  selector: 'app-payment-list',
  imports: [
    DatePipe,
    DecimalPipe,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
  ],
  templateUrl: './payment-list.html',
  styleUrl: './payment-list.css',
})
export class PaymentListComponent implements OnInit {
  private readonly paymentService = inject(PaymentService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly isLoading = signal(true);
  protected readonly payments = signal<Payment[]>([]);
  protected readonly totalItems = signal(0);
  protected readonly pageSize = signal(15);
  protected readonly pageIndex = signal(0);
  protected readonly pageSizeOptions = [10, 15, 25, 50];
  protected readonly displayedColumns = [
    'code', 'date', 'customer', 'amount', 'currency', 'payment_mode', 'recorded_by', 'actions',
  ];

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.paymentService.getAll(this.pageIndex() + 1, this.pageSize()).subscribe({
      next: (res) => {
        this.payments.set(res.payments);
        this.totalItems.set(res.meta.total);
        this.isLoading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load payments.', 'Dismiss', { duration: 4000 });
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
    const ref = this.dialog.open(PaymentFormComponent, {
      data: null,
      disableClose: true,
      maxWidth: '560px',
      width: '100%',
    });

    ref.afterClosed().subscribe((result: PaymentFormResult | undefined) => {
      if (result?.saved) {
        this.snackBar.open('Payment recorded.', undefined, { duration: 3000 });
        this.pageIndex.set(0);
        this.loadData();
      }
    });
  }

  protected printReceipt(payment: Payment): void {
    this.paymentService.getReceiptUrl(payment.id).subscribe({
      next: ({ url }) => window.open(url, '_blank'),
      error: () => this.snackBar.open('Could not generate receipt link.', 'Close', { duration: 3000 }),
    });
  }

  protected openEditDialog(item: Payment): void {
    const ref = this.dialog.open(PaymentFormComponent, {
      data: item,
      disableClose: true,
      maxWidth: '560px',
      width: '100%',
    });

    ref.afterClosed().subscribe((result: PaymentFormResult | undefined) => {
      if (result?.saved) {
        this.snackBar.open('Payment updated.', undefined, { duration: 3000 });
        this.loadData();
      }
    });
  }
}
