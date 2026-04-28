import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppDocument, DocumentService } from '../../../core/services/document.service';
import { AuthService } from '../../../core/services/auth.service';
import { DocumentUploadComponent, DocumentUploadResult } from '../document-upload/document-upload';

@Component({
  selector: 'app-document-list',
  imports: [
    DatePipe,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
  ],
  templateUrl: './document-list.html',
  styleUrl: './document-list.css',
})
export class DocumentListComponent implements OnInit {
  private readonly documentService = inject(DocumentService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly auth = inject(AuthService);

  protected readonly isLoading = signal(true);
  protected readonly documents = signal<AppDocument[]>([]);
  protected readonly totalItems = signal(0);
  protected readonly totalSize = signal(0);
  protected readonly pageSize = signal(15);
  protected readonly pageIndex = signal(0);
  protected readonly pageSizeOptions = [10, 15, 25, 50];
  protected readonly deletingId = signal<number | null>(null);
  protected readonly downloadingId = signal<number | null>(null);

  protected readonly displayedColumns = ['code', 'name', 'type', 'size', 'uploaded_by', 'uploaded_at', 'actions'];

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.documentService.getAll(this.pageIndex() + 1, this.pageSize()).subscribe({
      next: (res) => {
        this.documents.set(res.documents);
        this.totalItems.set(res.meta.total);
        this.totalSize.set(res.total_size);
        this.isLoading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load documents.', 'Dismiss', { duration: 4000 });
        this.isLoading.set(false);
      },
    });
  }

  protected onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadData();
  }

  protected openUploadDialog(): void {
    const ref = this.dialog.open(DocumentUploadComponent, {
      disableClose: true,
      width: '100%',
      maxWidth: '520px',
    });

    ref.afterClosed().subscribe((result: DocumentUploadResult | undefined) => {
      if (result) {
        this.snackBar.open('Document uploaded.', undefined, { duration: 3000 });
        this.pageIndex.set(0);
        this.loadData();
      }
    });
  }

  protected deleteDocument(doc: AppDocument): void {
    if (!confirm(`Delete "${doc.name}"? This cannot be undone.`)) return;
    this.deletingId.set(doc.id);
    this.documentService.delete(doc.id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.snackBar.open('Document deleted.', undefined, { duration: 3000 });
        if (this.documents().length === 1 && this.pageIndex() > 0) {
          this.pageIndex.set(this.pageIndex() - 1);
        }
        this.loadData();
      },
      error: () => {
        this.deletingId.set(null);
        this.snackBar.open('Delete failed.', 'Dismiss', { duration: 4000 });
      },
    });
  }

  protected downloadDocument(doc: AppDocument): void {
    this.downloadingId.set(doc.id);
    this.documentService.download(doc.id).subscribe({
      next: (blob) => {
        this.downloadingId.set(null);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.original_name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 100);
      },
      error: () => {
        this.downloadingId.set(null);
        this.snackBar.open('Download failed.', 'Dismiss', { duration: 4000 });
      },
    });
  }

  protected typeIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'picture_as_pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'description';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'table_chart';
    return 'insert_drive_file';
  }

  protected typeLabel(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'Image';
    if (mimeType === 'application/pdf') return 'PDF';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'Word';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'Excel';
    return 'File';
  }

  protected formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }
}
