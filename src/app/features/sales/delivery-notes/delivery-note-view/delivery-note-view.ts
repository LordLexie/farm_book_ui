import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DeliveryNote, DeliveryNoteService } from '../../../../core/services/delivery-note.service';
import { AuthService } from '../../../../core/services/auth.service';
import { DeliveryNoteActions, canCancel, canEdit, deliveryStatusLabel } from '../delivery-note-actions';

@Component({
  selector: 'app-delivery-note-view',
  imports: [DecimalPipe, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatTableModule, MatTooltipModule],
  templateUrl: './delivery-note-view.html',
  styleUrl: './delivery-note-view.css',
})
export class DeliveryNoteViewComponent implements OnInit {
  private readonly service = inject(DeliveryNoteService);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  protected readonly router = inject(Router);
  protected readonly actions = inject(DeliveryNoteActions);

  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly notFound = signal(false);
  protected readonly note = signal<DeliveryNote | null>(null);
  protected readonly itemColumns = ['index', 'item', 'description', 'unit', 'qty'];
  protected readonly statusLabel = deliveryStatusLabel;

  private readonly canManage = this.auth.hasPermission('manage delivery-notes');
  protected readonly showEdit = computed(() => this.canManage && !!this.note() && canEdit(this.note()!));
  protected readonly showCancel = computed(() => this.canManage && !!this.note() && canCancel(this.note()!));
  protected readonly totalQty = computed(() =>
    (this.note()?.items ?? []).reduce((sum, i) => sum + Number(i.qty_ordered), 0),
  );

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.service.getById(id).subscribe({
      next: (res) => {
        this.note.set(res.delivery_note);
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 404) {
          this.notFound.set(true);
        } else {
          this.errorMessage.set('Failed to load delivery note.');
        }
        this.isLoading.set(false);
      },
    });
  }

  protected back(): void {
    this.router.navigate(['/sales/delivery-notes']);
  }

  protected edit(): void {
    this.actions.editDetails(this.note()!).subscribe((n) => this.note.set(n));
  }

  protected cancel(): void {
    this.actions.cancel(this.note()!).subscribe((n) => this.note.set(n));
  }
}
