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
  Quotation,
  QuotationCustomer,
  QuotationCurrency,
  QuotationTax,
  QuotationService,
  QuotationStatus,
  QuotationUnitOfMeasure,
  UpdateQuotationPayload,
} from '../../../../core/services/quotation.service';

@Component({
  selector: 'app-quotation-edit',
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
  templateUrl: './quotation-edit.html',
  styleUrl: './quotation-edit.css',
})
export class QuotationEditComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly quotationService = inject(QuotationService);
  private readonly route = inject(ActivatedRoute);
  protected readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly quotation = signal<Quotation | null>(null);
  protected readonly customers = signal<QuotationCustomer[]>([]);
  protected readonly statuses = signal<QuotationStatus[]>([]);
  protected readonly currencies = signal<QuotationCurrency[]>([]);
  protected readonly taxes = signal<QuotationTax[]>([]);
  protected readonly unitOfMeasures = signal<QuotationUnitOfMeasure[]>([]);
  protected readonly subtotal = signal(0);
  protected readonly taxAmount = signal(0);
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
    tax_id: [null as number | null],
    discount: [0, [Validators.min(0), Validators.max(100)]],
    date: ['', [Validators.required]],
    valid_until: [''],
    notes: [''],
  });

  protected readonly itemsForm = this.fb.nonNullable.group({
    rows: this.fb.array([this.buildItemRow()]),
  });

  get rows(): FormArray {
    return this.itemsForm.controls.rows;
  }

  private buildItemRow(
    name = '',
    description = '',
    uomId: number | '' = '',
    quantity: number | '' = '',
    unitPrice: number | '' = '',
  ) {
    return this.fb.nonNullable.group({
      name: [name, [Validators.required]],
      description: [description],
      unit_of_measure_id: [uomId as unknown as number, [Validators.required]],
      quantity: [quantity as unknown as number, [Validators.required, Validators.min(0)]],
      unit_price: [unitPrice as unknown as number, [Validators.required, Validators.min(0)]],
    });
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    forkJoin({
      quotation: this.quotationService.getById(id),
      customers: this.quotationService.getCustomers(),
      statuses: this.quotationService.getStatuses(),
      currencies: this.quotationService.getCurrencies(),
      taxes: this.quotationService.getTaxes(),
      unitOfMeasures: this.quotationService.getUnitOfMeasures(),
    }).subscribe({
      next: ({ quotation, customers, statuses, currencies, taxes, unitOfMeasures }) => {
        this.quotation.set(quotation.quotation);
        this.customers.set(customers.customers);
        this.statuses.set(statuses.statuses);
        this.currencies.set(currencies.currencies);
        this.taxes.set(taxes.taxes);
        this.unitOfMeasures.set(unitOfMeasures.unit_of_measures);

        const q = quotation.quotation;
        this.headerForm.patchValue({
          customer_id: q.customer_id,
          status_id: q.status_id,
          currency_id: q.currency_id ?? ('' as unknown as number),
          tax_id: q.tax_id ?? null,
          discount: q.discount ?? 0,
          date: q.date.substring(0, 10),
          valid_until: q.valid_until?.substring(0, 10) ?? '',
          notes: q.notes ?? '',
        });

        const itemRows = q.items.map((item) =>
          this.buildItemRow(item.name, item.description ?? '', item.unit_of_measure_id, item.quantity, item.unit_price),
        );
        this.itemsForm.setControl('rows', this.fb.array(itemRows.length ? itemRows : [this.buildItemRow()]));

        this.isLoading.set(false);
        this.recomputeTotal();
      },
      error: () => {
        this.errorMessage.set('Failed to load quotation. Please go back and try again.');
        this.isLoading.set(false);
      },
    });

    this.itemsForm.valueChanges.subscribe(() => this.recomputeTotal());
    this.headerForm.controls.discount.valueChanges.subscribe(() => this.recomputeTotal());
    this.headerForm.controls.tax_id.valueChanges.subscribe(() => this.recomputeTotal());
  }

  private recomputeTotal(): void {
    const subtotalVal = this.rows.getRawValue().reduce(
      (sum, r) => sum + ((r.quantity ?? 0) * (r.unit_price ?? 0)),
      0,
    );
    this.subtotal.set(subtotalVal);
    const discount      = this.headerForm.controls.discount.value ?? 0;
    const afterDiscount = subtotalVal * (1 - discount / 100);
    const taxId         = this.headerForm.controls.tax_id.value;
    const tax           = this.taxes().find((t) => t.id === taxId);
    const taxAmt        = tax ? afterDiscount * (tax.value / 100) : 0;
    this.taxAmount.set(taxAmt);
    this.computedTotal.set(afterDiscount + taxAmt);
  }

  protected rowTotal(index: number): number {
    const row = this.rows.at(index).getRawValue();
    return (row.quantity ?? 0) * (row.unit_price ?? 0);
  }

  protected addRow(): void {
    this.rows.push(this.buildItemRow());
  }

  protected removeRow(index: number): void {
    if (this.rows.length > 1) {
      this.rows.removeAt(index);
    }
  }

  protected submit(): void {
    const q = this.quotation();
    if (this.headerForm.invalid || this.itemsForm.invalid || !q) return;

    this.isSaving.set(true);
    this.errorMessage.set('');

    const v = this.headerForm.getRawValue();
    const payload: UpdateQuotationPayload = {
      customer_id: v.customer_id,
      status_id: v.status_id,
      currency_id: v.currency_id,
      tax_id: v.tax_id,
      discount: v.discount,
      date: v.date,
      valid_until: v.valid_until || null,
      notes: v.notes || null,
      items: this.rows.getRawValue().map((r) => ({
        name: r.name,
        description: r.description || null,
        unit_of_measure_id: r.unit_of_measure_id,
        quantity: r.quantity,
        unit_price: r.unit_price,
      })),
    };

    this.quotationService.update(q.id, payload).subscribe({
      next: () => {
        this.snackBar.open('Quotation updated.', undefined, { duration: 3000 });
        this.router.navigate(['/sales/quotations']);
      },
      error: () => {
        this.errorMessage.set('Failed to update quotation. Please try again.');
        this.isSaving.set(false);
      },
    });
  }
}
