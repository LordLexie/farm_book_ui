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
import { Gender, Supplier, SupplierPayload, SupplierService, Status } from '../../../../core/services/supplier.service';

export interface SupplierFormResult {
  saved: boolean;
}

@Component({
  selector: 'app-supplier-form',
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
  templateUrl: './supplier-form.html',
  styleUrl: './supplier-form.css',
})
export class SupplierFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly supplierService = inject(SupplierService);
  private readonly dialogRef = inject(MatDialogRef<SupplierFormComponent>);
  protected readonly supplier: Supplier | null = inject(MAT_DIALOG_DATA);

  protected readonly isLoadingOptions = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly statuses = signal<Status[]>([]);
  protected readonly genders = signal<Gender[]>([]);
  protected readonly currentType = signal<'individual' | 'organization'>(
    this.supplier?.type ?? 'individual',
  );

  protected readonly isEditMode = this.supplier !== null;

  protected readonly supplierForm = this.fb.nonNullable.group({
    type: [this.supplier?.type ?? ('individual' as 'individual' | 'organization'), [Validators.required]],
    name: [this.supplier?.name ?? '', [Validators.required]],
    email: [this.supplier?.email ?? ''],
    phone: [this.supplier?.phone ?? ''],
    address: [this.supplier?.address ?? ''],
    status_id: [this.supplier?.status_id ?? ('' as unknown as number)],
    first_name: [this.supplier?.first_name ?? '', [Validators.required]],
    last_name: [this.supplier?.last_name ?? '', [Validators.required]],
    gender_id: [this.supplier?.gender_id ?? ('' as unknown as number)],
    registration_number: [this.supplier?.registration_number ?? ''],
    contact_person: [this.supplier?.contact_person ?? ''],
  });

  ngOnInit(): void {
    forkJoin({
      statuses: this.supplierService.getStatuses(),
      genders: this.supplierService.getGenders(),
    }).subscribe({
      next: ({ statuses, genders }) => {
        this.statuses.set(statuses.statuses);
        this.genders.set(genders.genders);
        if (!this.isEditMode) {
          const active = statuses.statuses.find((s) => s.code === 'ACT');
          if (active) {
            this.supplierForm.patchValue({ status_id: active.id });
          }
        }
        this.isLoadingOptions.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load form options. Please close and try again.');
        this.isLoadingOptions.set(false);
      },
    });

    this.updateTypeValidators(this.currentType());
    this.supplierForm.controls.type.valueChanges.subscribe((type) => {
      this.currentType.set(type);
      this.updateTypeValidators(type);
    });
  }

  private updateTypeValidators(type: 'individual' | 'organization'): void {
    const { first_name, last_name } = this.supplierForm.controls;
    if (type === 'individual') {
      first_name.setValidators([Validators.required]);
      last_name.setValidators([Validators.required]);
    } else {
      first_name.clearValidators();
      last_name.clearValidators();
    }
    first_name.updateValueAndValidity();
    last_name.updateValueAndValidity();
  }

  protected submit(): void {
    if (this.supplierForm.invalid) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    const v = this.supplierForm.getRawValue();
    const payload: SupplierPayload = {
      type: v.type,
      name: v.name,
      email: v.email || null,
      phone: v.phone || null,
      address: v.address || null,
      first_name: v.type === 'individual' ? v.first_name || null : null,
      last_name: v.type === 'individual' ? v.last_name || null : null,
      gender_id: v.type === 'individual' ? (v.gender_id || null) : null,
      registration_number: v.type === 'organization' ? v.registration_number || null : null,
      contact_person: v.type === 'organization' ? v.contact_person || null : null,
    };

    if (v.status_id) {
      payload.status_id = v.status_id;
    }

    const obs$ = this.isEditMode
      ? this.supplierService.update(this.supplier!.id, payload)
      : this.supplierService.create(payload);

    obs$.subscribe({
      next: () => this.dialogRef.close({ saved: true } satisfies SupplierFormResult),
      error: () => {
        this.errorMessage.set(
          `Failed to ${this.isEditMode ? 'update' : 'create'} supplier. Please try again.`,
        );
        this.isSaving.set(false);
      },
    });
  }
}
