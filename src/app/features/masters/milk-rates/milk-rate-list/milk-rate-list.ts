import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MilkRate, MilkRateService } from '../../../../core/services/milk-rate.service';
import { MilkRateFormComponent, MilkRateFormResult } from '../milk-rate-form/milk-rate-form';

@Component({
  selector: 'app-milk-rate-list',
  imports: [
    DecimalPipe,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './milk-rate-list.html',
  styleUrl: './milk-rate-list.css',
})
export class MilkRateListComponent implements OnInit {
  private readonly service = inject(MilkRateService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly isLoading = signal(true);
  protected readonly milkRates = signal<MilkRate[]>([]);
  protected readonly displayedColumns = ['rate_plan', 'price', 'actions'];

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.service.getAll().subscribe({
      next: (res) => {
        this.milkRates.set(res.milk_rates);
        this.isLoading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load milk rates.', 'Dismiss', { duration: 4000 });
        this.isLoading.set(false);
      },
    });
  }

  protected openAddDialog(): void {
    const ref = this.dialog.open(MilkRateFormComponent, {
      data: null,
      disableClose: true,
      width: '400px',
    });

    ref.afterClosed().subscribe((result: MilkRateFormResult | undefined) => {
      if (result?.saved) {
        this.snackBar.open('Milk rate created.', undefined, { duration: 3000 });
        this.loadData();
      }
    });
  }

  protected openEditDialog(milkRate: MilkRate): void {
    const ref = this.dialog.open(MilkRateFormComponent, {
      data: milkRate,
      disableClose: true,
      width: '400px',
    });

    ref.afterClosed().subscribe((result: MilkRateFormResult | undefined) => {
      if (result?.saved) {
        this.snackBar.open('Milk rate updated.', undefined, { duration: 3000 });
        this.loadData();
      }
    });
  }
}
