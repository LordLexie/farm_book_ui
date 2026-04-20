import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DecimalPipe, SlicePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Bill, BillService } from '../../../../core/services/bill.service';

@Component({
  selector: 'app-bill-view',
  imports: [DecimalPipe, SlicePipe, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatTableModule, MatTooltipModule],
  templateUrl: './bill-view.html',
  styleUrl: './bill-view.css',
})
export class BillViewComponent implements OnInit {
  private readonly billService = inject(BillService);
  private readonly route = inject(ActivatedRoute);
  protected readonly router = inject(Router);

  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly bill = signal<Bill | null>(null);
  protected readonly itemColumns = ['service', 'unit', 'qty', 'unit_price', 'total'];

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.billService.getById(id).subscribe({
      next: (res) => {
        this.bill.set(res.bill);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load bill.');
        this.isLoading.set(false);
      },
    });
  }

  protected isActive(): boolean {
    return this.bill()?.status?.code === 'ACT';
  }
}
