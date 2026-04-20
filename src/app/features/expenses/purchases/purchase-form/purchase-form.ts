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
  Currency,
  ItemMaster,
  Purchase,
  PurchaseService,
  PurchaseSupplier,
  Status,
  StorePurchasePayload,
  UpdatePurchasePayload,
} from '../../../../core/services/purchase.service';

export interface PurchaseFormResult {
  saved: boolean;
}

@Component({
  selector: 'app-purchase-form',
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
  templateUrl: './purchase-form.html',
  styleUrl: './purchase-form.css',
})
export class PurchaseFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly purchaseService = inject(PurchaseService);
  private readonly dialogRef = inject(MatDialogRef<PurchaseFormComponent>);
  protected readonly purchase: Purchase | null = inject(MAT_DIALOG_DATA);

  protected readonly isLoadingOptions = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly suppliers = signal<PurchaseSupplier[]>([]);
  protected readonly statuses = signal<Status[]>([]);
  protected readonly currencies = signal<Currency[]>([]);
  protected readonly itemMasters = signal<ItemMaster[]>([]);
  protected readonly computedTotal = signal(0);

  protected readonly supplierSearch = signal('');
  protected readonly filteredSuppliers = computed(() => {
    const q = this.supplierSearch().toLowerCase();
    return q ? this.suppliers().filter((s) => s.name.toLowerCase().includes(q)) : this.suppliers();
  });

  protected readonly itemSearch = signal('');
  protected readonly filteredItemMasters = computed(() => {
    const q = this.itemSearch().toLowerCase();
    return q ? this.itemMasters().filter((i) => i.name.toLowerCase().includes(q)) : this.itemMasters();
  });

  protected readonly isEditMode = this.purchase !== null;

  protected readonly headerForm = this.fb.nonNullable.group({
    supplier_id: [this.purchase?.supplier_id ?? ('' as unknown as number), [Validators.required]],
    quotation_id: [this.purchase?.quotation_id ?? ('' as unknown as number)],
    status_id: [this.purchase?.status_id ?? ('' as unknown as number), [Validators.required]],
    currency_id: [this.purchase?.currency_id ?? ('' as unknown as number), [Validators.required]],
    date: [this.purchase?.date?.substring(0, 10) ?? new Date().toISOString().substring(0, 10), [Validators.required]],
    notes: [this.purchase?.notes ?? ''],
  });

  protected readonly itemsForm = this.fb.nonNullable.group({
    rows: this.fb.array([this.buildItemRow()]),
  });

  get rows(): FormArray {
    return this.itemsForm.controls.rows;
  }

  private buildItemRow() {
    return this.fb.nonNullable.group({
      item_master_id: ['' as unknown as number, [Validators.required]],
      unit_of_measure_id: ['' as unknown as number, [Validators.required]],
      quantity: ['' as unknown as number, [Validators.required, Validators.min(0)]],
      unit_price: ['' as unknown as number, [Validators.required, Validators.min(0)]],
    });
  }

  protected onItemSelected(index: number, itemMasterId: number): void {
    const item = this.itemMasters().find((i) => i.id === itemMasterId);
    if (item) {
      this.rows.at(index).patchValue({ unit_of_measure_id: item.unit_of_measure_id });
    }
  }

  ngOnInit(): void {
    forkJoin({
      suppliers: this.purchaseService.getSuppliers(),
      statuses: this.purchaseService.getStatuses(),
      currencies: this.purchaseService.getCurrencies(),
      itemMasters: this.purchaseService.getItemMasters(),
    }).subscribe({
      next: ({ suppliers, statuses, currencies, itemMasters }) => {
        this.suppliers.set(suppliers.suppliers);
        this.statuses.set(statuses.statuses);
        this.currencies.set(currencies.currencies);
        this.itemMasters.set(itemMasters.item_masters);
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
    if (this.headerForm.invalid || !this.purchase) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    const v = this.headerForm.getRawValue();
    const payload: UpdatePurchasePayload = {
      supplier_id: v.supplier_id,
      status_id: v.status_id,
      currency_id: v.currency_id,
      date: v.date,
      notes: v.notes || null,
      quotation_id: v.quotation_id || null,
    };

    this.purchaseService.update(this.purchase.id, payload).subscribe({
      next: () => this.dialogRef.close({ saved: true } satisfies PurchaseFormResult),
      error: () => {
        this.errorMessage.set('Failed to update purchase. Please try again.');
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
    const payload: StorePurchasePayload = {
      supplier_id: v.supplier_id,
      status_id: v.status_id,
      currency_id: v.currency_id,
      date: v.date,
      notes: v.notes || null,
      quotation_id: v.quotation_id || null,
      items: this.rows.getRawValue().map((r) => ({
        item_master_id: r.item_master_id,
        unit_of_measure_id: r.unit_of_measure_id,
        quantity: r.quantity,
        unit_price: r.unit_price,
      })),
    };

    this.purchaseService.create(payload).subscribe({
      next: () => this.dialogRef.close({ saved: true } satisfies PurchaseFormResult),
      error: () => {
        this.errorMessage.set('Failed to record purchase. Please try again.');
        this.isSaving.set(false);
      },
    });
  }
}
