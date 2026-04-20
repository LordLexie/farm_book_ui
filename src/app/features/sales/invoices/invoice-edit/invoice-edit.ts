import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
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
  UpdateInvoicePayload,
} from '../../../../core/services/invoice.service';

@Component({
  selector: 'app-invoice-edit',
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './invoice-edit.html',
  styleUrl: './invoice-edit.css',
})
export class InvoiceEditComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly invoiceService = inject(InvoiceService);
  private readonly route = inject(ActivatedRoute);
  protected readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly invoice = signal<Invoice | null>(null);
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

  protected readonly headerForm = this.fb.nonNullable.group({
    customer_id: ['' as unknown as number, [Validators.required]],
    status_id: ['' as unknown as number],
    currency_id: ['' as unknown as number, [Validators.required]],
    date: ['', [Validators.required]],
    discount: [0, [Validators.min(0), Validators.max(100)]],
  });

  protected readonly itemsForm = this.fb.nonNullable.group({
    rows: this.fb.array([this.buildItemRow()]),
  });

  get rows(): FormArray {
    return this.itemsForm.controls.rows;
  }

  private buildItemRow(
    type: 'farm_item' | 'service' | '' = '',
    invoiceableId: number | '' = '',
    uomId: number | '' = '',
    quantity: number | '' = '',
    unitPrice: number | '' = '',
  ) {
    return this.fb.nonNullable.group({
      invoiceable_type: [type as 'farm_item' | 'service', [Validators.required]],
      invoiceable_id: [invoiceableId as unknown as number, [Validators.required]],
      unit_of_measure_id: [uomId as unknown as number, [Validators.required]],
      quantity: [quantity as unknown as number, [Validators.required, Validators.min(0)]],
      unit_price: [unitPrice as unknown as number, [Validators.required, Validators.min(0)]],
    });
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    forkJoin({
      invoice: this.invoiceService.getById(id),
      customers: this.invoiceService.getCustomers(),
      statuses: this.invoiceService.getStatuses(),
      currencies: this.invoiceService.getCurrencies(),
      farmItems: this.invoiceService.getFarmItems(),
      services: this.invoiceService.getServices(),
      unitOfMeasures: this.invoiceService.getUnitOfMeasures(),
    }).subscribe({
      next: ({ invoice, customers, statuses, currencies, farmItems, services, unitOfMeasures }) => {
        this.invoice.set(invoice.invoice);
        this.customers.set(customers.customers);
        this.statuses.set(statuses.statuses);
        this.currencies.set(currencies.currencies);
        this.farmItems.set(farmItems.farm_items);
        this.services.set(services.services);
        this.unitOfMeasures.set(unitOfMeasures.unit_of_measures);

        const inv = invoice.invoice;
        this.headerForm.patchValue({
          customer_id: inv.customer_id,
          status_id: inv.status_id,
          currency_id: inv.currency_id,
          date: inv.date.substring(0, 10),
          discount: inv.discount,
        });

        const itemRows = inv.items.map((item) =>
          this.buildItemRow(item.invoiceable_type, item.invoiceable_id, item.unit_of_measure_id, item.quantity, item.unit_price),
        );
        this.itemsForm.setControl('rows', this.fb.array(itemRows.length ? itemRows : [this.buildItemRow()]));

        this.isLoading.set(false);
        this.recomputeTotal();
      },
      error: () => {
        this.errorMessage.set('Failed to load invoice. Please go back and try again.');
        this.isLoading.set(false);
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

  protected getRowType(index: number): 'farm_item' | 'service' | '' {
    return this.rows.at(index).get('invoiceable_type')?.value ?? '';
  }

  protected onTypeChange(index: number): void {
    this.rows.at(index).get('invoiceable_id')?.setValue('' as unknown as number);
    this.rows.at(index).get('unit_of_measure_id')?.setValue('' as unknown as number);
  }

  protected onItemChange(index: number): void {
    const row = this.rows.at(index);
    const type = row.get('invoiceable_type')?.value as string;
    const id = row.get('invoiceable_id')?.value as number;
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
    const inv = this.invoice();
    if (this.headerForm.invalid || this.itemsForm.invalid || !inv) {
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
      items: this.rows.getRawValue().map((r) => ({
        invoiceable_type: r.invoiceable_type,
        invoiceable_id: r.invoiceable_id,
        unit_of_measure_id: r.unit_of_measure_id,
        quantity: r.quantity,
        unit_price: r.unit_price,
      })),
    };

    this.invoiceService.update(inv.id, payload).subscribe({
      next: () => {
        this.snackBar.open('Invoice updated.', undefined, { duration: 3000 });
        this.router.navigate(['/sales/invoices']);
      },
      error: () => {
        this.errorMessage.set('Failed to update invoice. Please try again.');
        this.isSaving.set(false);
      },
    });
  }
}
