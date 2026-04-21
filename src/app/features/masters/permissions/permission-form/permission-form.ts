import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Permission, PermissionService } from '../../../../core/services/permission.service';

@Component({
  selector: 'app-permission-form',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './permission-form.html',
})
export class PermissionFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(PermissionService);
  private readonly dialogRef = inject(MatDialogRef<PermissionFormComponent>);
  protected readonly permission: Permission | null = inject(MAT_DIALOG_DATA);

  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly isEditMode = this.permission !== null;

  protected readonly form = this.fb.nonNullable.group({
    name: [this.permission?.name ?? '', [Validators.required, Validators.maxLength(255)]],
  });

  protected submit(): void {
    if (this.form.invalid) return;

    this.isSaving.set(true);
    this.errorMessage.set('');
    const name = this.form.getRawValue().name;

    if (this.isEditMode && this.permission) {
      this.service.update(this.permission.id, name).subscribe({
        next: (res) => this.dialogRef.close(res.permission),
        error: () => {
          this.errorMessage.set('Failed to update permission. Please try again.');
          this.isSaving.set(false);
        },
      });
    } else {
      this.service.create(name).subscribe({
        next: (res) => this.dialogRef.close(res.permission),
        error: () => {
          this.errorMessage.set('Failed to create permission. Please try again.');
          this.isSaving.set(false);
        },
      });
    }
  }
}
