import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable } from 'rxjs';
import {
  DeliveryNote,
  NoteResponse,
  UpdateDeliveryNotePayload,
} from '../../../../core/services/delivery-note.service';

export interface DeliveryNoteDetailsDialogData {
  title: string;
  /** Optional line under the title, e.g. "From invoice INV-0001 · Customer". */
  subtitle?: string;
  submitLabel: string;
  initial: UpdateDeliveryNotePayload;
  /** Persists the form values: creates a new note or updates an existing one. */
  save: (payload: UpdateDeliveryNotePayload) => Observable<NoteResponse>;
}

/** Delivery note header form (address, contact, driver, vehicle, notes), used for create and edit. Closes with the saved note. */
@Component({
  selector: 'app-delivery-note-details-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule],
  templateUrl: './delivery-note-details-dialog.html',
  styleUrl: './delivery-note-details-dialog.css',
})
export class DeliveryNoteDetailsDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<DeliveryNoteDetailsDialogComponent, DeliveryNote>);
  protected readonly data: DeliveryNoteDetailsDialogData = inject(MAT_DIALOG_DATA);

  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal('');

  protected readonly form = inject(FormBuilder).nonNullable.group({
    date: [(this.data.initial.date ?? '').slice(0, 10), Validators.required],
    delivered_by: [this.data.initial.delivered_by ?? ''],
    vehicle_reg: [this.data.initial.vehicle_reg ?? ''],
    contact_person: [this.data.initial.contact_person ?? ''],
    contact_phone: [this.data.initial.contact_phone ?? ''],
    delivery_address: [this.data.initial.delivery_address ?? ''],
    notes: [this.data.initial.notes ?? ''],
  });

  protected submit(): void {
    if (this.form.invalid) return;
    this.isSaving.set(true);
    this.errorMessage.set('');

    // Send empty strings as null so cleared fields are cleared on the server.
    const raw = this.form.getRawValue();
    const payload = Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [k, k === 'date' ? v : v.trim() || null]),
    ) as UpdateDeliveryNotePayload;

    this.data.save(payload).subscribe({
      next: (res) => this.dialogRef.close(res.delivery_note),
      error: (err) => {
        this.isSaving.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Failed to save delivery note.');
      },
    });
  }
}
