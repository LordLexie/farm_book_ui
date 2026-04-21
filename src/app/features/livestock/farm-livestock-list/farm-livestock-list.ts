import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FarmLivestock, FarmLivestockService } from '../../../core/services/farm-livestock.service';
import {
  FarmLivestockFormComponent,
  FarmLivestockFormResult,
} from '../farm-livestock-form/farm-livestock-form';

@Component({
  selector: 'app-farm-livestock-list',
  imports: [
    DatePipe,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
  ],
  templateUrl: './farm-livestock-list.html',
  styleUrl: './farm-livestock-list.css',
})
export class FarmLivestockListComponent implements OnInit {
  private readonly livestockService = inject(FarmLivestockService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly isLoading = signal(true);
  protected readonly livestocks = signal<FarmLivestock[]>([]);
  protected readonly totalItems = signal(0);
  protected readonly pageSize = signal(15);
  protected readonly pageIndex = signal(0);
  protected readonly pageSizeOptions = [10, 15, 25, 50];
  protected readonly displayedColumns = [
    'code',
    'farm',
    'type',
    'name',
    'breed',
    'gender',
    'status',
    'date_of_birth',
    'actions',
  ];

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.livestockService.getAll(this.pageIndex() + 1, this.pageSize()).subscribe({
      next: (res) => {
        this.livestocks.set(res.farm_livestocks);
        this.totalItems.set(res.meta.total);
        this.isLoading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load livestock.', 'Dismiss', { duration: 4000 });
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
    const ref = this.dialog.open(FarmLivestockFormComponent, {
      data: null,
      disableClose: true,
      maxWidth: '620px',
      width: '100%',
    });

    ref.afterClosed().subscribe((result: FarmLivestockFormResult | undefined) => {
      if (result?.saved) {
        this.snackBar.open('Livestock created.', undefined, { duration: 3000 });
        this.pageIndex.set(0);
        this.loadData();
      }
    });
  }

  protected openEditDialog(item: FarmLivestock): void {
    const ref = this.dialog.open(FarmLivestockFormComponent, {
      data: item,
      disableClose: true,
      maxWidth: '620px',
      width: '100%',
    });

    ref.afterClosed().subscribe((result: FarmLivestockFormResult | undefined) => {
      if (result?.saved) {
        this.snackBar.open('Livestock updated.', undefined, { duration: 3000 });
        this.pageIndex.set(0);
        this.loadData();
      }
    });
  }

  protected statusClass(item: FarmLivestock): string {
    return `status-${item.status?.code?.toLowerCase() ?? 'unknown'}`;
  }
}
