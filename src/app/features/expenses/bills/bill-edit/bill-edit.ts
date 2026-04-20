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
  Bill,
  BillItemPayload,
  BillService,
  BillService as BillServiceItem,
  BillSupplier,
  Currency,
  Status,
  UnitOfMeasure,
  UpdateBillPayload,
} from '../../../../core/services/bill.service';

@Component({
  selector: 'app-bill-edit',
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
  templateUrl: './bill-edit.html',
  styleUrl: './bill-edit.css',
})
export class BillEditComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly billService = inject(BillService);
  private readonly route = inject(ActivatedRoute);
  protected readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly bill = signal<Bill | null>(null);
  protected readonly suppliers = signal<BillSupplier[]>([]);
  protected readonly statuses = signal<Status[]>([]);
  protected readonly currencies = signal<Currency[]>([]);
  protected readonly services = signal<BillServiceItem[]>([]);
  protected readonly unitOfMeasures = signal<UnitOfMeasure[]>([]);
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
    serviceId: number | '' = '',
    uomId: number | '' = '',
    quantity: number | '' = '',
    unitPrice: number | '' = '',
  ) {
    return this.fb.nonNullable.group({
      service_id: [serviceId as unknown as number, [Validators.required]],
      unit_of_measure_id: [uomId as unknown as number, [Validators.required]],
      quantity: [quantity as unknown as number, [Validators.required, Validators.min(0)]],
      unit_price: [unitPrice as unknown as number, [Validators.required, Validators.min(0)]],
    });
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    forkJoin({
      bill: this.billService.getById(id),
      suppliers: this.billService.getSuppliers(),
      statuses: this.billService.getStatuses(),
      currencies: this.billService.getCurrencies(),
      services: this.billService.getServices(),
      unitOfMeasures: this.billService.getUnitOfMeasures(),
    }).subscribe({
      next: ({ bill, suppliers, statuses, currencies, services, unitOfMeasures }) => {
        this.bill.set(bill.bill);
        this.suppliers.set(suppliers.suppliers);
        this.statuses.set(statuses.statuses);
        this.currencies.set(currencies.currencies);
        this.services.set(services.services);
        this.unitOfMeasures.set(unitOfMeasures.unit_of_measures);

        const b = bill.bill;
        this.headerForm.patchValue({
          supplier_id: b.supplier_id,
          status_id: b.status_id,
          currency_id: b.currency_id,
          date: b.date.substring(0, 10),
          notes: b.notes ?? '',
        });

        const itemRows = b.items.map((item) =>
          this.buildItemRow(item.service_id, item.unit_of_measure_id, item.quantity, item.unit_price),
        );
        this.itemsForm.setControl('rows', this.fb.array(itemRows.length ? itemRows : [this.buildItemRow()]));

        this.isLoading.set(false);
        this.recomputeTotal();
      },
      error: () => {
        this.errorMessage.set('Failed to load bill. Please go back and try again.');
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
    const b = this.bill();
    if (this.headerForm.invalid || this.itemsForm.invalid || !b) {
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
      items: this.rows.getRawValue().map((r): BillItemPayload => ({
        service_id: r.service_id,
        unit_of_measure_id: r.unit_of_measure_id,
        quantity: r.quantity,
        unit_price: r.unit_price,
      })),
    };

    this.billService.update(b.id, payload).subscribe({
      next: () => {
        this.snackBar.open('Bill updated.', undefined, { duration: 3000 });
        this.router.navigate(['/expenses/bills', b.id]);
      },
      error: () => {
        this.errorMessage.set('Failed to update bill. Please try again.');
        this.isSaving.set(false);
      },
    });
  }
}
