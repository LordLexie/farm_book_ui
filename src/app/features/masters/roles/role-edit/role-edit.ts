import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { Permission, PermissionService } from '../../../../core/services/permission.service';
import { Role, RoleService } from '../../../../core/services/role.service';

interface PermissionRow {
  permission: Permission;
  checked: boolean;
}

@Component({
  selector: 'app-role-edit',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './role-edit.html',
  styleUrl: './role-edit.css',
})
export class RoleEditComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly roleService = inject(RoleService);
  private readonly permissionService = inject(PermissionService);
  private readonly route = inject(ActivatedRoute);
  protected readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly role = signal<Role | null>(null);
  protected readonly permissionRows = signal<PermissionRow[]>([]);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    forkJoin({
      role: this.roleService.getById(id),
      permissions: this.permissionService.getAllUnpaginated(),
    }).subscribe({
      next: ({ role, permissions }) => {
        this.role.set(role.role);
        this.form.patchValue({ name: role.role.name });
        const assigned = new Set(role.role.permissions.map((p) => p.name));
        this.permissionRows.set(
          permissions.map((p) => ({ permission: p, checked: assigned.has(p.name) })),
        );
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load role. Please go back and try again.');
        this.isLoading.set(false);
      },
    });
  }

  protected togglePermission(row: PermissionRow): void {
    row.checked = !row.checked;
  }

  protected submit(): void {
    const r = this.role();
    if (this.form.invalid || !r) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    const permissions = this.permissionRows()
      .filter((row) => row.checked)
      .map((row) => row.permission.name);

    forkJoin([
      this.roleService.update(r.id, { name: this.form.getRawValue().name }),
      this.roleService.syncPermissions(r.id, permissions),
    ]).subscribe({
      next: () => {
        this.snackBar.open('Role updated.', undefined, { duration: 3000 });
        this.router.navigate(['/masters/roles']);
      },
      error: () => {
        this.errorMessage.set('Failed to update role. Please try again.');
        this.isSaving.set(false);
      },
    });
  }
}
