import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  DELIVERY_STATUSES,
  DeliveryNote,
  DeliveryNoteCustomer,
  DeliveryNoteService,
  DeliveryStatus,
} from '../../../../core/services/delivery-note.service';
import { AuthService } from '../../../../core/services/auth.service';
import { DeliveryNoteActions, canCancel, deliveryStatusLabel } from '../delivery-note-actions';

@Component({
  selector: 'app-delivery-note-list',
  imports: [
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './delivery-note-list.html',
  styleUrl: './delivery-note-list.css',
})
export class DeliveryNoteListComponent implements OnInit {
  private readonly service = inject(DeliveryNoteService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  protected readonly actions = inject(DeliveryNoteActions);
  protected readonly auth = inject(AuthService);

  protected readonly isLoading = signal(true);
  protected readonly notes = signal<DeliveryNote[]>([]);
  protected readonly totalItems = signal(0);
  protected readonly pageSize = signal(15);
  protected readonly pageIndex = signal(0);
  protected readonly pageSizeOptions = [10, 15, 25, 50];
  protected readonly statuses = DELIVERY_STATUSES;
  protected readonly statusLabel = deliveryStatusLabel;
  protected readonly canCancel = canCancel;
  protected readonly displayedColumns = [
    'code',
    'date',
    'customer',
    'invoice',
    'items',
    'delivered_by',
    'vehicle',
    'status',
    'actions',
  ];

  // Filters
  protected readonly customers = signal<DeliveryNoteCustomer[]>([]);
  protected readonly customerSearch = signal('');
  protected readonly filteredCustomers = computed(() => {
    const q = this.customerSearch().toLowerCase();
    return q ? this.customers().filter((c) => c.name.toLowerCase().includes(q)) : this.customers();
  });
  protected readonly customerId = signal<number | null>(null);
  protected readonly status = signal<DeliveryStatus | null>(null);
  protected readonly dateFrom = signal('');
  protected readonly dateTo = signal('');
  protected readonly hasFilters = computed(
    () => !!this.customerId() || !!this.status() || !!this.dateFrom() || !!this.dateTo(),
  );

  protected get canManage(): boolean {
    return this.auth.hasPermission('manage delivery-notes');
  }

  ngOnInit(): void {
    this.service.getCustomers().subscribe({
      next: (res) => this.customers.set(res.customers),
    });
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.service
      .getAll(this.pageIndex() + 1, this.pageSize(), {
        customer_id: this.customerId(),
        status: this.status(),
        date_from: this.dateFrom(),
        date_to: this.dateTo(),
      })
      .subscribe({
        next: (res) => {
          this.notes.set(res.delivery_notes);
          this.totalItems.set(res.meta.total);
          this.isLoading.set(false);
        },
        error: () => {
          this.snackBar.open('Failed to load delivery notes.', 'Dismiss', { duration: 4000 });
          this.isLoading.set(false);
        },
      });
  }

  protected onFilterChange(): void {
    this.pageIndex.set(0);
    this.loadData();
  }

  protected clearFilters(): void {
    this.customerId.set(null);
    this.status.set(null);
    this.dateFrom.set('');
    this.dateTo.set('');
    this.onFilterChange();
  }

  protected onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadData();
  }

  protected view(note: DeliveryNote): void {
    this.router.navigate(['/sales/delivery-notes', note.id]);
  }

  protected cancel(note: DeliveryNote): void {
    this.actions.cancel(note).subscribe((n) => this.replace(n));
  }

  /** Swap an updated note into the current page without reloading. */
  private replace(updated: DeliveryNote): void {
    this.notes.update((list) => list.map((n) => (n.id === updated.id ? updated : n)));
  }
}
