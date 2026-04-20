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
  QuotationService,
  QuotationCustomer,
  QuotationUnitOfMeasure,
  StoreQuotationPayload,
} from '../../../../core/services/quotation.service';

export interface QuotationFormResult {
  saved: boolean;
}

@Component({
  selector: 'app-quotation-form',
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
  templateUrl: './quotation-form.html',
  styleUrl: './quotation-form.css',
})
export class QuotationFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly quotationService = inject(QuotationService);
  private readonly dialogRef = inject(MatDialogRef<QuotationFormComponent>);

  // dialog always opens for create; data injection kept for compatibility but unused
  protected readonly _data = inject(MAT_DIALOG_DATA);

  protected readonly isLoadingOptions = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly customers = signal<QuotationCustomer[]>([]);
  protected readonly unitOfMeasures = signal<QuotationUnitOfMeasure[]>([]);
  protected readonly computedTotal = signal(0);
  protected readonly customerSearch = signal('');
  protected readonly filteredCustomers = computed(() => {
    const q = this.customerSearch().toLowerCase();
    return q ? this.customers().filter((c) => c.name.toLowerCase().includes(q)) : this.customers();
  });

  protected readonly headerForm = this.fb.nonNullable.group({
    customer_id: ['' as unknown as number, [Validators.required]],
    date: [new Date().toISOString().substring(0, 10), [Validators.required]],
    valid_until: [''],
    notes: [''],
  });

  protected readonly itemsForm = this.fb.nonNullable.group({
    rows: this.fb.array([this.buildItemRow()]),
  });

  get rows(): FormArray {
    return this.itemsForm.controls.rows;
  }

  private buildItemRow() {
    return this.fb.nonNullable.group({
      name: ['', [Validators.required]],
      description: [''],
      unit_of_measure_id: ['' as unknown as number, [Validators.required]],
      quantity: ['' as unknown as number, [Validators.required, Validators.min(0)]],
      unit_price: ['' as unknown as number, [Validators.required, Validators.min(0)]],
    });
  }

  ngOnInit(): void {
    forkJoin({
      customers: this.quotationService.getCustomers(),
      unitOfMeasures: this.quotationService.getUnitOfMeasures(),
    }).subscribe({
      next: ({ customers, unitOfMeasures }) => {
        this.customers.set(customers.customers);
        this.unitOfMeasures.set(unitOfMeasures.unit_of_measures);
        this.isLoadingOptions.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load form options. Please close and try again.');
        this.isLoadingOptions.set(false);
      },
    });

    this.itemsForm.valueChanges.subscribe(() => {
      const total = this.rows.getRawValue().reduce(
        (sum, r) => sum + ((r.quantity ?? 0) * (r.unit_price ?? 0)),
        0,
      );
      this.computedTotal.set(total);
    });
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
    if (this.headerForm.invalid || this.itemsForm.invalid) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    const v = this.headerForm.getRawValue();
    const payload: StoreQuotationPayload = {
      customer_id: v.customer_id,
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

    this.quotationService.create(payload).subscribe({
      next: () => this.dialogRef.close({ saved: true } satisfies QuotationFormResult),
      error: () => {
        this.errorMessage.set('Failed to create quotation. Please try again.');
        this.isSaving.set(false);
      },
    });
  }
}
