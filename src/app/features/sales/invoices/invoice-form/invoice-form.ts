import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DecimalPipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import {
  Invoice,
  InvoiceCurrency,
  InvoiceCustomer,
  InvoiceFarmItem,
  InvoiceService as InvoiceServiceType,
  InvoiceService,
  InvoiceStatus,
  InvoiceUnitOfMeasure,
  StoreInvoicePayload,
  UpdateInvoicePayload,
} from '../../../../core/services/invoice.service';

export interface InvoiceFormResult {
  saved: boolean;
}

@Component({
  selector: 'app-invoice-form',
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './invoice-form.html',
  styleUrl: './invoice-form.css',
})
export class InvoiceFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly invoiceService = inject(InvoiceService);
  private readonly dialogRef = inject(MatDialogRef<InvoiceFormComponent>);
  protected readonly invoice: Invoice | null = inject(MAT_DIALOG_DATA);

  protected readonly isLoadingOptions = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly customers = signal<InvoiceCustomer[]>([]);
  protected readonly statuses = signal<InvoiceStatus[]>([]);
  protected readonly currencies = signal<InvoiceCurrency[]>([]);
  protected readonly farmItems = signal<InvoiceFarmItem[]>([]);
  protected readonly services = signal<InvoiceServiceType[]>([]);
  protected readonly unitOfMeasures = signal<InvoiceUnitOfMeasure[]>([]);
  protected readonly subtotal = signal(0);
  protected readonly computedTotal = signal(0);
  protected readonly customerSearch = signal('');
  protected readonly filteredCustomers = computed(() => {
    const q = this.customerSearch().toLowerCase();
    return q ? this.customers().filter((c) => c.name.toLowerCase().includes(q)) : this.customers();
  });

  protected readonly itemSearch = signal('');
  protected readonly filteredCombinedItems = computed(() => {
    const q = this.itemSearch().toLowerCase();
    return {
      farmItems: q ? this.farmItems().filter((fi) => fi.name.toLowerCase().includes(q)) : this.farmItems(),
      services: q ? this.services().filter((s) => s.name.toLowerCase().includes(q)) : this.services(),
    };
  });

  protected readonly isEditMode = this.invoice !== null;

  protected readonly headerForm = this.fb.nonNullable.group({
    customer_id: [this.invoice?.customer_id ?? ('' as unknown as number), [Validators.required]],
    status_id: [this.invoice?.status_id ?? ('' as unknown as number)],
    currency_id: [this.invoice?.currency_id ?? ('' as unknown as number), [Validators.required]],
    date: [this.invoice?.date?.substring(0, 10) ?? new Date().toISOString().substring(0, 10), [Validators.required]],
    discount: [this.invoice?.discount ?? 0, [Validators.min(0), Validators.max(100)]],
  });

  protected readonly itemsForm = this.fb.nonNullable.group({
    rows: this.fb.array([this.buildItemRow()]),
  });

  get rows(): FormArray {
    return this.itemsForm.controls.rows;
  }

  private buildItemRow() {
    return this.fb.nonNullable.group({
      item_key: ['', [Validators.required]],
      invoiceable_type: ['' as 'farm_item' | 'service'],
      invoiceable_id: ['' as unknown as number],
      unit_of_measure_id: ['' as unknown as number, [Validators.required]],
      quantity: ['' as unknown as number, [Validators.required, Validators.min(0)]],
      unit_price: ['' as unknown as number, [Validators.required, Validators.min(0)]],
    });
  }

  ngOnInit(): void {
    forkJoin({
      customers: this.invoiceService.getCustomers(),
      statuses: this.invoiceService.getStatuses(),
      currencies: this.invoiceService.getCurrencies(),
      farmItems: this.invoiceService.getFarmItems(),
      services: this.invoiceService.getServices(),
      unitOfMeasures: this.invoiceService.getUnitOfMeasures(),
    }).subscribe({
      next: ({ customers, statuses, currencies, farmItems, services, unitOfMeasures }) => {
        this.customers.set(customers.customers);
        this.statuses.set(statuses.statuses);
        this.currencies.set(currencies.currencies);
        this.farmItems.set(farmItems.farm_items);
        this.services.set(services.services);
        this.unitOfMeasures.set(unitOfMeasures.unit_of_measures);

        if (!this.isEditMode && currencies.currencies[0]) {
          this.headerForm.controls.currency_id.setValue(currencies.currencies[0].id);
        }

        this.isLoadingOptions.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load form options. Please close and try again.');
        this.isLoadingOptions.set(false);
      },
    });

    this.itemsForm.valueChanges.subscribe(() => this.recomputeTotal());
    this.headerForm.controls.discount.valueChanges.subscribe(() => this.recomputeTotal());
  }

  private recomputeTotal(): void {
    const subtotalVal = this.rows.getRawValue().reduce(
      (sum, r) => sum + ((r.quantity ?? 0) * (r.unit_price ?? 0)),
      0,
    );
    this.subtotal.set(subtotalVal);
    const discount = this.headerForm.controls.discount.value ?? 0;
    this.computedTotal.set(subtotalVal * (1 - discount / 100));
  }

  protected onItemKeyChange(index: number, key: string): void {
    const [type, idStr] = key.split(':');
    const id = Number(idStr);
    const row = this.rows.at(index);
    row.patchValue({ invoiceable_type: type as 'farm_item' | 'service', invoiceable_id: id });

    let uomId: number | undefined;
    if (type === 'service') {
      uomId = this.services().find((s) => s.id === id)?.unit_of_measure_id;
    }
    if (!uomId) {
      uomId = this.unitOfMeasures()[0]?.id;
    }
    if (uomId) {
      row.get('unit_of_measure_id')?.setValue(uomId);
    }
  }

  protected addRow(): void {
    this.rows.push(this.buildItemRow());
  }

  protected removeRow(index: number): void {
    if (this.rows.length > 1) {
      this.rows.removeAt(index);
    }
  }

  protected rowTotal(index: number): number {
    const row = this.rows.at(index).getRawValue();
    return (row.quantity ?? 0) * (row.unit_price ?? 0);
  }

  protected submit(): void {
    if (this.isEditMode) {
      this.submitEdit();
    } else {
      this.submitAdd();
    }
  }

  private submitEdit(): void {
    if (this.headerForm.invalid || !this.invoice) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    const v = this.headerForm.getRawValue();
    const payload: UpdateInvoicePayload = {
      customer_id: v.customer_id,
      status_id: v.status_id,
      currency_id: v.currency_id,
      date: v.date,
      discount: v.discount,
    };

    this.invoiceService.update(this.invoice.id, payload).subscribe({
      next: () => this.dialogRef.close({ saved: true } satisfies InvoiceFormResult),
      error: () => {
        this.errorMessage.set('Failed to update invoice. Please try again.');
        this.isSaving.set(false);
      },
    });
  }

  private submitAdd(): void {
    if (this.headerForm.invalid || this.itemsForm.invalid) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    const v = this.headerForm.getRawValue();
    const payload: StoreInvoicePayload = {
      customer_id: v.customer_id,
      currency_id: v.currency_id,
      date: v.date,
      discount: v.discount,
      items: this.rows.getRawValue().map((r) => ({
        invoiceable_type: r.invoiceable_type,
        invoiceable_id: r.invoiceable_id,
        unit_of_measure_id: r.unit_of_measure_id,
        quantity: r.quantity,
        unit_price: r.unit_price,
      })),
    };

    this.invoiceService.create(payload).subscribe({
      next: () => this.dialogRef.close({ saved: true } satisfies InvoiceFormResult),
      error: () => {
        this.errorMessage.set('Failed to create invoice. Please try again.');
        this.isSaving.set(false);
      },
    });
  }
}
