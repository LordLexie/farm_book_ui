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
import { forkJoin } from 'rxjs';
import {
  ItemCategory,
  ItemMaster,
  ItemMasterFormData,
  ItemMasterService,
  UnitOfMeasure,
} from '../../../../core/services/item-master.service';

export interface ItemMasterFormResult {
  count: number;
}

@Component({
  selector: 'app-item-master-form',
  imports: [
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
  templateUrl: './item-master-form.html',
  styleUrl: './item-master-form.css',
})
export class ItemMasterFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ItemMasterService);
  private readonly dialogRef = inject(MatDialogRef<ItemMasterFormComponent>);
  protected readonly item: ItemMaster | null = inject(MAT_DIALOG_DATA);

  protected readonly isLoadingOptions = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly categories = signal<ItemCategory[]>([]);
  protected readonly unitsOfMeasure = signal<UnitOfMeasure[]>([]);

  protected readonly categorySearch = signal('');
  protected readonly filteredCategories = computed(() => {
    const q = this.categorySearch().toLowerCase();
    return q ? this.categories().filter((c) => c.name.toLowerCase().includes(q)) : this.categories();
  });

  protected readonly isEditMode = this.item !== null;

  // Edit form (single item)
  protected readonly editForm = this.fb.nonNullable.group({
    name: [this.item?.name ?? '', [Validators.required, Validators.maxLength(255)]],
    description: [this.item?.description ?? ''],
    item_category_id: [this.item?.item_category_id ?? ('' as unknown as number), [Validators.required]],
    unit_of_measure_id: [this.item?.unit_of_measure_id ?? ('' as unknown as number), [Validators.required]],
  });

  // Add form (bulk rows)
  protected readonly addForm = this.fb.nonNullable.group({
    rows: this.fb.array([this.buildRow()]),
  });

  get rows(): FormArray {
    return this.addForm.controls.rows;
  }

  private buildRow() {
    return this.fb.nonNullable.group({
      name: ['' as string, [Validators.required, Validators.maxLength(255)]],
      item_category_id: ['' as unknown as number, [Validators.required]],
      unit_of_measure_id: ['' as unknown as number, [Validators.required]],
    });
  }

  ngOnInit(): void {
    forkJoin({
      categories: this.service.getCategories(),
      units: this.service.getUnitsOfMeasure(),
    }).subscribe({
      next: ({ categories, units }) => {
        this.categories.set(categories.item_categories);
        this.unitsOfMeasure.set(units.unit_of_measures);
        this.isLoadingOptions.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load form options. Please close and try again.');
        this.isLoadingOptions.set(false);
      },
    });
  }

  protected addRow(): void {
    this.rows.push(this.buildRow());
  }

  protected removeRow(index: number): void {
    if (this.rows.length > 1) {
      this.rows.removeAt(index);
    }
  }

  protected submit(): void {
    if (this.isEditMode) {
      this.submitEdit();
    } else {
      this.submitAdd();
    }
  }

  private submitEdit(): void {
    if (this.editForm.invalid || !this.item) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    const value = this.editForm.getRawValue();

    this.service
      .update(this.item.id, {
        name: value.name,
        description: value.description || null,
        item_category_id: value.item_category_id,
        unit_of_measure_id: value.unit_of_measure_id,
      })
      .subscribe({
        next: () => this.dialogRef.close({ count: 1 } satisfies ItemMasterFormResult),
        error: () => {
          this.errorMessage.set('Failed to update item master. Please try again.');
          this.isSaving.set(false);
        },
      });
  }

  private submitAdd(): void {
    if (this.addForm.invalid) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    const items: ItemMasterFormData[] = this.rows.getRawValue().map((row) => ({
      name: row.name,
      description: null,
      item_category_id: row.item_category_id,
      unit_of_measure_id: row.unit_of_measure_id,
    }));

    this.service.create(items).subscribe({
      next: (res) =>
        this.dialogRef.close({ count: res.item_masters.length } satisfies ItemMasterFormResult),
      error: () => {
        this.errorMessage.set('Failed to create item masters. Please try again.');
        this.isSaving.set(false);
      },
    });
  }
}
