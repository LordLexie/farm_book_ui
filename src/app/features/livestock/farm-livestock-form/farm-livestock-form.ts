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
  FarmLivestock,
  FarmLivestockPayload,
  FarmLivestockService,
  LivestockFarm,
  LivestockGender,
  LivestockStatus,
  LivestockType,
} from '../../../core/services/farm-livestock.service';

export interface FarmLivestockFormResult {
  saved: boolean;
}

@Component({
  selector: 'app-farm-livestock-form',
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
  templateUrl: './farm-livestock-form.html',
  styleUrl: './farm-livestock-form.css',
})
export class FarmLivestockFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly livestockService = inject(FarmLivestockService);
  private readonly dialogRef = inject(MatDialogRef<FarmLivestockFormComponent>);
  protected readonly livestock: FarmLivestock | null = inject(MAT_DIALOG_DATA);

  protected readonly isLoadingOptions = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly farms = signal<LivestockFarm[]>([]);
  protected readonly livestockTypes = signal<LivestockType[]>([]);
  protected readonly genders = signal<LivestockGender[]>([]);
  protected readonly statuses = signal<LivestockStatus[]>([]);

  protected readonly isEditMode = this.livestock !== null;

  protected readonly form = this.fb.nonNullable.group({
    farm_id: [this.livestock?.farm_id ?? ('' as unknown as number), [Validators.required]],
    livestock_type_id: [
      this.livestock?.livestock_type_id ?? ('' as unknown as number),
      [Validators.required],
    ],
    gender_id: [this.livestock?.gender_id ?? ('' as unknown as number), [Validators.required]],
    name: [this.livestock?.name ?? ''],
    breed: [this.livestock?.breed ?? ''],
    date_of_birth: [this.livestock?.date_of_birth ?? ''],
    description: [this.livestock?.description ?? ''],
    status_id: [this.livestock?.status_id ?? ('' as unknown as number)],
  });

  ngOnInit(): void {
    forkJoin({
      farms: this.livestockService.getFarms(),
      types: this.livestockService.getLivestockTypes(),
      genders: this.livestockService.getGenders(),
      statuses: this.livestockService.getStatuses(),
    }).subscribe({
      next: ({ farms, types, genders, statuses }) => {
        this.farms.set(farms.farms);
        this.livestockTypes.set(types.livestock_types);
        this.genders.set(genders.genders);
        this.statuses.set(statuses.statuses);
        this.isLoadingOptions.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load form options. Please close and try again.');
        this.isLoadingOptions.set(false);
      },
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    const v = this.form.getRawValue();
    const payload: FarmLivestockPayload = {
      farm_id: v.farm_id,
      livestock_type_id: v.livestock_type_id,
      gender_id: v.gender_id,
      name: v.name || null,
      breed: v.breed || null,
      date_of_birth: v.date_of_birth || null,
      description: v.description || null,
    };

    if (this.isEditMode && v.status_id) {
      payload.status_id = v.status_id;
    }

    const onSuccess = () => this.dialogRef.close({ saved: true } satisfies FarmLivestockFormResult);
    const onError = () => {
      this.errorMessage.set(
        `Failed to ${this.isEditMode ? 'update' : 'create'} livestock. Please try again.`,
      );
      this.isSaving.set(false);
    };

    if (this.isEditMode) {
      this.livestockService.update(this.livestock!.id, payload).subscribe({ next: onSuccess, error: onError });
    } else {
      this.livestockService.create(payload).subscribe({ next: onSuccess, error: onError });
    }
  }
}
