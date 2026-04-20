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
import { FarmItem, FarmItemService } from '../../../../core/services/farm-item.service';
import { Farm, FarmService, Status } from '../../../../core/services/farm.service';
import { ItemMaster, ItemMasterService } from '../../../../core/services/item-master.service';

export interface FarmItemFormResult {
  count: number;
}

@Component({
  selector: 'app-farm-item-form',
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
  templateUrl: './farm-item-form.html',
  styleUrl: './farm-item-form.css',
})
export class FarmItemFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly farmItemService = inject(FarmItemService);
  private readonly farmService = inject(FarmService);
  private readonly itemMasterService = inject(ItemMasterService);
  private readonly dialogRef = inject(MatDialogRef<FarmItemFormComponent>);
  protected readonly farmItem: FarmItem | null = inject(MAT_DIALOG_DATA);

  protected readonly isLoadingOptions = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly farms = signal<Farm[]>([]);
  protected readonly itemMasters = signal<ItemMaster[]>([]);
  protected readonly statuses = signal<Status[]>([]);

  protected readonly itemSearch = signal('');
  protected readonly filteredItemMasters = computed(() => {
    const q = this.itemSearch().toLowerCase();
    return q ? this.itemMasters().filter((i) => i.name.toLowerCase().includes(q)) : this.itemMasters();
  });

  protected readonly isEditMode = this.farmItem !== null;

  // Edit form (single item — status focus)
  protected readonly editForm = this.fb.nonNullable.group({
    farm_id: [this.farmItem?.farm_id ?? ('' as unknown as number), [Validators.required]],
    item_master_id: [this.farmItem?.item_master_id ?? ('' as unknown as number), [Validators.required]],
    quantity: [this.farmItem?.quantity ?? ('' as unknown as number), [Validators.required, Validators.min(0)]],
    status_id: [this.farmItem?.status_id ?? ('' as unknown as number), [Validators.required]],
  });

  // Add form (FormArray for bulk rows)
  protected readonly addForm = this.fb.nonNullable.group({
    rows: this.fb.array([this.buildRow()]),
  });

  get rows(): FormArray {
    return this.addForm.controls.rows;
  }

  private buildRow() {
    return this.fb.nonNullable.group({
      farm_id: ['' as unknown as number, [Validators.required]],
      item_master_id: ['' as unknown as number, [Validators.required]],
      quantity: ['' as unknown as number, [Validators.required, Validators.min(0)]],
    });
  }

  ngOnInit(): void {
    forkJoin({
      farms: this.farmService.getAll(),
      items: this.itemMasterService.getAll(1, 100),
      statuses: this.farmService.getStatuses(),
    }).subscribe({
      next: ({ farms, items, statuses }) => {
        this.farms.set(farms.farms);
        this.itemMasters.set(items.item_masters);
        this.statuses.set(statuses.statuses);
        if (!this.isEditMode && farms.farms.length) {
          this.rows.at(0).patchValue({ farm_id: farms.farms[0].id });
        }
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
    if (this.editForm.invalid || !this.farmItem) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    const value = this.editForm.getRawValue();

    this.farmItemService
      .update(this.farmItem.id, {
        farm_id: value.farm_id,
        item_master_id: value.item_master_id,
        quantity: value.quantity,
        status_id: value.status_id,
      })
      .subscribe({
        next: () => this.dialogRef.close({ count: 1 } satisfies FarmItemFormResult),
        error: () => {
          this.errorMessage.set('Failed to update farm item. Please try again.');
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

    const items = this.rows.getRawValue().map((row) => ({
      farm_id: row.farm_id,
      item_master_id: row.item_master_id,
      quantity: row.quantity,
    }));

    this.farmItemService.create(items).subscribe({
      next: (res) => this.dialogRef.close({ count: res.farm_items.length } satisfies FarmItemFormResult),
      error: () => {
        this.errorMessage.set('Failed to add farm items. Please try again.');
        this.isSaving.set(false);
      },
    });
  }
}
