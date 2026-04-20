import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Farm, FarmService, Status } from '../../../../core/services/farm.service';

@Component({
  selector: 'app-farm-form',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './farm-form.html',
  styleUrl: './farm-form.css',
})
export class FarmFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(FarmService);
  private readonly dialogRef = inject(MatDialogRef<FarmFormComponent>);
  protected readonly farm: Farm | null = inject(MAT_DIALOG_DATA);

  protected readonly isLoadingOptions = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly statuses = signal<Status[]>([]);

  protected readonly isEditMode = this.farm !== null;

  protected readonly form = this.fb.nonNullable.group({
    name: [this.farm?.name ?? '', [Validators.required, Validators.maxLength(255)]],
    latitude: [this.farm?.latitude ?? ''],
    longitude: [this.farm?.longitude ?? ''],
    status_id: [this.farm?.status_id ?? ('' as unknown as number)],
  });

  ngOnInit(): void {
    if (this.isEditMode) {
      this.isLoadingOptions.set(true);
      this.service.getStatuses().subscribe({
        next: (res) => {
          this.statuses.set(res.statuses);
          this.isLoadingOptions.set(false);
        },
        error: () => {
          this.errorMessage.set('Failed to load statuses. Please close and try again.');
          this.isLoadingOptions.set(false);
        },
      });
    }
  }

  protected submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    const value = this.form.getRawValue();
    const payload = {
      name: value.name,
      latitude: value.latitude || null,
      longitude: value.longitude || null,
      ...(this.isEditMode && value.status_id ? { status_id: value.status_id } : {}),
    };

    if (this.isEditMode && this.farm) {
      this.service.update(this.farm.id, payload).subscribe({
        next: (res) => this.dialogRef.close(res.farm),
        error: () => {
          this.errorMessage.set('Failed to update farm. Please try again.');
          this.isSaving.set(false);
        },
      });
    } else {
      this.service.create(payload).subscribe({
        next: (res) => this.dialogRef.close(res.farm),
        error: () => {
          this.errorMessage.set('Failed to create farm. Please try again.');
          this.isSaving.set(false);
        },
      });
    }
  }
}
