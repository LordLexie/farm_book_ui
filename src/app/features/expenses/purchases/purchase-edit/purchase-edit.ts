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
  Currency,
  ItemMaster,
  Purchase,
  PurchaseService,
  PurchaseSupplier,
  Status,
  UnitOfMeasure,
  UpdatePurchasePayload,
} from '../../../../core/services/purchase.service';

@Component({
  selector: 'app-purchase-edit',
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
  templateUrl: './purchase-edit.html',
  styleUrl: './purchase-edit.css',
})
export class PurchaseEditComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly purchaseService = inject(PurchaseService);
  private readonly route = inject(ActivatedRoute);
  protected readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly purchase = signal<Purchase | null>(null);
  protected readonly suppliers = signal<PurchaseSupplier[]>([]);
  protected readonly statuses = signal<Status[]>([]);
  protected readonly currencies = signal<Currency[]>([]);
  protected readonly itemMasters = signal<ItemMaster[]>([]);
  protected readonly unitOfMeasures = signal<UnitOfMeasure[]>([]);
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

  protected readonly headerForm = this.fb.nonNullable.group({
    supplier_id: ['' as unknown as number, [Validators.required]],
    status_id: ['' as unknown as number, [Validators.required]],
    currency_id: ['' as unknown as number, [Validators.required]],
    date: ['', [Validators.required]],
    notes: [''],
  });

  protected readonly itemsForm = this.fb.nonNullable.group({
    rows: this.fb.array([this.buildItemRow()]),
  });

  get rows(): FormArray {
    return this.itemsForm.controls.rows;
  }

  private buildItemRow(
    itemMasterId: number | '' = '',
    uomId: number | '' = '',
    quantity: number | '' = '',
    unitPrice: number | '' = '',
  ) {
    return this.fb.nonNullable.group({
      item_master_id: [itemMasterId as unknown as number, [Validators.required]],
      unit_of_measure_id: [uomId as unknown as number, [Validators.required]],
      quantity: [quantity as unknown as number, [Validators.required, Validators.min(0)]],
      unit_price: [unitPrice as unknown as number, [Validators.required, Validators.min(0)]],
    });
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    forkJoin({
      purchase: this.purchaseService.getById(id),
      suppliers: this.purchaseService.getSuppliers(),
      statuses: this.purchaseService.getStatuses(),
      currencies: this.purchaseService.getCurrencies(),
      itemMasters: this.purchaseService.getItemMasters(),
      unitOfMeasures: this.purchaseService.getUnitOfMeasures(),
    }).subscribe({
      next: ({ purchase, suppliers, statuses, currencies, itemMasters, unitOfMeasures }) => {
        this.purchase.set(purchase.purchase);
        this.suppliers.set(suppliers.suppliers);
        this.statuses.set(statuses.statuses);
        this.currencies.set(currencies.currencies);
        this.itemMasters.set(itemMasters.item_masters);
        this.unitOfMeasures.set(unitOfMeasures.unit_of_measures);

        const p = purchase.purchase;
        this.headerForm.patchValue({
          supplier_id: p.supplier_id,
          status_id: p.status_id,
          currency_id: p.currency_id,
          date: p.date.substring(0, 10),
          notes: p.notes ?? '',
        });

        const itemRows = p.items.map((item) =>
          this.buildItemRow(item.item_master_id, item.unit_of_measure_id, item.quantity, item.unit_price),
        );
        this.itemsForm.setControl('rows', this.fb.array(itemRows.length ? itemRows : [this.buildItemRow()]));

        this.isLoading.set(false);
        this.recomputeTotal();
      },
      error: () => {
        this.errorMessage.set('Failed to load purchase. Please go back and try again.');
        this.isLoading.set(false);
      },
    });

    this.itemsForm.valueChanges.subscribe(() => this.recomputeTotal());
  }

  private recomputeTotal(): void {
    const total = this.rows.getRawValue().reduce(
      (sum, r) => sum + ((r.quantity ?? 0) * (r.unit_price ?? 0)),
      0,
    );
    this.computedTotal.set(total);
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
    const p = this.purchase();
    if (this.headerForm.invalid || this.itemsForm.invalid || !p) {
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
      items: this.rows.getRawValue().map((r) => ({
        item_master_id: r.item_master_id,
        unit_of_measure_id: r.unit_of_measure_id,
        quantity: r.quantity,
        unit_price: r.unit_price,
      })),
    };

    this.purchaseService.update(p.id, payload).subscribe({
      next: () => {
        this.snackBar.open('Purchase updated.', undefined, { duration: 3000 });
        this.router.navigate(['/expenses/purchases', p.id]);
      },
      error: () => {
        this.errorMessage.set('Failed to update purchase. Please try again.');
        this.isSaving.set(false);
      },
    });
  }
}
