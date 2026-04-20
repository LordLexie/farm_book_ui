import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Permission, PermissionService } from '../../../../core/services/permission.service';
import { Role, RoleService } from '../../../../core/services/role.service';

interface PermissionRow {
  permission: Permission;
  checked: boolean;
}

@Component({
  selector: 'app-role-form',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './role-form.html',
  styleUrl: './role-form.css',
})
export class RoleFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly roleService = inject(RoleService);
  private readonly permissionService = inject(PermissionService);
  private readonly dialogRef = inject(MatDialogRef<RoleFormComponent>);
  protected readonly role: Role | null = inject(MAT_DIALOG_DATA);

  protected readonly isLoadingOptions = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly permissionRows = signal<PermissionRow[]>([]);

  protected readonly isEditMode = this.role !== null;

  protected readonly form = this.fb.nonNullable.group({
    name: [this.role?.name ?? '', [Validators.required, Validators.maxLength(255)]],
  });

  ngOnInit(): void {
    if (this.isEditMode) {
      this.isLoadingOptions.set(true);
      this.permissionService.getAll().subscribe({
        next: (res) => {
          const assigned = new Set(this.role!.permissions.map((p) => p.name));
          this.permissionRows.set(
            res.permissions.map((p) => ({ permission: p, checked: assigned.has(p.name) })),
          );
          this.isLoadingOptions.set(false);
        },
        error: () => {
          this.errorMessage.set('Failed to load permissions. Please close and try again.');
          this.isLoadingOptions.set(false);
        },
      });
    }
  }

  protected togglePermission(row: PermissionRow): void {
    row.checked = !row.checked;
  }

  protected submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    if (this.isEditMode && this.role) {
      const permissions = this.permissionRows()
        .filter((r) => r.checked)
        .map((r) => r.permission.name);

      this.roleService.syncPermissions(this.role.id, permissions).subscribe({
        next: (res) => this.dialogRef.close(res.role),
        error: () => {
          this.errorMessage.set('Failed to update permissions. Please try again.');
          this.isSaving.set(false);
        },
      });
    } else {
      this.roleService.create({ name: this.form.getRawValue().name }).subscribe({
        next: (res) => this.dialogRef.close(res.role),
        error: () => {
          this.errorMessage.set('Failed to create role. Please try again.');
          this.isSaving.set(false);
        },
      });
    }
  }
}
