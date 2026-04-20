import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardSummary {
  total_livestock: number;
  todays_milk_litres: number;
  pending_bills_amount: number;
  outstanding_invoice_balance: number;
  overdue_invoices_count: number;
  unpaid_bills_count: number;
  monthly_revenue: number;
  monthly_expenses: number;
}

export interface TrendPoint {
  date: string;
  quantity: number;
}

export interface ExpenseCategory {
  category: string;
  total: number;
}

export interface RecentMilkSale {
  date: string;
  customer: string | null;
  quantity: number;
  total: number;
}

export interface RecentPurchase {
  date: string;
  supplier: string | null;
  total: number;
}

export interface SalesSummary {
  total_revenue_mtd: number;
  milk_sales_revenue_mtd: number;
  invoice_revenue_mtd: number;
  outstanding_balance: number;
  active_customers: number;
}

export interface MonthlyTrendPoint {
  month: string;
  total: number;
}

export interface MilkProductionSummary {
  total_mtd: number;
  today: number;
  daily_avg_mtd: number;
  producing_animals: number;
  peak_day: string | null;
  peak_quantity: number;
}

export interface TopAnimal {
  name: string;
  code: string;
  total: number;
}

export interface SessionBreakdown {
  session: string;
  total: number;
}

export interface ConsumptionSummary {
  total_mtd: number;
  today: number;
  daily_avg_mtd: number;
  unique_items: number;
  most_consumed_item: string | null;
}

export interface ConsumptionItem {
  name: string;
  total: number;
}

export interface ExpenseSummary {
  total_mtd: number;
  today: number;
  daily_avg_mtd: number;
  pending_bills_count: number;
  top_category: string | null;
}

export interface ExpenseDailyPoint {
  date: string;
  total: number;
}

export interface ExpenseCategoryItem {
  name: string;
  total: number;
}

export interface InvoiceAgingSummary {
  total_outstanding: number;
  overdue_amount: number;
  current: number;
  days_31_60: number;
  days_61_90: number;
  days_90_plus: number;
}

export interface InvoiceAgingBucket {
  bucket: string;
  total: number;
}

export interface InvoiceAgingCustomer {
  name: string;
  total: number;
}

export interface InvoiceAgingOverdue {
  code: string;
  customer: string;
  date: string;
  balance: number;
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1/analytics`;

  summary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.base}/summary`);
  }

  milkProductionTrend(): Observable<{ data: TrendPoint[] }> {
    return this.http.get<{ data: TrendPoint[] }>(`${this.base}/milk-production-trend`);
  }

  expenseBreakdown(): Observable<{ data: ExpenseCategory[] }> {
    return this.http.get<{ data: ExpenseCategory[] }>(`${this.base}/expense-breakdown`);
  }

  recentMilkSales(): Observable<{ data: RecentMilkSale[] }> {
    return this.http.get<{ data: RecentMilkSale[] }>(`${this.base}/recent-milk-sales`);
  }

  recentPurchases(): Observable<{ data: RecentPurchase[] }> {
    return this.http.get<{ data: RecentPurchase[] }>(`${this.base}/recent-purchases`);
  }

  salesSummary(): Observable<SalesSummary> {
    return this.http.get<SalesSummary>(`${this.base}/sales-summary`);
  }

  revenueTrend(): Observable<{ data: MonthlyTrendPoint[] }> {
    return this.http.get<{ data: MonthlyTrendPoint[] }>(`${this.base}/revenue-trend`);
  }

  milkSalesTrend(): Observable<{ data: MonthlyTrendPoint[] }> {
    return this.http.get<{ data: MonthlyTrendPoint[] }>(`${this.base}/milk-sales-trend`);
  }

  milkProductionSummary(): Observable<MilkProductionSummary> {
    return this.http.get<MilkProductionSummary>(`${this.base}/milk-production-summary`);
  }

  milkProductionMonthlyTrend(): Observable<{ data: MonthlyTrendPoint[] }> {
    return this.http.get<{ data: MonthlyTrendPoint[] }>(`${this.base}/milk-production-monthly-trend`);
  }

  milkProductionTopAnimals(): Observable<{ data: TopAnimal[] }> {
    return this.http.get<{ data: TopAnimal[] }>(`${this.base}/milk-production-top-animals`);
  }

  milkProductionBySession(): Observable<{ data: SessionBreakdown[] }> {
    return this.http.get<{ data: SessionBreakdown[] }>(`${this.base}/milk-production-by-session`);
  }

  consumptionSummary(): Observable<ConsumptionSummary> {
    return this.http.get<ConsumptionSummary>(`${this.base}/consumption-summary`);
  }

  consumptionDailyTrend(): Observable<{ data: TrendPoint[] }> {
    return this.http.get<{ data: TrendPoint[] }>(`${this.base}/consumption-daily-trend`);
  }

  consumptionMonthlyTrend(): Observable<{ data: MonthlyTrendPoint[] }> {
    return this.http.get<{ data: MonthlyTrendPoint[] }>(`${this.base}/consumption-monthly-trend`);
  }

  consumptionTopItems(): Observable<{ data: ConsumptionItem[] }> {
    return this.http.get<{ data: ConsumptionItem[] }>(`${this.base}/consumption-top-items`);
  }

  consumptionByAnimal(): Observable<{ data: TopAnimal[] }> {
    return this.http.get<{ data: TopAnimal[] }>(`${this.base}/consumption-by-animal`);
  }

  expenseSummary(): Observable<ExpenseSummary> {
    return this.http.get<ExpenseSummary>(`${this.base}/expense-summary`);
  }

  expenseDailyTrend(): Observable<{ data: ExpenseDailyPoint[] }> {
    return this.http.get<{ data: ExpenseDailyPoint[] }>(`${this.base}/expense-daily-trend`);
  }

  expenseMonthlyTrend(): Observable<{ data: MonthlyTrendPoint[] }> {
    return this.http.get<{ data: MonthlyTrendPoint[] }>(`${this.base}/expense-monthly-trend`);
  }

  expenseTopCategories(): Observable<{ data: ExpenseCategoryItem[] }> {
    return this.http.get<{ data: ExpenseCategoryItem[] }>(`${this.base}/expense-top-categories`);
  }

  expenseRecentPurchases(): Observable<{ data: RecentPurchase[] }> {
    return this.http.get<{ data: RecentPurchase[] }>(`${this.base}/expense-recent-purchases`);
  }

  invoiceAgingSummary(): Observable<InvoiceAgingSummary> {
    return this.http.get<InvoiceAgingSummary>(`${this.base}/invoice-aging-summary`);
  }

  invoiceAgingBuckets(): Observable<{ data: InvoiceAgingBucket[] }> {
    return this.http.get<{ data: InvoiceAgingBucket[] }>(`${this.base}/invoice-aging-buckets`);
  }

  invoiceAgingTopCustomers(): Observable<{ data: InvoiceAgingCustomer[] }> {
    return this.http.get<{ data: InvoiceAgingCustomer[] }>(`${this.base}/invoice-aging-top-customers`);
  }

  invoiceAgingRecentOverdue(): Observable<{ data: InvoiceAgingOverdue[] }> {
    return this.http.get<{ data: InvoiceAgingOverdue[] }>(`${this.base}/invoice-aging-recent-overdue`);
  }

  invoiceAgingTrend(): Observable<{ data: MonthlyTrendPoint[] }> {
    return this.http.get<{ data: MonthlyTrendPoint[] }>(`${this.base}/invoice-aging-trend`);
  }
}
