import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DecimalPipe, SlicePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Quotation, QuotationService } from '../../../../core/services/quotation.service';

@Component({
  selector: 'app-quotation-view',
  imports: [DecimalPipe, SlicePipe, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatTableModule, MatTooltipModule],
  templateUrl: './quotation-view.html',
  styleUrl: './quotation-view.css',
})
export class QuotationViewComponent implements OnInit {
  private readonly quotationService = inject(QuotationService);
  private readonly route = inject(ActivatedRoute);
  protected readonly router = inject(Router);

  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly quotation = signal<Quotation | null>(null);
  protected readonly itemColumns = ['num', 'name', 'qty', 'unit', 'unit_price', 'total'];

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.quotationService.getById(id).subscribe({
      next: (res) => {
        this.quotation.set(res.quotation);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load quotation.');
        this.isLoading.set(false);
      },
    });
  }

  protected isActive(): boolean {
    return this.quotation()?.status?.code === 'ACT';
  }

  protected print(): void {
    const q = this.quotation();
    if (!q) { return; }
    this.quotationService.getPrintUrl(q.id).subscribe({
      next: ({ url }) => window.open(url, '_blank'),
      error: () => this.errorMessage.set('Could not generate print link.'),
    });
  }
}
