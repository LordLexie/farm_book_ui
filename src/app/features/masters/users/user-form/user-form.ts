import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AppUser, UserService } from '../../../../core/services/user.service';
import { Role, RoleService } from '../../../../core/services/role.service';

@Component({
  selector: 'app-user-form',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './user-form.html',
  styleUrl: './user-form.css',
})
export class UserFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly roleService = inject(RoleService);
  private readonly dialogRef = inject(MatDialogRef<UserFormComponent>);
  protected readonly user: AppUser | null = inject(MAT_DIALOG_DATA);

  protected readonly isLoadingRoles = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly roles = signal<Role[]>([]);

  protected readonly isEditMode = this.user !== null;

  protected readonly form = this.fb.nonNullable.group({
    name: [this.user?.name ?? '', [Validators.required, Validators.maxLength(255)]],
    email: [this.user?.email ?? '', [Validators.required, Validators.email]],
    password: ['', this.isEditMode ? [] : [Validators.required, Validators.minLength(8)]],
    role: [this.user?.roles[0]?.name ?? '', [Validators.required]],
  });

  ngOnInit(): void {
    this.roleService.getAll(1, 100).subscribe({
      next: (res) => {
        this.roles.set(res.roles);
        this.isLoadingRoles.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load roles. Please close and try again.');
        this.isLoadingRoles.set(false);
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

    if (this.isEditMode && this.user) {
      this.userService.update(this.user.id, { name: v.name, email: v.email, role: v.role }).subscribe({
        next: (res) => this.dialogRef.close(res.user),
        error: () => {
          this.errorMessage.set('Failed to update user. Please try again.');
          this.isSaving.set(false);
        },
      });
    } else {
      this.userService.create({ name: v.name, email: v.email, password: v.password, role: v.role }).subscribe({
        next: (res) => this.dialogRef.close(res.user),
        error: () => {
          this.errorMessage.set('Failed to create user. Please try again.');
          this.isSaving.set(false);
        },
      });
    }
  }
}
