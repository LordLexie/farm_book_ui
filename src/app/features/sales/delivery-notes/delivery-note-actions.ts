import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EMPTY, Observable, catchError, filter, finalize, map, tap } from 'rxjs';
import {
  DeliveryNote,
  DeliveryNoteConflict,
  DeliveryNoteService,
  DeliveryStatus,
} from '../../../core/services/delivery-note.service';
import {
  DeliveryNoteDetailsDialogComponent,
  DeliveryNoteDetailsDialogData,
} from './delivery-note-details-dialog/delivery-note-details-dialog';

/** Status helpers shared by the list, view and print pages. */
export const deliveryStatusLabel = (s: DeliveryStatus): string => s.charAt(0).toUpperCase() + s.slice(1);
export const canEdit = (n: DeliveryNote) => n.status === 'active';
export const canCancel = (n: DeliveryNote) => n.status === 'active';

/**
 * Delivery note actions with their snackbars, dialogs and confirms.
 * Each action emits the updated note on success and completes without emitting otherwise.
 */
@Injectable({ providedIn: 'root' })
export class DeliveryNoteActions {
  private readonly service = inject(DeliveryNoteService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  /**
   * Create from an invoice: opens the delivery note form prefilled from the customer
   * (address, contact, notes can be adjusted), then generates the note and opens it.
   * If the invoice already has an active note, offers to open that one instead.
   * `onDone` runs once the flow ends (form closed or request failed).
   */
  createFromInvoice(invoiceId: number, onDone?: () => void): void {
    this.service.getDraft(invoiceId).subscribe({
      next: ({ draft, existing, invoice }) => {
        if (existing) {
          onDone?.();
          this.offerExisting(`Invoice ${invoice.code} already has delivery note ${existing.code}.`, existing.id);
          return;
        }

        this.openForm({
          title: 'New Delivery Note',
          subtitle: `From invoice ${invoice.code}${invoice.customer ? ' · ' + invoice.customer : ''}`,
          submitLabel: 'Create Delivery Note',
          initial: draft,
          save: (payload) =>
            this.service.createFromInvoice(invoiceId, payload).pipe(
              catchError((err: HttpErrorResponse) => {
                // Someone else created one while the form was open.
                if (err.status === 409) {
                  const body = err.error as DeliveryNoteConflict;
                  this.dialog.closeAll();
                  this.offerExisting(body.message, body.delivery_note.id);
                  return EMPTY;
                }
                throw err;
              }),
            ),
        })
          .pipe(finalize(() => onDone?.()))
          .subscribe((dn) => {
            this.snackBar.open(`Delivery note ${dn.code} created.`, undefined, { duration: 3000 });
            this.router.navigate(['/sales/delivery-notes', dn.id]);
          });
      },
      error: (err: HttpErrorResponse) => {
        onDone?.();
        this.fail(err, 'Failed to prepare delivery note.');
      },
    });
  }

  editDetails(note: DeliveryNote): Observable<DeliveryNote> {
    return this.openForm({
      title: `Edit ${note.code}`,
      submitLabel: 'Save Changes',
      initial: {
        date: note.date,
        delivery_address: note.delivery_address,
        contact_person: note.contact_person,
        contact_phone: note.contact_phone,
        delivered_by: note.delivered_by,
        vehicle_reg: note.vehicle_reg,
        notes: note.notes,
      },
      save: (payload) => this.service.update(note.id, payload),
    }).pipe(tap(() => this.snackBar.open('Delivery note updated.', undefined, { duration: 3000 })));
  }

  cancel(note: DeliveryNote): Observable<DeliveryNote> {
    if (!confirm(`Cancel delivery note ${note.code}? This cannot be undone.`)) return EMPTY;
    return this.run(this.service.cancel(note.id), `${note.code} cancelled.`, 'Failed to cancel.');
  }

  /** Opens the print layout in a new tab and triggers the print dialog. */
  print(id: number): void {
    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/sales/delivery-notes', id, 'print'], { queryParams: { autoprint: 1 } }),
    );
    window.open(url, '_blank');
  }

  private run(
    request: Observable<{ delivery_note: DeliveryNote }>,
    success: string,
    failure: string,
  ): Observable<DeliveryNote> {
    return request.pipe(
      map((res) => res.delivery_note),
      tap(() => this.snackBar.open(success, undefined, { duration: 3000 })),
      catchError((err: HttpErrorResponse) => {
        this.fail(err, failure);
        return EMPTY;
      }),
    );
  }

  /** Opens the header form; emits the saved note if the user submits. */
  private openForm(data: DeliveryNoteDetailsDialogData): Observable<DeliveryNote> {
    return this.dialog
      .open(DeliveryNoteDetailsDialogComponent, { data, maxWidth: '560px', width: '100%', disableClose: true })
      .afterClosed()
      .pipe(filter((n): n is DeliveryNote => !!n));
  }

  private offerExisting(message: string, noteId: number): void {
    this.snackBar
      .open(message, 'Open', { duration: 6000 })
      .onAction()
      .subscribe(() => this.router.navigate(['/sales/delivery-notes', noteId]));
  }

  private fail(err: HttpErrorResponse, fallback: string): void {
    this.snackBar.open(err?.error?.message ?? fallback, 'Dismiss', { duration: 5000 });
  }
}
