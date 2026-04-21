import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin } from 'rxjs';
import {
  ConsumptionFarmItem,
  ConsumptionLivestock,
  FarmConsumption,
  FarmConsumptionPayload,
  FarmConsumptionService,
} from '../../../core/services/farm-consumption.service';

export interface FarmConsumptionFormResult {
  saved: boolean;
}

@Component({
  selector: 'app-farm-consumption-form',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './farm-consumption-form.html',
  styleUrl: './farm-consumption-form.css',
})
export class FarmConsumptionFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly consumptionService = inject(FarmConsumptionService);
  private readonly dialogRef = inject(MatDialogRef<FarmConsumptionFormComponent>);
  protected readonly consumption: FarmConsumption | null = inject(MAT_DIALOG_DATA);

  protected readonly isLoadingOptions = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly farmItems = signal<ConsumptionFarmItem[]>([]);
  protected readonly livestocks = signal<ConsumptionLivestock[]>([]);

  protected readonly isEditMode = this.consumption !== null;

  protected readonly form = this.fb.nonNullable.group({
    farm_item_id: [
      this.consumption?.farm_item_id ?? ('' as unknown as number),
      [Validators.required],
    ],
    quantity: [
      this.consumption?.quantity ?? ('' as unknown as number),
      [Validators.required, Validators.min(0)],
    ],
    consumption_date: [this.consumption?.consumption_date ?? new Date().toISOString().split('T')[0], [Validators.required]],
    livestock_id: [this.consumption?.livestock_id ?? ('' as unknown as number)],
  });

  ngOnInit(): void {
    forkJoin({
      farmItems: this.consumptionService.getFarmItems(),
      livestocks: this.consumptionService.getLivestocks(),
    }).subscribe({
      next: ({ farmItems, livestocks }) => {
        this.farmItems.set(farmItems.farm_items);
        this.livestocks.set(livestocks.farm_livestocks);
        this.isLoadingOptions.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load form options. Please close and try again.');
        this.isLoadingOptions.set(false);
      },
    });
  }

  protected farmItemLabel(item: ConsumptionFarmItem): string {
    return item.item_master?.name ? `${item.code} — ${item.item_master.name}` : item.code;
  }

  protected livestockLabel(item: ConsumptionLivestock): string {
    return item.name ? `${item.code} — ${item.name}` : item.code;
  }

  protected submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    const v = this.form.getRawValue();
    const payload: FarmConsumptionPayload = {
      farm_item_id: v.farm_item_id,
      quantity: v.quantity,
      consumption_date: v.consumption_date,
      livestock_id: v.livestock_id || null,
    };

    const onSuccess = () =>
      this.dialogRef.close({ saved: true } satisfies FarmConsumptionFormResult);
    const onError = () => {
      this.errorMessage.set(
        `Failed to ${this.isEditMode ? 'update' : 'record'} consumption. Please try again.`,
      );
      this.isSaving.set(false);
    };

    if (this.isEditMode) {
      this.consumptionService.update(this.consumption!.id, payload).subscribe({ next: onSuccess, error: onError });
    } else {
      this.consumptionService.create(payload).subscribe({ next: onSuccess, error: onError });
    }
  }
}
