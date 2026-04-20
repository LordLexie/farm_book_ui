import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin } from 'rxjs';
import {
  AnalyticsService,
  ConsumptionItem,
  ConsumptionSummary,
  MonthlyTrendPoint,
  TopAnimal,
  TrendPoint,
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
  selector: 'app-consumption-analytics',
  imports: [MatCardModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './consumption-analytics.html',
  styleUrl: './consumption-analytics.css',
})
export class ConsumptionAnalyticsComponent implements OnInit {
  private readonly analytics = inject(AnalyticsService);

  protected readonly isLoadingStats = signal(true);
  protected readonly isLoadingCharts = signal(true);
  protected readonly isLoadingPanels = signal(true);
  protected readonly summaryData = signal<ConsumptionSummary | null>(null);
  protected readonly dailyTrendData = signal<TrendPoint[]>([]);
  protected readonly monthlyTrendData = signal<MonthlyTrendPoint[]>([]);
  protected readonly topItemsData = signal<ConsumptionItem[]>([]);
  protected readonly byAnimalData = signal<TopAnimal[]>([]);

  protected readonly stats = computed<StatCard[]>(() => {
    const s = this.summaryData();
    const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 1 });
    return [
      { label: 'Total Consumed (MTD)', value: s ? fmt(s.total_mtd) : '—', icon: 'inventory_2', color: '#2e7d32' },
      { label: "Today's Consumption", value: s ? fmt(s.today) : '—', icon: 'today', color: '#0288d1' },
      { label: 'Daily Average (MTD)', value: s ? fmt(s.daily_avg_mtd) : '—', icon: 'show_chart', color: '#00897b' },
      { label: 'Unique Items Consumed', value: s ? String(s.unique_items) : '—', icon: 'category', color: '#7b1fa2' },
      { label: 'Most Consumed Item', value: s?.most_consumed_item ?? '—', icon: 'star', color: '#e65100' },
    ];
  });

  protected readonly dailyChartPoints = computed(() =>
    this.toChartPoints(
      this.dailyTrendData().map(d => ({ label: this.formatDate(d.date), total: d.quantity })),
    ),
  );

  protected readonly monthlyChartPoints = computed(() =>
    this.toChartPoints(this.monthlyTrendData().map(d => ({ label: d.month, total: d.total }))),
  );

  ngOnInit(): void {
    this.analytics.consumptionSummary().subscribe({
      next: (data) => { this.summaryData.set(data); this.isLoadingStats.set(false); },
      error: () => this.isLoadingStats.set(false),
    });

    forkJoin({
      daily: this.analytics.consumptionDailyTrend(),
      monthly: this.analytics.consumptionMonthlyTrend(),
    }).subscribe({
      next: ({ daily, monthly }) => {
        this.dailyTrendData.set(daily.data);
        this.monthlyTrendData.set(monthly.data);
        this.isLoadingCharts.set(false);
      },
      error: () => this.isLoadingCharts.set(false),
    });

    forkJoin({
      items: this.analytics.consumptionTopItems(),
      animals: this.analytics.consumptionByAnimal(),
    }).subscribe({
      next: ({ items, animals }) => {
        this.topItemsData.set(items.data);
        this.byAnimalData.set(animals.data);
        this.isLoadingPanels.set(false);
      },
      error: () => this.isLoadingPanels.set(false),
    });
  }

  private formatDate(date: string): string {
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
}
