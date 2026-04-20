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
  Bill,
  BillService,
  BillSupplier,
  Currency,
  Status,
  StoreBillPayload,
  UpdateBillPayload,
  BillService as BillServiceItem,
} from '../../../../core/services/bill.service';

export interface BillFormResult {
  saved: boolean;
}

@Component({
  selector: 'app-bill-form',
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
  templateUrl: './bill-form.html',
  styleUrl: './bill-form.css',
})
export class BillFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly billService = inject(BillService);
  private readonly dialogRef = inject(MatDialogRef<BillFormComponent>);
  protected readonly bill: Bill | null = inject(MAT_DIALOG_DATA);

  protected readonly isLoadingOptions = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly suppliers = signal<BillSupplier[]>([]);
  protected readonly statuses = signal<Status[]>([]);
  protected readonly currencies = signal<Currency[]>([]);
  protected readonly services = signal<BillServiceItem[]>([]);
  protected readonly computedTotal = signal(0);

  protected readonly supplierSearch = signal('');
  protected readonly filteredSuppliers = computed(() => {
    const q = this.supplierSearch().toLowerCase();
    return q ? this.suppliers().filter((s) => s.name.toLowerCase().includes(q)) : this.suppliers();
  });

  protected readonly serviceSearch = signal('');
  protected readonly filteredServices = computed(() => {
    const q = this.serviceSearch().toLowerCase();
    return q ? this.services().filter((s) => s.name.toLowerCase().includes(q)) : this.services();
  });

  protected readonly isEditMode = this.bill !== null;

  protected readonly headerForm = this.fb.nonNullable.group({
    supplier_id: [this.bill?.supplier_id ?? ('' as unknown as number), [Validators.required]],
    status_id: [this.bill?.status_id ?? ('' as unknown as number), [Validators.required]],
    currency_id: [this.bill?.currency_id ?? ('' as unknown as number), [Validators.required]],
    date: [this.bill?.date?.substring(0, 10) ?? new Date().toISOString().substring(0, 10), [Validators.required]],
    notes: [this.bill?.notes ?? ''],
  });

  protected readonly itemsForm = this.fb.nonNullable.group({
    rows: this.fb.array([this.buildItemRow()]),
  });

  get rows(): FormArray {
    return this.itemsForm.controls.rows;
  }

  private buildItemRow() {
    return this.fb.nonNullable.group({
      service_id: ['' as unknown as number, [Validators.required]],
      unit_of_measure_id: ['' as unknown as number, [Validators.required]],
      quantity: ['' as unknown as number, [Validators.required, Validators.min(0)]],
      unit_price: ['' as unknown as number, [Validators.required, Validators.min(0)]],
    });
  }

  ngOnInit(): void {
    forkJoin({
      suppliers: this.billService.getSuppliers(),
      statuses: this.billService.getStatuses(),
      currencies: this.billService.getCurrencies(),
      services: this.billService.getServices(),
    }).subscribe({
      next: ({ suppliers, statuses, currencies, services }) => {
        this.suppliers.set(suppliers.suppliers);
        this.statuses.set(statuses.statuses);
        this.currencies.set(currencies.currencies);
        this.services.set(services.services);
        if (!this.isEditMode) {
          const active = statuses.statuses.find((s) => s.code === 'ACT');
          if (active) {
            this.headerForm.patchValue({ status_id: active.id });
          }
          if (currencies.currencies.length) {
            this.headerForm.patchValue({ currency_id: currencies.currencies[0].id });
          }
        }
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

  protected onServiceSelected(index: number, serviceId: number): void {
    const svc = this.services().find((s) => s.id === serviceId);
    if (svc) {
      this.rows.at(index).patchValue({ unit_of_measure_id: svc.unit_of_measure_id });
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
    if (this.headerForm.invalid || !this.bill) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    const v = this.headerForm.getRawValue();
    const payload: UpdateBillPayload = {
      supplier_id: v.supplier_id,
      status_id: v.status_id,
      currency_id: v.currency_id,
      date: v.date,
      notes: v.notes || null,
    };

    this.billService.update(this.bill.id, payload).subscribe({
      next: () => this.dialogRef.close({ saved: true } satisfies BillFormResult),
      error: () => {
        this.errorMessage.set('Failed to update bill. Please try again.');
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
    const payload: StoreBillPayload = {
      supplier_id: v.supplier_id,
      status_id: v.status_id,
      currency_id: v.currency_id,
      date: v.date,
      notes: v.notes || null,
      items: this.rows.getRawValue().map((r) => ({
        service_id: r.service_id,
        unit_of_measure_id: r.unit_of_measure_id,
        quantity: r.quantity,
        unit_price: r.unit_price,
      })),
    };

    this.billService.create(payload).subscribe({
      next: () => this.dialogRef.close({ saved: true } satisfies BillFormResult),
      error: () => {
        this.errorMessage.set('Failed to record bill. Please try again.');
        this.isSaving.set(false);
      },
    });
  }
}
