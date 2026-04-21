import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DecimalPipe, SlicePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProFormaInvoice, ProFormaInvoiceService } from '../../../../core/services/pro-forma-invoice.service';

@Component({
  selector: 'app-pro-forma-invoice-view',
  imports: [DecimalPipe, SlicePipe, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatTableModule, MatTooltipModule],
  templateUrl: './pro-forma-invoice-view.html',
  styleUrl: './pro-forma-invoice-view.css',
})
export class ProFormaInvoiceViewComponent implements OnInit {
  private readonly service = inject(ProFormaInvoiceService);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly router = inject(Router);

  protected readonly isLoading = signal(true);
  protected readonly isConverting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly proFormaInvoice = signal<ProFormaInvoice | null>(null);
  protected readonly itemColumns = ['type', 'item', 'qty', 'unit_price', 'total'];

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.service.getById(id).subscribe({
      next: (res) => {
        this.proFormaInvoice.set(res.pro_forma_invoice);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load pro forma invoice.');
        this.isLoading.set(false);
      },
    });
  }

  protected isActive(): boolean {
    return this.proFormaInvoice()?.status?.code === 'ACT';
  }

  protected print(): void {
    const pf = this.proFormaInvoice();
    if (!pf) return;
    this.service.getPrintUrl(pf.id).subscribe({
      next: ({ url }) => window.open(url, '_blank'),
      error: () => this.errorMessage.set('Could not generate print link.'),
    });
  }

  protected convert(): void {
    const pf = this.proFormaInvoice();
    if (!pf) return;
    this.isConverting.set(true);
    this.service.convert(pf.id).subscribe({
      next: (res) => {
        this.isConverting.set(false);
        this.snackBar.open('Converted to invoice ' + res.invoice.code, undefined, { duration: 4000 });
        this.router.navigate(['/sales/invoices', res.invoice.id]);
      },
      error: () => {
        this.isConverting.set(false);
        this.snackBar.open('Failed to convert pro forma.', 'Dismiss', { duration: 4000 });
      },
    });
  }
}
