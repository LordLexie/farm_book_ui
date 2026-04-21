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
import { Quotation, QuotationService } from '../../../../core/services/quotation.service';
import { QuotationFormComponent, QuotationFormResult } from '../quotation-form/quotation-form';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-quotation-list',
  imports: [DecimalPipe, SlicePipe, MatTableModule, MatButtonModule, MatIconModule, MatMenuModule, MatProgressSpinnerModule, MatPaginatorModule],
  templateUrl: './quotation-list.html',
  styleUrl: './quotation-list.css',
})
export class QuotationListComponent implements OnInit {
  private readonly quotationService = inject(QuotationService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  protected readonly isLoading = signal(true);
  protected readonly quotations = signal<Quotation[]>([]);
  protected readonly totalItems = signal(0);
  protected readonly pageSize = signal(15);
  protected readonly pageIndex = signal(0);
  protected readonly pageSizeOptions = [10, 15, 25, 50];
  protected readonly displayedColumns = ['code', 'date', 'customer', 'items', 'total', 'valid_until', 'status', 'actions'];

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.quotationService.getAll(this.pageIndex() + 1, this.pageSize()).subscribe({
      next: (res) => {
        this.quotations.set(res.quotations);
        this.totalItems.set(res.meta.total);
        this.isLoading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load quotations.', 'Dismiss', { duration: 4000 });
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
    const ref = this.dialog.open(QuotationFormComponent, {
      data: null,
      disableClose: true,
      maxWidth: '820px',
      width: '100%',
    });

    ref.afterClosed().subscribe((result: QuotationFormResult | undefined) => {
      if (result) {
        this.snackBar.open('Quotation created.', undefined, { duration: 3000 });
        this.pageIndex.set(0);
        this.loadData();
      }
    });
  }

  protected navigateToEdit(item: Quotation): void {
    this.router.navigate(['/sales/quotations', item.id, 'edit']);
  }

  protected navigateToView(item: Quotation): void {
    this.router.navigate(['/sales/quotations', item.id]);
  }

  protected isActive(item: Quotation): boolean {
    return item.status?.code === 'ACT';
  }
}
