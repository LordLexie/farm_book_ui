import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { DeliveryNote, DeliveryNoteService } from '../../../../core/services/delivery-note.service';

// Delivery note printout. Styles mirror the backend's
// resources/views/invoices/print.blade.php so all printed documents look alike.
@Component({
  selector: 'app-delivery-note-print',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './delivery-note-print.html',
  styleUrl: './delivery-note-print.css',
})
export class DeliveryNotePrintComponent implements OnInit {
  private readonly service = inject(DeliveryNoteService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly isLoading = signal(true);
  protected readonly note = signal<DeliveryNote | null>(null);
  protected readonly totalQty = computed(() =>
    (this.note()?.items ?? []).reduce((sum, i) => sum + Number(i.qty_ordered), 0),
  );

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.service.getById(id).subscribe({
      next: (res) => {
        this.note.set(res.delivery_note);
        this.isLoading.set(false);
        if (this.route.snapshot.queryParamMap.has('autoprint')) {
          // Give the document a moment to render (and the logo to load) before printing.
          setTimeout(() => window.print(), 400);
        }
      },
      error: () => this.isLoading.set(false),
    });
  }

  protected print(): void {
    window.print();
  }

  protected back(): void {
    const n = this.note();
    this.router.navigate(n ? ['/sales/delivery-notes', n.id] : ['/sales/delivery-notes']);
  }
}
