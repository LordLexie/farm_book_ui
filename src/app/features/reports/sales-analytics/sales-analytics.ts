import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin } from 'rxjs';
import {
  AnalyticsService,
  MonthlyTrendPoint,
  SalesSummary,
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
  selector: 'app-sales-analytics',
  imports: [MatCardModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './sales-analytics.html',
  styleUrl: './sales-analytics.css',
})
export class SalesAnalyticsComponent implements OnInit {
  private readonly analytics = inject(AnalyticsService);

  protected readonly isLoadingStats = signal(true);
  protected readonly isLoadingCharts = signal(true);
  protected readonly salesSummaryData = signal<SalesSummary | null>(null);
  protected readonly revenueTrendData = signal<MonthlyTrendPoint[]>([]);
  protected readonly milkSalesTrendData = signal<MonthlyTrendPoint[]>([]);

  protected readonly stats = computed<StatCard[]>(() => {
    const s = this.salesSummaryData();
    const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });
    return [
      { label: 'Total Revenue (MTD)', value: s ? fmt(s.total_revenue_mtd) : '—', icon: 'attach_money', color: '#2e7d32' },
      { label: 'Milk Sales Revenue', value: s ? fmt(s.milk_sales_revenue_mtd) : '—', icon: 'water_drop', color: '#0288d1' },
      { label: 'Invoice Revenue', value: s ? fmt(s.invoice_revenue_mtd) : '—', icon: 'receipt_long', color: '#1565c0' },
      { label: 'Outstanding Balance', value: s ? fmt(s.outstanding_balance) : '—', icon: 'account_balance', color: '#e65100' },
      { label: 'Active Customers', value: s ? String(s.active_customers) : '—', icon: 'people', color: '#7b1fa2' },
    ];
  });

  protected readonly revenueChartPoints = computed(() => this.toChartPoints(this.revenueTrendData()));
  protected readonly milkSalesChartPoints = computed(() => this.toChartPoints(this.milkSalesTrendData()));

  ngOnInit(): void {
    this.analytics.salesSummary().subscribe({
      next: (data) => { this.salesSummaryData.set(data); this.isLoadingStats.set(false); },
      error: () => this.isLoadingStats.set(false),
    });

    forkJoin({
      revenue: this.analytics.revenueTrend(),
      milkSales: this.analytics.milkSalesTrend(),
    }).subscribe({
      next: ({ revenue, milkSales }) => {
        this.revenueTrendData.set(revenue.data);
        this.milkSalesTrendData.set(milkSales.data);
        this.isLoadingCharts.set(false);
      },
      error: () => this.isLoadingCharts.set(false),
    });
  }

  private toChartPoints(data: MonthlyTrendPoint[]): ChartPoints {
    const labels = data.map(d => d.month);

    if (data.length < 2) {
      return { line: '', fill: '', labels };
    }

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
}
