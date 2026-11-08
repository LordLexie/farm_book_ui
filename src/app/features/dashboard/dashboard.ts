import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { forkJoin } from 'rxjs';
import {
  AnalyticsService,
  ConsumptionSummary,
  DashboardSummary,
  InvoiceYearly,
  MilkProductionSummary,
  TrendPoint,
} from '../../core/services/analytics.service';
import { AuthService } from '../../core/services/auth.service';

interface StatCard {
  label: string;
  value: string;
  sub?: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    DecimalPipe,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit {
  private readonly analytics = inject(AnalyticsService);
  protected readonly auth = inject(AuthService);

  // Admin dashboard state
  protected readonly isLoadingStats = signal(true);
  protected readonly isLoadingInvoices = signal(true);
  protected readonly summary = signal<DashboardSummary | null>(null);
  protected readonly invoiceYearly = signal<InvoiceYearly | null>(null);
  protected readonly selectedYear = signal(new Date().getFullYear());

  // Non-admin dashboard state
  protected readonly isLoadingSimple = signal(true);
  protected readonly milkSummary = signal<MilkProductionSummary | null>(null);
  protected readonly consumptionSummary = signal<ConsumptionSummary | null>(null);
  protected readonly simpleProductionTrend = signal<TrendPoint[]>([]);

  protected readonly stats = computed<StatCard[]>(() => {
    const s = this.summary();
    const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });
    return [
      { label: 'Total Clients', value: s ? fmt(s.total_clients) : '—', icon: 'groups', color: '#1565c0' },
      { label: 'Total Livestock', value: s ? fmt(s.total_livestock) : '—', icon: 'pets', color: '#4caf50' },
      {
        label: 'Total Invoices',
        value: s ? fmt(s.total_invoices) : '—',
        sub: s ? `Value: ${fmt(s.total_invoice_value)}` : undefined,
        icon: 'receipt_long',
        color: '#e65100',
      },
    ];
  });

  protected readonly years = computed(() => this.invoiceYearly()?.years ?? [this.selectedYear()]);

  /** 12 monthly bars, height as % of the busiest month. */
  protected readonly bars = computed(() => {
    const monthly = this.invoiceYearly()?.monthly ?? [];
    const max = Math.max(0, ...monthly.map((m) => m.total));
    return monthly.map((m) => ({ ...m, pct: max > 0 ? (m.total / max) * 100 : 0 }));
  });

  protected readonly yearTotal = computed(() =>
    (this.invoiceYearly()?.monthly ?? []).reduce((sum, m) => sum + m.total, 0),
  );

  /** Clients ranked by invoice value, with bar width relative to the top client. */
  protected readonly clients = computed(() => {
    const list = this.invoiceYearly()?.clients ?? [];
    const max = list[0]?.total ?? 0;
    return list.map((c) => ({ ...c, pct: max > 0 ? (c.total / max) * 100 : 0 }));
  });

  ngOnInit(): void {
    if (this.auth.hasPermission('view reports')) {
      this.loadAdminDashboard();
    } else {
      this.loadSimpleDashboard();
    }
  }

  protected onYearChange(year: number): void {
    this.selectedYear.set(year);
    this.loadInvoiceYearly(year);
  }

  private loadAdminDashboard(): void {
    this.analytics.summary().subscribe({
      next: (data) => {
        this.summary.set(data);
        this.isLoadingStats.set(false);
      },
      error: () => this.isLoadingStats.set(false),
    });
    this.loadInvoiceYearly(this.selectedYear());
  }

  private loadInvoiceYearly(year: number): void {
    this.isLoadingInvoices.set(true);
    this.analytics.invoiceYearly(year).subscribe({
      next: (data) => {
        this.invoiceYearly.set(data);
        this.isLoadingInvoices.set(false);
      },
      error: () => this.isLoadingInvoices.set(false),
    });
  }

  private loadSimpleDashboard(): void {
    forkJoin({
      milk: this.analytics.milkProductionSummary(),
      consumption: this.analytics.consumptionSummary(),
      trend: this.analytics.milkProductionTrend(),
    }).subscribe({
      next: ({ milk, consumption, trend }) => {
        this.milkSummary.set(milk);
        this.consumptionSummary.set(consumption);
        this.simpleProductionTrend.set(trend.data);
        this.isLoadingSimple.set(false);
      },
      error: () => this.isLoadingSimple.set(false),
    });
  }
}
