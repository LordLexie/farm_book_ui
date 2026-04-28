import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { LoginLog, LoginLogService, LoginLogSummary } from '../../../core/services/login-log.service';

interface StatCard {
  label: string;
  value: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-login-log-report',
  imports: [
    FormsModule, DecimalPipe, DatePipe,
    MatCardModule, MatIconModule, MatProgressSpinnerModule,
    MatTableModule, MatPaginatorModule,
    MatSelectModule, MatFormFieldModule, MatInputModule, MatButtonModule,
  ],
  templateUrl: './login-log-report.html',
  styleUrl: './login-log-report.css',
})
export class LoginLogReportComponent implements OnInit {
  private readonly loginLogService = inject(LoginLogService);

  protected readonly isLoading = signal(true);
  protected readonly logs = signal<LoginLog[]>([]);
  protected readonly summaryData = signal<LoginLogSummary | null>(null);
  protected readonly totalItems = signal(0);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(25);
  protected readonly pageSizeOptions = [10, 25, 50, 100];

  protected filterFrom = '';
  protected filterTo = '';
  protected filterStatus = '';

  protected readonly displayedColumns = ['time', 'user', 'email', 'ip_address', 'status'];

  protected readonly stats = computed<StatCard[]>(() => {
    const s = this.summaryData();
    return [
      { label: "Today's Logins",      value: s ? String(s.today_total)        : '—', icon: 'login',        color: '#1565c0' },
      { label: 'Failed Today',         value: s ? String(s.today_failed)       : '—', icon: 'gpp_bad',      color: '#c62828' },
      { label: 'This Month',           value: s ? String(s.month_total)        : '—', icon: 'calendar_month', color: '#2e7d32' },
      { label: 'Unique Users Today',   value: s ? String(s.unique_users_today) : '—', icon: 'people',       color: '#6a1b9a' },
    ];
  });

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.loginLogService
      .getAll(this.pageIndex() + 1, this.pageSize(), this.filterFrom || undefined, this.filterTo || undefined, this.filterStatus || undefined)
      .subscribe({
        next: (res) => {
          this.logs.set(res.login_logs);
          this.totalItems.set(res.meta.total);
          this.summaryData.set(res.summary);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  protected onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadData();
  }

  protected applyFilters(): void {
    this.pageIndex.set(0);
    this.loadData();
  }

  protected clearFilters(): void {
    this.filterFrom = '';
    this.filterTo = '';
    this.filterStatus = '';
    this.pageIndex.set(0);
    this.loadData();
  }

  protected userName(log: LoginLog): string {
    return log.user?.name ?? '—';
  }
}
