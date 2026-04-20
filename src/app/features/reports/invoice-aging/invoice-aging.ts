import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin } from 'rxjs';
import {
  AnalyticsService,
  InvoiceAgingBucket,
  InvoiceAgingCustomer,
  InvoiceAgingOverdue,
  InvoiceAgingSummary,
  MonthlyTrendPoint,
} from '../../../core/services/analytics.service';

interface StatCard {
  label: string;
  value: string;
  icon: string;
  color: string;
}

interface ChartPoints {
  line: string;
  fill: string;
  labels: string[];
}

@Component({
  selector: 'app-invoice-aging',
  imports: [MatCardModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './invoice-aging.html',
  styleUrl: './invoice-aging.css',
})
export class InvoiceAgingComponent implements OnInit {
  private readonly analytics = inject(AnalyticsService);

  protected readonly isLoadingStats = signal(true);
  protected readonly isLoadingCharts = signal(true);
  protected readonly isLoadingPanels = signal(true);
  protected readonly summaryData = signal<InvoiceAgingSummary | null>(null);
  protected readonly agingBucketsData = signal<InvoiceAgingBucket[]>([]);
  protected readonly trendData = signal<MonthlyTrendPoint[]>([]);
  protected readonly topCustomersData = signal<InvoiceAgingCustomer[]>([]);
  protected readonly recentOverdueData = signal<InvoiceAgingOverdue[]>([]);

  protected readonly stats = computed<StatCard[]>(() => {
    const s = this.summaryData();
    const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });
    return [
      { label: 'Total Outstanding', value: s ? fmt(s.total_outstanding) : '—', icon: 'account_balance', color: '#1565c0' },
      { label: 'Overdue Amount', value: s ? fmt(s.overdue_amount) : '—', icon: 'warning', color: '#c62828' },
      { label: 'Current (0–30 days)', value: s ? fmt(s.current) : '—', icon: 'schedule', color: '#2e7d32' },
      { label: '31–60 Days', value: s ? fmt(s.days_31_60) : '—', icon: 'hourglass_bottom', color: '#f57c00' },
      { label: '61–90 Days', value: s ? fmt(s.days_61_90) : '—', icon: 'hourglass_top', color: '#e65100' },
      { label: '90+ Days', value: s ? fmt(s.days_90_plus) : '—', icon: 'report', color: '#b71c1c' },
    ];
  });

  protected readonly bucketMaxTotal = computed(() =>
    Math.max(...this.agingBucketsData().map(b => b.total), 1),
  );

  protected readonly trendChartPoints = computed(() =>
    this.toChartPoints(this.trendData().map(d => ({ label: d.month, total: d.total }))),
  );

  ngOnInit(): void {
    this.analytics.invoiceAgingSummary().subscribe({
      next: (data) => { this.summaryData.set(data); this.isLoadingStats.set(false); },
      error: () => this.isLoadingStats.set(false),
    });

    forkJoin({
      buckets: this.analytics.invoiceAgingBuckets(),
      trend: this.analytics.invoiceAgingTrend(),
    }).subscribe({
      next: ({ buckets, trend }) => {
        this.agingBucketsData.set(buckets.data);
        this.trendData.set(trend.data);
        this.isLoadingCharts.set(false);
      },
      error: () => this.isLoadingCharts.set(false),
    });

    forkJoin({
      customers: this.analytics.invoiceAgingTopCustomers(),
      overdue: this.analytics.invoiceAgingRecentOverdue(),
    }).subscribe({
      next: ({ customers, overdue }) => {
        this.topCustomersData.set(customers.data);
        this.recentOverdueData.set(overdue.data);
        this.isLoadingPanels.set(false);
      },
      error: () => this.isLoadingPanels.set(false),
    });
  }

  protected formatDate(date: string): string {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  private toChartPoints(data: { label: string; total: number }[]): ChartPoints {
    const maxLabels = 6;
    const step = data.length <= maxLabels ? 1 : Math.ceil(data.length / (maxLabels - 1));
    const labels = data.reduce<string[]>((acc, d, i) => {
      if (i === 0 || i === data.length - 1 || i % step === 0) acc.push(d.label);
      return acc;
    }, []);

    if (data.length < 2) return { line: '', fill: '', labels };

    const vals = data.map(d => d.total);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const range = max - min || 1;
    const svgWidth = 500;
    const yTop = 10;
    const yBottom = 90;

    const xs = data.map((_, i) => ((i / (data.length - 1)) * svgWidth).toFixed(1));
    const ys = data.map(d => (yBottom - ((d.total - min) / range) * (yBottom - yTop)).toFixed(1));
    const pts = data.map((_, i) => `${xs[i]},${ys[i]}`);

    return {
      line: pts.join(' '),
      fill: `${xs[0]},${yBottom} ${pts.join(' ')} ${xs[xs.length - 1]},${yBottom}`,
      labels,
    };
  }

  protected bucketColor(index: number): string {
    return ['#2e7d32', '#f57c00', '#e65100', '#b71c1c'][index] ?? '#9e9e9e';
  }

}
