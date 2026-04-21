import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe, SlicePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Bill, BillService } from '../../../../core/services/bill.service';
import { BillFormComponent, BillFormResult } from '../bill-form/bill-form';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-bill-list',
  imports: [DecimalPipe, SlicePipe, MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule, MatProgressSpinnerModule, MatPaginatorModule],
  templateUrl: './bill-list.html',
  styleUrl: './bill-list.css',
})
export class BillListComponent implements OnInit {
  private readonly billService = inject(BillService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  protected readonly isLoading = signal(true);
  protected readonly bills = signal<Bill[]>([]);
  protected readonly totalItems = signal(0);
  protected readonly pageSize = signal(15);
  protected readonly pageIndex = signal(0);
  protected readonly pageSizeOptions = [10, 15, 25, 50];
  protected readonly displayedColumns = ['code', 'date', 'supplier', 'items', 'total', 'status', 'actions'];

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.billService.getAll(this.pageIndex() + 1, this.pageSize()).subscribe({
      next: (res) => {
        this.bills.set(res.bills);
        this.totalItems.set(res.meta.total);
        this.isLoading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load bills.', 'Dismiss', { duration: 4000 });
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
    const ref = this.dialog.open(BillFormComponent, {
      data: null,
      disableClose: true,
      maxWidth: '820px',
      width: '100%',
    });

    ref.afterClosed().subscribe((result: BillFormResult | undefined) => {
      if (result) {
        this.snackBar.open('Bill recorded.', undefined, { duration: 3000 });
        this.pageIndex.set(0);
        this.loadData();
      }
    });
  }

  protected navigateToView(item: Bill): void {
    this.router.navigate(['/expenses/bills', item.id]);
  }

  protected isActive(item: Bill): boolean {
    return item.status?.code === 'ACT';
  }
}
