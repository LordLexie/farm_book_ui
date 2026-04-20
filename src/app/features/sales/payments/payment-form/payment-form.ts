import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin } from 'rxjs';
import {
  Payment,
  PaymentCurrency,
  PaymentCustomer,
  PaymentMode,
  PaymentService,
  StorePaymentPayload,
  UpdatePaymentPayload,
} from '../../../../core/services/payment.service';

export interface PaymentFormResult {
  saved: boolean;
}

@Component({
  selector: 'app-payment-form',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './payment-form.html',
  styleUrl: './payment-form.css',
})
export class PaymentFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly paymentService = inject(PaymentService);
  private readonly dialogRef = inject(MatDialogRef<PaymentFormComponent>);
  protected readonly payment: Payment | null = inject(MAT_DIALOG_DATA);

  protected readonly isLoadingOptions = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly customers = signal<PaymentCustomer[]>([]);
  protected readonly currencies = signal<PaymentCurrency[]>([]);
  protected readonly paymentModes = signal<PaymentMode[]>([]);
  protected readonly customerSearch = signal('');

  protected readonly isEditMode = this.payment !== null;

  protected readonly filteredCustomers = computed(() => {
    const q = this.customerSearch().toLowerCase();
    return q ? this.customers().filter((c) => c.name.toLowerCase().includes(q)) : this.customers();
  });

  protected readonly form = this.fb.nonNullable.group({
    customer_id: [
      { value: this.payment?.customer_id ?? ('' as unknown as number), disabled: this.isEditMode },
      [Validators.required],
    ],
    currency_id: [
      { value: this.payment?.currency_id ?? ('' as unknown as number), disabled: this.isEditMode },
      [Validators.required],
    ],
    payment_mode_id: [this.payment?.payment_mode_id ?? (null as number | null)],
    amount: [
      { value: this.payment?.amount ?? ('' as unknown as number), disabled: this.isEditMode },
      [Validators.required, Validators.min(0.01)],
    ],
    date: [this.payment?.date ?? new Date().toISOString().slice(0, 10), [Validators.required]],
    notes: [this.payment?.notes ?? ''],
  });

  ngOnInit(): void {
    forkJoin({
      customers: this.paymentService.getCustomers(),
      currencies: this.paymentService.getCurrencies(),
      paymentModes: this.paymentService.getPaymentModes(),
    }).subscribe({
      next: ({ customers, currencies, paymentModes }) => {
        this.customers.set(customers.customers);
        this.currencies.set(currencies.currencies);
        this.paymentModes.set(paymentModes.payment_modes);

        if (!this.isEditMode && currencies.currencies.length) {
          this.form.controls.currency_id.setValue(currencies.currencies[0].id);
        }

        this.isLoadingOptions.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load form options. Please close and try again.');
        this.isLoadingOptions.set(false);
      },
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    if (this.isEditMode && this.payment) {
      const raw = this.form.getRawValue();
      const payload: UpdatePaymentPayload = {
        date: raw.date,
        payment_mode_id: raw.payment_mode_id,
        notes: raw.notes || null,
      };

      this.paymentService.update(this.payment.id, payload).subscribe({
        next: () => this.dialogRef.close({ saved: true } satisfies PaymentFormResult),
        error: () => {
          this.errorMessage.set('Failed to update payment. Please try again.');
          this.isSaving.set(false);
        },
      });
    } else {
      const raw = this.form.getRawValue();
      const payload: StorePaymentPayload = {
        customer_id: raw.customer_id,
        currency_id: raw.currency_id,
        payment_mode_id: raw.payment_mode_id,
        amount: raw.amount,
        date: raw.date,
        notes: raw.notes || null,
      };

      this.paymentService.create(payload).subscribe({
        next: () => this.dialogRef.close({ saved: true } satisfies PaymentFormResult),
        error: () => {
          this.errorMessage.set('Failed to record payment. Please try again.');
          this.isSaving.set(false);
        },
      });
    }
  }
}
