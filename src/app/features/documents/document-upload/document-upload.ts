import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DocumentService, AppDocument } from '../../../core/services/document.service';

export interface DocumentUploadResult {
  document: AppDocument;
}

@Component({
  selector: 'app-document-upload',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './document-upload.html',
  styleUrl: './document-upload.css',
})
export class DocumentUploadComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<DocumentUploadComponent>);
  private readonly documentService = inject(DocumentService);

  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly selectedFile = signal<File | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    description: [''],
  });

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile.set(input.files[0]);
      if (!this.form.controls.name.value) {
        const namePart = input.files[0].name.replace(/\.[^.]+$/, '');
        this.form.controls.name.setValue(namePart);
      }
    }
  }

  protected formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  protected submit(): void {
    if (this.form.invalid || !this.selectedFile()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const { name, description } = this.form.getRawValue();

    this.documentService.upload(this.selectedFile()!, name, description).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        this.dialogRef.close({ document: res.document });
      },
      error: (err) => {
        this.isSaving.set(false);
        const msg = err?.error?.message ?? 'Upload failed. Please try again.';
        this.errorMessage.set(msg);
      },
    });
  }

  protected cancel(): void {
    this.dialogRef.close();
  }
}
