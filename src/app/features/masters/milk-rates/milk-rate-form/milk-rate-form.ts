import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin } from 'rxjs';
import {
  MilkRate,
  MilkRatePlan,
  MilkRateService,
} from '../../../../core/services/milk-rate.service';

export interface MilkRateFormResult {
  saved: boolean;
}

@Component({
  selector: 'app-milk-rate-form',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './milk-rate-form.html',
  styleUrl: './milk-rate-form.css',
})
export class MilkRateFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(MilkRateService);
  private readonly dialogRef = inject(MatDialogRef<MilkRateFormComponent>);
  protected readonly milkRate: MilkRate | null = inject(MAT_DIALOG_DATA);

  protected readonly isLoadingOptions = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly availablePlans = signal<MilkRatePlan[]>([]);

  protected readonly isEditMode = this.milkRate !== null;

  protected readonly form = this.fb.nonNullable.group({
    rate_plan_id: [this.milkRate?.rate_plan_id ?? ('' as unknown as number), [Validators.required]],
    price: [this.milkRate?.price ?? ('' as unknown as number), [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    if (this.isEditMode) {
      this.isLoadingOptions.set(false);
      return;
    }

    forkJoin({
      plans: this.service.getRatePlans(),
      rates: this.service.getAll(),
    }).subscribe({
      next: ({ plans, rates }) => {
        const assignedIds = new Set(rates.milk_rates.map((r) => r.rate_plan_id));
        this.availablePlans.set(plans.rate_plans.filter((p) => !assignedIds.has(p.id)));
        this.isLoadingOptions.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load options. Please close and try again.');
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

    const obs$ = this.isEditMode
      ? this.service.update(this.milkRate!.id, { price: v.price })
      : this.service.create({ rate_plan_id: v.rate_plan_id, price: v.price });

    obs$.subscribe({
      next: () => this.dialogRef.close({ saved: true } satisfies MilkRateFormResult),
      error: () => {
        this.errorMessage.set(
          `Failed to ${this.isEditMode ? 'update' : 'create'} milk rate. Please try again.`,
        );
        this.isSaving.set(false);
      },
    });
  }
}
