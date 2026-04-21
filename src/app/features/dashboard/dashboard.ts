import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin } from 'rxjs';
import {
  AnalyticsService,
  ConsumptionSummary,
  DashboardSummary,
  ExpenseCategory,
  MilkProductionSummary,
  RecentMilkSale,
  RecentPurchase,
  TrendPoint,
} from '../../core/services/analytics.service';
import { AuthService } from '../../core/services/auth.service';

interface StatCard {
  label: string;
  value: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [MatCardModule, MatIconModule, MatProgressSpinnerModule, DecimalPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit {
  private readonly analytics = inject(AnalyticsService);
  protected readonly auth = inject(AuthService);

  // Admin dashboard state
  protected readonly isLoadingStats = signal(true);
  protected readonly isLoadingPanels = signal(true);
  protected readonly summary = signal<DashboardSummary | null>(null);
  protected readonly milkTrend = signal<TrendPoint[]>([]);
  protected readonly expenseBreakdown = signal<ExpenseCategory[]>([]);
  protected readonly recentMilkSales = signal<RecentMilkSale[]>([]);
  protected readonly recentPurchases = signal<RecentPurchase[]>([]);

  // Non-admin dashboard state
  protected readonly isLoadingSimple = signal(true);
  protected readonly milkSummary = signal<MilkProductionSummary | null>(null);
  protected readonly consumptionSummary = signal<ConsumptionSummary | null>(null);
  protected readonly simpleProductionTrend = signal<TrendPoint[]>([]);

  protected readonly stats = computed<StatCard[]>(() => {
    const s = this.summary();
    const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });
    return [
      { label: 'Total Livestock', value: s ? String(s.total_livestock) : '—', icon: 'pets', color: '#4caf50' },
      { label: "Today's Milk (L)", value: s ? s.todays_milk_litres.toFixed(1) : '—', icon: 'water_drop', color: '#0288d1' },
      { label: 'Pending Bills', value: s ? fmt(s.pending_bills_amount) : '—', icon: 'receipt', color: '#e65100' },
      { label: 'Outstanding Invoices', value: s ? fmt(s.outstanding_invoice_balance) : '—', icon: 'account_balance', color: '#1565c0' },
      { label: 'Overdue Invoices', value: s ? String(s.overdue_invoices_count) : '—', icon: 'warning', color: '#c62828' },
      { label: 'Unpaid Bills', value: s ? String(s.unpaid_bills_count) : '—', icon: 'money_off', color: '#6a1b9a' },
      { label: 'Revenue (This Month)', value: s ? fmt(s.monthly_revenue) : '—', icon: 'attach_money', color: '#2e7d32' },
      { label: 'Expenses (MTD)', value: s ? fmt(s.monthly_expenses) : '—', icon: 'trending_down', color: '#f57c00' },
    ];
  });

  ngOnInit(): void {
    if (this.auth.hasPermission('view reports')) {
      this.loadAdminDashboard();
    } else {
      this.loadSimpleDashboard();
    }
  }

  private loadAdminDashboard(): void {
    this.analytics.summary().subscribe({
      next: (data) => {
        this.summary.set(data);
        this.isLoadingStats.set(false);
      },
      error: () => this.isLoadingStats.set(false),
    });

    forkJoin({
      trend: this.analytics.milkProductionTrend(),
      breakdown: this.analytics.expenseBreakdown(),
      milkSales: this.analytics.recentMilkSales(),
      purchases: this.analytics.recentPurchases(),
    }).subscribe({
      next: ({ trend, breakdown, milkSales, purchases }) => {
        this.milkTrend.set(trend.data);
        this.expenseBreakdown.set(breakdown.data);
        this.recentMilkSales.set(milkSales.data);
        this.recentPurchases.set(purchases.data);
        this.isLoadingPanels.set(false);
      },
      error: () => this.isLoadingPanels.set(false),
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
