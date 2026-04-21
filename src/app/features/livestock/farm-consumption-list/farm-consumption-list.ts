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
import {
  FarmConsumption,
  FarmConsumptionService,
} from '../../../core/services/farm-consumption.service';
import {
  FarmConsumptionFormComponent,
  FarmConsumptionFormResult,
} from '../farm-consumption-form/farm-consumption-form';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-farm-consumption-list',
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
  templateUrl: './farm-consumption-list.html',
  styleUrl: './farm-consumption-list.css',
})
export class FarmConsumptionListComponent implements OnInit {
  private readonly consumptionService = inject(FarmConsumptionService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly auth = inject(AuthService);

  protected readonly isLoading = signal(true);
  protected readonly consumptions = signal<FarmConsumption[]>([]);
  protected readonly totalItems = signal(0);
  protected readonly pageSize = signal(15);
  protected readonly pageIndex = signal(0);
  protected readonly pageSizeOptions = [10, 15, 25, 50];
  protected readonly displayedColumns = [
    'consumption_date',
    'farm_item',
    'livestock',
    'quantity',
    'recorded_by',
    'actions',
  ];

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.consumptionService.getAll(this.pageIndex() + 1, this.pageSize()).subscribe({
      next: (res) => {
        this.consumptions.set(res.farm_consumptions);
        this.totalItems.set(res.meta.total);
        this.isLoading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load consumptions.', 'Dismiss', { duration: 4000 });
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
    const ref = this.dialog.open(FarmConsumptionFormComponent, {
      data: null,
      disableClose: true,
      maxWidth: '560px',
      width: '100%',
    });

    ref.afterClosed().subscribe((result: FarmConsumptionFormResult | undefined) => {
      if (result?.saved) {
        this.snackBar.open('Consumption recorded.', undefined, { duration: 3000 });
        this.pageIndex.set(0);
        this.loadData();
      }
    });
  }

  protected openEditDialog(item: FarmConsumption): void {
    const ref = this.dialog.open(FarmConsumptionFormComponent, {
      data: item,
      disableClose: true,
      maxWidth: '560px',
      width: '100%',
    });

    ref.afterClosed().subscribe((result: FarmConsumptionFormResult | undefined) => {
      if (result?.saved) {
        this.snackBar.open('Consumption updated.', undefined, { duration: 3000 });
        this.pageIndex.set(0);
        this.loadData();
      }
    });
  }

  protected farmItemLabel(item: FarmConsumption): string {
    if (!item.farm_item) {
      return '—';
    }
    const masterName = item.farm_item.item_master?.name;
    return masterName ? `${item.farm_item.code} — ${masterName}` : item.farm_item.code;
  }

  protected livestockLabel(item: FarmConsumption): string {
    if (!item.livestock) {
      return '—';
    }
    return item.livestock.name
      ? `${item.livestock.code} — ${item.livestock.name}`
      : item.livestock.code;
  }
}
