import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LookupConfig, LookupItem, LookupService } from '../../../../core/services/lookup.service';
import { LookupFormComponent, LookupFormResult } from '../lookup-form/lookup-form';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-lookup-list',
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
  ],
  templateUrl: './lookup-list.html',
  styleUrl: './lookup-list.css',
})
export class LookupListComponent implements OnInit {
  private readonly lookupService = inject(LookupService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly route = inject(ActivatedRoute);
  protected readonly auth = inject(AuthService);

  protected readonly config = this.route.snapshot.data as LookupConfig;
  protected readonly isLoading = signal(true);
  protected readonly items = signal<LookupItem[]>([]);
  protected readonly totalItems = signal(0);
  protected readonly pageSize = signal(15);
  protected readonly pageIndex = signal(0);
  protected readonly pageSizeOptions = [10, 15, 25, 50];
  protected readonly displayedColumns = ['code', 'name', 'actions'];

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.lookupService.getAll(this.config.resource, this.pageIndex() + 1, this.pageSize()).subscribe({
      next: (res) => {
        this.items.set(res[this.config.responseKey] as LookupItem[] ?? []);
        this.totalItems.set(res['meta'].total);
        this.isLoading.set(false);
      },
      error: () => {
        this.snackBar.open(`Failed to load ${this.config.title.toLowerCase()}.`, 'Dismiss', {
          duration: 4000,
        });
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
    const ref = this.dialog.open(LookupFormComponent, {
      data: { item: null, config: this.config },
      disableClose: true,
      maxWidth: '680px',
      width: '100%',
    });

    ref.afterClosed().subscribe((result: LookupFormResult | undefined) => {
      if (result) {
        this.snackBar.open(
          `${result.count} ${result.count === 1 ? this.config.title.replace(/s$/, '') : this.config.title.toLowerCase()} added.`,
          undefined,
          { duration: 3000 },
        );
        this.pageIndex.set(0);
        this.loadData();
      }
    });
  }

  protected openEditDialog(item: LookupItem): void {
    const ref = this.dialog.open(LookupFormComponent, {
      data: { item, config: this.config },
      disableClose: true,
      maxWidth: '440px',
      width: '100%',
    });

    ref.afterClosed().subscribe((result: LookupFormResult | undefined) => {
      if (result) {
        this.snackBar.open('Updated successfully.', undefined, { duration: 3000 });
        this.loadData();
      }
    });
  }
}
