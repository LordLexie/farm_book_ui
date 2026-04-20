import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin } from 'rxjs';
import {
  MilkLivestock,
  MilkProduction,
  MilkProductionPayload,
  MilkProductionService,
  MilkSession,
} from '../../../core/services/milk-production.service';

export interface MilkProductionFormResult {
  saved: boolean;
}

@Component({
  selector: 'app-milk-production-form',
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
  templateUrl: './milk-production-form.html',
  styleUrl: './milk-production-form.css',
})
export class MilkProductionFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly milkProductionService = inject(MilkProductionService);
  private readonly dialogRef = inject(MatDialogRef<MilkProductionFormComponent>);
  protected readonly milkProduction: MilkProduction | null = inject(MAT_DIALOG_DATA);

  protected readonly isLoadingOptions = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly sessions = signal<MilkSession[]>([]);
  protected readonly livestocks = signal<MilkLivestock[]>([]);
  protected readonly livestockSearch = signal('');

  protected readonly filteredLivestocks = computed(() => {
    const q = this.livestockSearch().toLowerCase();
    if (!q) { return this.livestocks(); }
    return this.livestocks().filter(
      (ls) => ls.code.toLowerCase().includes(q) || (ls.name ?? '').toLowerCase().includes(q),
    );
  });

  protected readonly isEditMode = this.milkProduction !== null;

  // Header: farm_session_id (shared across all rows on create; standalone on edit)
  protected readonly headerForm = this.fb.nonNullable.group({
    farm_session_id: [
      this.milkProduction?.farm_session_id ?? ('' as unknown as number),
      [Validators.required],
    ],
  });

  // Edit mode: single record form
  protected readonly editForm = this.fb.nonNullable.group({
    livestock_id: [
      this.milkProduction?.livestock_id ?? ('' as unknown as number),
      [Validators.required],
    ],
    date: [this.milkProduction?.date ?? '', [Validators.required]],
    quantity: [
      this.milkProduction?.quantity ?? ('' as unknown as number),
      [Validators.required, Validators.min(0)],
    ],
  });

  // Create mode: FormArray rows
  protected readonly rowsForm = this.fb.nonNullable.group({
    rows: this.fb.array([this.buildRow()]),
  });

  get rows(): FormArray {
    return this.rowsForm.controls.rows;
  }

  private buildRow() {
    return this.fb.nonNullable.group({
      livestock_id: ['' as unknown as number, [Validators.required]],
      date: [new Date().toISOString().slice(0, 10), [Validators.required]],
      quantity: ['' as unknown as number, [Validators.required, Validators.min(0)]],
    });
  }

  ngOnInit(): void {
    forkJoin({
      sessions: this.milkProductionService.getSessions(),
      livestocks: this.milkProductionService.getLivestocks(),
    }).subscribe({
      next: ({ sessions, livestocks }) => {
        this.sessions.set(sessions.farm_sessions);
        this.livestocks.set(livestocks.farm_livestocks);
        this.isLoadingOptions.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load form options. Please close and try again.');
        this.isLoadingOptions.set(false);
      },
    });
  }

  protected sessionLabel(session: MilkSession): string {
    const parts = [session.code];
    if (session.session_type?.name) {
      parts.push(session.session_type.name);
    }
    if (session.notes) {
      parts.push(session.notes);
    }
    return parts.join(' — ');
  }

  protected livestockLabel(item: MilkLivestock): string {
    return item.name ? `${item.code} — ${item.name}` : item.code;
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
      this.submitCreate();
    }
  }

  private submitEdit(): void {
    if (this.headerForm.invalid || this.editForm.invalid || !this.milkProduction) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    const h = this.headerForm.getRawValue();
    const e = this.editForm.getRawValue();
    const payload: Partial<MilkProductionPayload> = {
      farm_session_id: h.farm_session_id,
      livestock_id: e.livestock_id,
      date: e.date,
      quantity: e.quantity,
    };

    this.milkProductionService.update(this.milkProduction.id, payload).subscribe({
      next: () => this.dialogRef.close({ saved: true } satisfies MilkProductionFormResult),
      error: () => {
        this.errorMessage.set('Failed to update milk production. Please try again.');
        this.isSaving.set(false);
      },
    });
  }

  private submitCreate(): void {
    if (this.headerForm.invalid || this.rowsForm.invalid) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    const farm_session_id = this.headerForm.getRawValue().farm_session_id;
    const payload: MilkProductionPayload[] = this.rows.getRawValue().map((r) => ({
      farm_session_id,
      livestock_id: r.livestock_id,
      date: r.date,
      quantity: r.quantity,
    }));

    this.milkProductionService.create(payload).subscribe({
      next: () => this.dialogRef.close({ saved: true } satisfies MilkProductionFormResult),
      error: () => {
        this.errorMessage.set('Failed to record milk production. Please try again.');
        this.isSaving.set(false);
      },
    });
  }
}
