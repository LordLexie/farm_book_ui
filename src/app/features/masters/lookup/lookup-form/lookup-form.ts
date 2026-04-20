import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LookupConfig, LookupItem, LookupService } from '../../../../core/services/lookup.service';

export interface LookupFormData {
  item: LookupItem | null;
  config: LookupConfig;
}

export interface LookupFormResult {
  count: number;
}

@Component({
  selector: 'app-lookup-form',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './lookup-form.html',
  styleUrl: './lookup-form.css',
})
export class LookupFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly lookupService = inject(LookupService);
  private readonly dialogRef = inject(MatDialogRef<LookupFormComponent>);
  protected readonly data: LookupFormData = inject(MAT_DIALOG_DATA);

  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal('');

  protected readonly isEditMode = this.data.item !== null;

  // Edit form
  protected readonly editForm = this.fb.nonNullable.group({
    code: [this.data.item?.code ?? '', [Validators.required]],
    name: [this.data.item?.name ?? '', [Validators.required]],
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
      code: ['', [Validators.required]],
      name: ['', [Validators.required]],
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
    if (this.editForm.invalid || !this.data.item) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    this.lookupService
      .update(this.data.config.resource, this.data.item.id, this.editForm.getRawValue())
      .subscribe({
        next: () => this.dialogRef.close({ count: 1 } satisfies LookupFormResult),
        error: () => {
          this.errorMessage.set('Failed to update. Please try again.');
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

    this.lookupService.create(this.data.config.resource, this.rows.getRawValue()).subscribe({
      next: (res) =>
        this.dialogRef.close({
          count: (res[this.data.config.responseKey] as LookupItem[]).length,
        } satisfies LookupFormResult),
      error: () => {
        this.errorMessage.set('Failed to save. Please try again.');
        this.isSaving.set(false);
      },
    });
  }
}
