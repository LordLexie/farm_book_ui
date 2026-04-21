import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DecimalPipe } from '@angular/common';
import { forkJoin } from 'rxjs/internal/observable/forkJoin';
import {
  MilkSale,
  MilkSaleCustomer,
  MilkSaleCurrency,
  MilkSalePayload,
  MilkSaleService,
} from '../../../core/services/milk-sale.service';

export interface MilkSaleFormResult {
  saved: boolean;
}

@Component({
  selector: 'app-milk-sale-form',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DecimalPipe,
  ],
  templateUrl: './milk-sale-form.html',
  styleUrl: './milk-sale-form.css',
})
export class MilkSaleFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly milkSaleService = inject(MilkSaleService);
  private readonly dialogRef = inject(MatDialogRef<MilkSaleFormComponent>);
  protected readonly milkSale: MilkSale | null = inject(MAT_DIALOG_DATA);

  protected readonly isLoadingOptions = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly customers = signal<MilkSaleCustomer[]>([]);
  protected readonly currencies = signal<MilkSaleCurrency[]>([]);
  protected readonly milkRates = signal<{ id: number; rate_plan_id: number; price: number }[]>([]);
  protected readonly customerSearch = signal('');

  protected readonly isEditMode = this.milkSale !== null;

  protected readonly filteredCustomers = computed(() => {
    const q = this.customerSearch().toLowerCase();
    return q ? this.customers().filter((c) => c.name.toLowerCase().includes(q)) : this.customers();
  });

  protected readonly form = this.fb.nonNullable.group({
    customer_id: [
      this.milkSale?.customer_id ?? ('' as unknown as number),
      [Validators.required],
    ],
    currency_id: [
      this.milkSale?.currency_id ?? ('' as unknown as number),
      [Validators.required],
    ],
    date: [this.milkSale?.date ?? new Date().toISOString().slice(0, 10), [Validators.required]],
    quantity: [
      this.milkSale?.quantity ?? ('' as unknown as number),
      [Validators.required, Validators.min(0)],
    ],
    unit_price: [
      this.milkSale?.unit_price ?? ('' as unknown as number),
      [Validators.required, Validators.min(0)],
    ],
  });

  private readonly quantityValue = toSignal(this.form.controls.quantity.valueChanges, {
    initialValue: this.milkSale?.quantity ?? 0,
  });

  private readonly unitPriceValue = toSignal(this.form.controls.unit_price.valueChanges, {
    initialValue: this.milkSale?.unit_price ?? 0,
  });

  protected readonly computedTotal = computed(() => {
    const q = Number(this.quantityValue()) || 0;
    const p = Number(this.unitPriceValue()) || 0;
    return q * p;
  });

  ngOnInit(): void {
    forkJoin({
      customers: this.milkSaleService.getCustomers(),
      currencies: this.milkSaleService.getCurrencies(),
      milkRates: this.milkSaleService.getMilkRates(),
    }).subscribe({
      next: ({ customers, currencies, milkRates }) => {
        this.customers.set(customers.customers);
        this.currencies.set(currencies.currencies);
        this.milkRates.set(milkRates.milk_rates);

        if (!this.isEditMode && currencies.currencies.length) {
          this.form.controls.currency_id.setValue(currencies.currencies[0].id);
        }

        this.applyRateForCustomer(this.form.controls.customer_id.value);

        this.form.controls.customer_id.valueChanges.subscribe((customerId) => {
          this.applyRateForCustomer(customerId);
        });

        this.isLoadingOptions.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load form options. Please close and try again.');
        this.isLoadingOptions.set(false);
      },
    });
  }

  private applyRateForCustomer(customerId: number): void {
    const customer = this.customers().find((c) => c.id === customerId);
    if (!customer?.rate_plan_id) {
      return;
    }
    const rate = this.milkRates().find((r) => r.rate_plan_id === customer.rate_plan_id);
    if (rate) {
      this.form.controls.unit_price.setValue(rate.price);
    }
  }

  protected submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    const raw = this.form.getRawValue();
    const payload: MilkSalePayload = {
      customer_id: raw.customer_id,
      currency_id: raw.currency_id,
      date: raw.date,
      quantity: raw.quantity,
      unit_price: raw.unit_price,
    };

    if (this.isEditMode && this.milkSale) {
      this.milkSaleService.update(this.milkSale.id, payload).subscribe({
        next: () => this.dialogRef.close({ saved: true } satisfies MilkSaleFormResult),
        error: () => {
          this.errorMessage.set('Failed to update milk sale. Please try again.');
          this.isSaving.set(false);
        },
      });
    } else {
      this.milkSaleService.create(payload).subscribe({
        next: () => this.dialogRef.close({ saved: true } satisfies MilkSaleFormResult),
        error: () => {
          this.errorMessage.set('Failed to record milk sale. Please try again.');
          this.isSaving.set(false);
        },
      });
    }
  }
}
