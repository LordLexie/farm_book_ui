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
  Customer,
  CustomerBillingCycle,
  CustomerGender,
  CustomerPayload,
  CustomerService,
} from '../../../../core/services/customer.service';

export interface CustomerFormResult {
  saved: boolean;
}

@Component({
  selector: 'app-customer-form',
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
  templateUrl: './customer-form.html',
  styleUrl: './customer-form.css',
})
export class CustomerFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly customerService = inject(CustomerService);
  private readonly dialogRef = inject(MatDialogRef<CustomerFormComponent>);
  protected readonly customer: Customer | null = inject(MAT_DIALOG_DATA);

  protected readonly isLoadingOptions = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly genders = signal<CustomerGender[]>([]);
  protected readonly billingCycles = signal<CustomerBillingCycle[]>([]);
  protected readonly currentType = signal<'individual' | 'organization'>(
    this.customer?.type ?? 'individual',
  );

  protected readonly isEditMode = this.customer !== null;

  protected readonly customerForm = this.fb.nonNullable.group({
    type: [this.customer?.type ?? ('individual' as 'individual' | 'organization'), [Validators.required]],
    name: [this.customer?.name ?? '', [Validators.required]],
    email: [this.customer?.email ?? ''],
    phone: [this.customer?.phone ?? ''],
    address: [this.customer?.address ?? ''],
    billing_cycle_id: [this.customer?.billing_cycle_id ?? ('' as unknown as number)],
    first_name: [this.customer?.first_name ?? '', [Validators.required]],
    last_name: [this.customer?.last_name ?? '', [Validators.required]],
    gender_id: [this.customer?.gender_id ?? ('' as unknown as number)],
    registration_number: [this.customer?.registration_number ?? ''],
    contact_person: [this.customer?.contact_person ?? ''],
  });

  ngOnInit(): void {
    forkJoin({
      genders: this.customerService.getGenders(),
      billingCycles: this.customerService.getBillingCycles(),
    }).subscribe({
      next: ({ genders, billingCycles }) => {
        this.genders.set(genders.genders);
        this.billingCycles.set(billingCycles.billing_cycles);

        if (!this.isEditMode && billingCycles.billing_cycles.length) {
          this.customerForm.controls.billing_cycle_id.setValue(billingCycles.billing_cycles[0].id);
        }

        this.isLoadingOptions.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load form options. Please close and try again.');
        this.isLoadingOptions.set(false);
      },
    });

    this.updateTypeValidators(this.currentType());
    this.customerForm.controls.type.valueChanges.subscribe((type) => {
      this.currentType.set(type);
      this.updateTypeValidators(type);
    });
  }

  private updateTypeValidators(type: 'individual' | 'organization'): void {
    const { first_name, last_name } = this.customerForm.controls;
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
    if (this.customerForm.invalid) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    const v = this.customerForm.getRawValue();
    const payload: CustomerPayload = {
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

    if (v.billing_cycle_id) {
      payload.billing_cycle_id = v.billing_cycle_id;
    }

    const obs$ = this.isEditMode
      ? this.customerService.update(this.customer!.id, payload)
      : this.customerService.create(payload);

    obs$.subscribe({
      next: () => this.dialogRef.close({ saved: true } satisfies CustomerFormResult),
      error: () => {
        this.errorMessage.set(
          `Failed to ${this.isEditMode ? 'update' : 'create'} customer. Please try again.`,
        );
        this.isSaving.set(false);
      },
    });
  }
}
