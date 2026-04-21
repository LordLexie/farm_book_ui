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
import { MilkProduction, MilkProductionService } from '../../../core/services/milk-production.service';
import {
  MilkProductionFormComponent,
  MilkProductionFormResult,
} from '../milk-production-form/milk-production-form';

@Component({
  selector: 'app-milk-production-list',
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
  templateUrl: './milk-production-list.html',
  styleUrl: './milk-production-list.css',
})
export class MilkProductionListComponent implements OnInit {
  private readonly milkProductionService = inject(MilkProductionService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly isLoading = signal(true);
  protected readonly milkProductions = signal<MilkProduction[]>([]);
  protected readonly totalItems = signal(0);
  protected readonly pageSize = signal(15);
  protected readonly pageIndex = signal(0);
  protected readonly pageSizeOptions = [10, 15, 25, 50];
  protected readonly displayedColumns = ['date', 'session', 'livestock', 'quantity', 'recorded_by', 'actions'];

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.milkProductionService.getAll(this.pageIndex() + 1, this.pageSize()).subscribe({
      next: (res) => {
        this.milkProductions.set(res.milk_productions);
        this.totalItems.set(res.meta.total);
        this.isLoading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load milk productions.', 'Dismiss', { duration: 4000 });
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
    const ref = this.dialog.open(MilkProductionFormComponent, {
      data: null,
      disableClose: true,
      maxWidth: '560px',
      width: '100%',
    });

    ref.afterClosed().subscribe((result: MilkProductionFormResult | undefined) => {
      if (result?.saved) {
        this.snackBar.open('Milk production recorded.', undefined, { duration: 3000 });
        this.pageIndex.set(0);
        this.loadData();
      }
    });
  }

  protected openEditDialog(item: MilkProduction): void {
    const ref = this.dialog.open(MilkProductionFormComponent, {
      data: item,
      disableClose: true,
      maxWidth: '560px',
      width: '100%',
    });

    ref.afterClosed().subscribe((result: MilkProductionFormResult | undefined) => {
      if (result?.saved) {
        this.snackBar.open('Milk production updated.', undefined, { duration: 3000 });
        this.pageIndex.set(0);
        this.loadData();
      }
    });
  }

  protected sessionLabel(item: MilkProduction): string {
    return item.farm_session?.name ?? '—';
  }

  protected livestockLabel(item: MilkProduction): string {
    if (!item.livestock) {
      return '—';
    }
    return item.livestock.name
      ? `${item.livestock.code} — ${item.livestock.name}`
      : item.livestock.code;
  }
}
