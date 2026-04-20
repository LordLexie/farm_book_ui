import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DecimalPipe, SlicePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Invoice, InvoiceService } from '../../../../core/services/invoice.service';

@Component({
  selector: 'app-invoice-view',
  imports: [DecimalPipe, SlicePipe, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatTableModule, MatTooltipModule],
  templateUrl: './invoice-view.html',
  styleUrl: './invoice-view.css',
})
export class InvoiceViewComponent implements OnInit {
  private readonly invoiceService = inject(InvoiceService);
  private readonly route = inject(ActivatedRoute);
  protected readonly router = inject(Router);

  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly invoice = signal<Invoice | null>(null);
  protected readonly itemColumns = ['type', 'item', 'qty', 'unit_price', 'total'];

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.invoiceService.getById(id).subscribe({
      next: (res) => {
        this.invoice.set(res.invoice);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load invoice.');
        this.isLoading.set(false);
      },
    });
  }

  protected isActive(): boolean {
    return this.invoice()?.status?.code === 'ACT';
  }

  protected print(): void {
    const inv = this.invoice();
    if (!inv) { return; }
    this.invoiceService.getPrintUrl(inv.id).subscribe({
      next: ({ url }) => window.open(url, '_blank'),
      error: () => this.errorMessage.set('Could not generate print link.'),
    });
  }
}
