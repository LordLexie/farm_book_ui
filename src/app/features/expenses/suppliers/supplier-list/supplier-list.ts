import { Component, OnInit, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Supplier, SupplierService } from '../../../../core/services/supplier.service';
import { SupplierFormComponent, SupplierFormResult } from '../supplier-form/supplier-form';

@Component({
  selector: 'app-supplier-list',
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule, MatProgressSpinnerModule],
  templateUrl: './supplier-list.html',
  styleUrl: './supplier-list.css',
})
export class SupplierListComponent implements OnInit {
  private readonly supplierService = inject(SupplierService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly isLoading = signal(true);
  protected readonly suppliers = signal<Supplier[]>([]);
  protected readonly displayedColumns = ['code', 'name', 'type', 'contact', 'status', 'actions'];

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.supplierService.getAll().subscribe({
      next: (res) => {
        this.suppliers.set(res.suppliers);
        this.isLoading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load suppliers.', 'Dismiss', { duration: 4000 });
        this.isLoading.set(false);
      },
    });
  }

  protected openAddDialog(): void {
    const ref = this.dialog.open(SupplierFormComponent, {
      data: null,
      disableClose: true,
      maxWidth: '680px',
      width: '100%',
    });

    ref.afterClosed().subscribe((result: SupplierFormResult | undefined) => {
      if (result) {
        this.snackBar.open('Supplier added.', undefined, { duration: 3000 });
        this.loadData();
      }
    });
  }

  protected openEditDialog(item: Supplier): void {
    const ref = this.dialog.open(SupplierFormComponent, {
      data: item,
      disableClose: true,
      maxWidth: '680px',
      width: '100%',
    });

    ref.afterClosed().subscribe((result: SupplierFormResult | undefined) => {
      if (result) {
        this.snackBar.open('Supplier updated.', undefined, { duration: 3000 });
        this.loadData();
      }
    });
  }

  protected isActive(item: Supplier): boolean {
    return item.status?.code === 'ACT';
  }
}
