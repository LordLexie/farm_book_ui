import { Component, OnInit, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipOption, MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Farm, FarmService } from '../../../../core/services/farm.service';
import { FarmFormComponent } from '../farm-form/farm-form';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-farm-list',
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatChipsModule,
  ],
  templateUrl: './farm-list.html',
  styleUrl: './farm-list.css',
})
export class FarmListComponent implements OnInit {
  private readonly service = inject(FarmService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly auth = inject(AuthService);

  protected readonly isLoading = signal(true);
  protected readonly farms = signal<Farm[]>([]);
  protected readonly displayedColumns = ['code', 'name', 'location', 'status', 'actions'];

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.service.getAll().subscribe({
      next: (res) => {
        this.farms.set(res.farms);
        this.isLoading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load farms.', 'Dismiss', { duration: 4000 });
        this.isLoading.set(false);
      },
    });
  }

  protected openAddDialog(): void {
    const ref = this.dialog.open(FarmFormComponent, {
      data: null,
      disableClose: true,
    });

    ref.afterClosed().subscribe((result: Farm | undefined) => {
      if (result) {
        this.snackBar.open('Farm created.', undefined, { duration: 3000 });
        this.loadData();
      }
    });
  }

  protected openEditDialog(farm: Farm): void {
    const ref = this.dialog.open(FarmFormComponent, {
      data: farm,
      disableClose: true,
    });

    ref.afterClosed().subscribe((result: Farm | undefined) => {
      if (result) {
        this.snackBar.open('Farm updated.', undefined, { duration: 3000 });
        this.loadData();
      }
    });
  }

  protected isActive(farm: Farm): boolean {
    return farm.status?.code === 'ACT';
  }
}
