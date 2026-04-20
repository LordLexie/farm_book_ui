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
import { Service, ServiceService, ServiceType, Status, UnitOfMeasure } from '../../../../core/services/service.service';

export interface ServiceFormResult {
  count: number;
}

@Component({
  selector: 'app-service-form',
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
  templateUrl: './service-form.html',
  styleUrl: './service-form.css',
})
export class ServiceFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly serviceService = inject(ServiceService);
  private readonly dialogRef = inject(MatDialogRef<ServiceFormComponent>);
  protected readonly service: Service | null = inject(MAT_DIALOG_DATA);

  protected readonly isLoadingOptions = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly serviceTypes = signal<ServiceType[]>([]);
  protected readonly unitOfMeasures = signal<UnitOfMeasure[]>([]);
  protected readonly statuses = signal<Status[]>([]);
  protected readonly defaultStatusId = signal<number | null>(null);

  protected readonly serviceTypeSearch = signal('');
  protected readonly filteredServiceTypes = computed(() => {
    const q = this.serviceTypeSearch().toLowerCase();
    return q ? this.serviceTypes().filter((t) => t.name.toLowerCase().includes(q)) : this.serviceTypes();
  });

  protected readonly isEditMode = this.service !== null;

  // Edit form (single service)
  protected readonly editForm = this.fb.nonNullable.group({
    name: [this.service?.name ?? '', [Validators.required]],
    description: [this.service?.description ?? ''],
    service_type_id: [this.service?.service_type_id ?? ('' as unknown as number), [Validators.required]],
    unit_of_measure_id: [this.service?.unit_of_measure_id ?? ('' as unknown as number), [Validators.required]],
    status_id: [this.service?.status_id ?? ('' as unknown as number), [Validators.required]],
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
      name: ['', [Validators.required]],
      service_type_id: ['' as unknown as number, [Validators.required]],
    });
  }

  ngOnInit(): void {
    forkJoin({
      types: this.serviceService.getServiceTypes(),
      unitOfMeasures: this.serviceService.getUnitOfMeasures(),
      statuses: this.serviceService.getStatuses(),
    }).subscribe({
      next: ({ types, unitOfMeasures, statuses }) => {
        this.serviceTypes.set(types.service_types);
        this.unitOfMeasures.set(unitOfMeasures.unit_of_measures);
        this.statuses.set(statuses.statuses);
        const active = statuses.statuses.find((s) => s.code === 'ACT');
        this.defaultStatusId.set(active?.id ?? statuses.statuses[0]?.id ?? null);
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
    if (this.editForm.invalid || !this.service) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    const value = this.editForm.getRawValue();

    this.serviceService
      .update(this.service.id, {
        name: value.name,
        description: value.description || null,
        service_type_id: value.service_type_id,
        unit_of_measure_id: value.unit_of_measure_id,
        status_id: value.status_id,
      })
      .subscribe({
        next: () => this.dialogRef.close({ count: 1 } satisfies ServiceFormResult),
        error: () => {
          this.errorMessage.set('Failed to update service. Please try again.');
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

    const services = this.rows.getRawValue().map((row) => ({
      name: row.name,
      service_type_id: row.service_type_id,
      status_id: this.defaultStatusId()!,
    }));

    this.serviceService.create(services).subscribe({
      next: (res) => this.dialogRef.close({ count: res.services.length } satisfies ServiceFormResult),
      error: () => {
        this.errorMessage.set('Failed to add services. Please try again.');
        this.isSaving.set(false);
      },
    });
  }
}
