import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DecimalPipe, SlicePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Purchase, PurchaseService } from '../../../../core/services/purchase.service';

@Component({
  selector: 'app-purchase-view',
  imports: [DecimalPipe, SlicePipe, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatTableModule, MatTooltipModule],
  templateUrl: './purchase-view.html',
  styleUrl: './purchase-view.css',
})
export class PurchaseViewComponent implements OnInit {
  private readonly purchaseService = inject(PurchaseService);
  private readonly route = inject(ActivatedRoute);
  protected readonly router = inject(Router);

  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly purchase = signal<Purchase | null>(null);
  protected readonly itemColumns = ['item', 'unit', 'qty', 'unit_price', 'total'];

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.purchaseService.getById(id).subscribe({
      next: (res) => {
        this.purchase.set(res.purchase);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load purchase.');
        this.isLoading.set(false);
      },
    });
  }

  protected isActive(): boolean {
    return this.purchase()?.status?.code === 'ACT';
  }

  protected print(): void {
    window.print();
  }
}
