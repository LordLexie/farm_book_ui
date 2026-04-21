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
import { Customer, CustomerService } from '../../../../core/services/customer.service';
import { CustomerFormComponent, CustomerFormResult } from '../customer-form/customer-form';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-customer-list',
  imports: [DecimalPipe, MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule, MatProgressSpinnerModule, MatPaginatorModule],
  templateUrl: './customer-list.html',
  styleUrl: './customer-list.css',
})
export class CustomerListComponent implements OnInit {
  private readonly customerService = inject(CustomerService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly auth = inject(AuthService);

  protected readonly isLoading = signal(true);
  protected readonly customers = signal<Customer[]>([]);
  protected readonly totalItems = signal(0);
  protected readonly pageSize = signal(15);
  protected readonly pageIndex = signal(0);
  protected readonly pageSizeOptions = [10, 15, 25, 50];
  protected readonly displayedColumns = ['code', 'type', 'name', 'email', 'phone', 'amount_due', 'credit', 'status', 'actions'];

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.customerService.getAll(this.pageIndex() + 1, this.pageSize()).subscribe({
      next: (res) => {
        this.customers.set(res.customers);
        this.totalItems.set(res.meta.total);
        this.isLoading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load customers.', 'Dismiss', { duration: 4000 });
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
    const ref = this.dialog.open(CustomerFormComponent, {
      data: null,
      disableClose: true,
      maxWidth: '680px',
      width: '100%',
    });

    ref.afterClosed().subscribe((result: CustomerFormResult | undefined) => {
      if (result) {
        this.snackBar.open('Customer created.', undefined, { duration: 3000 });
        this.pageIndex.set(0);
        this.loadData();
      }
    });
  }

  protected openEditDialog(item: Customer): void {
    const ref = this.dialog.open(CustomerFormComponent, {
      data: item,
      disableClose: true,
      maxWidth: '680px',
      width: '100%',
    });

    ref.afterClosed().subscribe((result: CustomerFormResult | undefined) => {
      if (result) {
        this.snackBar.open('Customer updated.', undefined, { duration: 3000 });
        this.pageIndex.set(0);
        this.loadData();
      }
    });
  }

  protected isActive(item: Customer): boolean {
    return item.status?.code === 'ACT';
  }
}
