import { Routes } from '@angular/router';
import { ShellComponent } from './shared/shell/shell';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login').then((m) => m.LoginComponent),
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard').then((m) => m.DashboardComponent),
      },
      {
        path: 'masters/farms',
        loadComponent: () =>
          import('./features/masters/farms/farm-list/farm-list').then((m) => m.FarmListComponent),
      },
      {
        path: 'masters/item-masters',
        loadComponent: () =>
          import('./features/masters/item-masters/item-master-list/item-master-list').then(
            (m) => m.ItemMasterListComponent,
          ),
      },
      {
        path: 'masters/farm-items',
        loadComponent: () =>
          import('./features/masters/farm-items/farm-item-list/farm-item-list').then(
            (m) => m.FarmItemListComponent,
          ),
      },
      {
        path: 'masters/services',
        loadComponent: () =>
          import('./features/masters/services/service-list/service-list').then(
            (m) => m.ServiceListComponent,
          ),
      },
      {
        path: 'masters/unit-of-measures',
        loadComponent: () =>
          import('./features/masters/lookup/lookup-list/lookup-list').then(
            (m) => m.LookupListComponent,
          ),
        data: {
          resource: 'unit-of-measures',
          responseKey: 'unit_of_measures',
          title: 'Unit of Measures',
          subtitle: 'Manage units of measure used for items',
          icon: 'straighten',
        },
      },
      {
        path: 'masters/item-categories',
        loadComponent: () =>
          import('./features/masters/lookup/lookup-list/lookup-list').then(
            (m) => m.LookupListComponent,
          ),
        data: {
          resource: 'item-categories',
          responseKey: 'item_categories',
          title: 'Item Categories',
          subtitle: 'Manage categories for item masters',
          icon: 'category',
        },
      },
      {
        path: 'masters/milk-rates',
        loadComponent: () =>
          import('./features/masters/milk-rates/milk-rate-list/milk-rate-list').then(
            (m) => m.MilkRateListComponent,
          ),
      },
      {
        path: 'masters/service-types',
        loadComponent: () =>
          import('./features/masters/lookup/lookup-list/lookup-list').then(
            (m) => m.LookupListComponent,
          ),
        data: {
          resource: 'service-types',
          responseKey: 'service_types',
          title: 'Service Types',
          subtitle: 'Manage categories for services',
          icon: 'miscellaneous_services',
        },
      },
      {
        path: 'masters/roles/:id/edit',
        loadComponent: () =>
          import('./features/masters/roles/role-edit/role-edit').then((m) => m.RoleEditComponent),
      },
      {
        path: 'masters/users',
        loadComponent: () =>
          import('./features/masters/users/user-list/user-list').then((m) => m.UserListComponent),
      },
      {
        path: 'masters/permissions',
        loadComponent: () =>
          import('./features/masters/permissions/permission-list/permission-list').then(
            (m) => m.PermissionListComponent,
          ),
      },
      {
        path: 'masters/roles',
        loadComponent: () =>
          import('./features/masters/roles/role-list/role-list').then((m) => m.RoleListComponent),
      },
      {
        path: 'expenses/suppliers',
        loadComponent: () =>
          import('./features/expenses/suppliers/supplier-list/supplier-list').then(
            (m) => m.SupplierListComponent,
          ),
      },
      {
        path: 'expenses/purchases',
        loadComponent: () =>
          import('./features/expenses/purchases/purchase-list/purchase-list').then(
            (m) => m.PurchaseListComponent,
          ),
      },
      {
        path: 'expenses/purchases/:id/edit',
        loadComponent: () =>
          import('./features/expenses/purchases/purchase-edit/purchase-edit').then(
            (m) => m.PurchaseEditComponent,
          ),
      },
      {
        path: 'expenses/purchases/:id',
        loadComponent: () =>
          import('./features/expenses/purchases/purchase-view/purchase-view').then(
            (m) => m.PurchaseViewComponent,
          ),
      },
      {
        path: 'expenses/bills',
        loadComponent: () =>
          import('./features/expenses/bills/bill-list/bill-list').then(
            (m) => m.BillListComponent,
          ),
      },
      {
        path: 'expenses/bills/:id/edit',
        loadComponent: () =>
          import('./features/expenses/bills/bill-edit/bill-edit').then(
            (m) => m.BillEditComponent,
          ),
      },
      {
        path: 'expenses/bills/:id',
        loadComponent: () =>
          import('./features/expenses/bills/bill-view/bill-view').then(
            (m) => m.BillViewComponent,
          ),
      },
      {
        path: 'sales/customers',
        loadComponent: () =>
          import('./features/sales/customers/customer-list/customer-list').then(
            (m) => m.CustomerListComponent,
          ),
      },
      {
        path: 'sales/quotations',
        loadComponent: () =>
          import('./features/sales/quotations/quotation-list/quotation-list').then(
            (m) => m.QuotationListComponent,
          ),
      },
      {
        path: 'sales/quotations/:id/edit',
        loadComponent: () =>
          import('./features/sales/quotations/quotation-edit/quotation-edit').then(
            (m) => m.QuotationEditComponent,
          ),
      },
      {
        path: 'sales/quotations/:id',
        loadComponent: () =>
          import('./features/sales/quotations/quotation-view/quotation-view').then(
            (m) => m.QuotationViewComponent,
          ),
      },
      {
        path: 'sales/invoices',
        loadComponent: () =>
          import('./features/sales/invoices/invoice-list/invoice-list').then(
            (m) => m.InvoiceListComponent,
          ),
      },
      {
        path: 'sales/invoices/:id/edit',
        loadComponent: () =>
          import('./features/sales/invoices/invoice-edit/invoice-edit').then(
            (m) => m.InvoiceEditComponent,
          ),
      },
      {
        path: 'sales/invoices/:id',
        loadComponent: () =>
          import('./features/sales/invoices/invoice-view/invoice-view').then(
            (m) => m.InvoiceViewComponent,
          ),
      },
      {
        path: 'sales/payments',
        loadComponent: () =>
          import('./features/sales/payments/payment-list/payment-list').then(
            (m) => m.PaymentListComponent,
          ),
      },
      {
        path: 'livestock/farm-livestocks',
        loadComponent: () =>
          import('./features/livestock/farm-livestock-list/farm-livestock-list').then(
            (m) => m.FarmLivestockListComponent,
          ),
      },
      {
        path: 'livestock/farm-consumptions',
        loadComponent: () =>
          import('./features/livestock/farm-consumption-list/farm-consumption-list').then(
            (m) => m.FarmConsumptionListComponent,
          ),
      },
      {
        path: 'milk/milk-productions',
        loadComponent: () =>
          import('./features/milk/milk-production-list/milk-production-list').then(
            (m) => m.MilkProductionListComponent,
          ),
      },
      {
        path: 'milk-sales',
        loadComponent: () =>
          import('./features/milk/milk-sale-list/milk-sale-list').then(
            (m) => m.MilkSaleListComponent,
          ),
      },
      {
        path: 'reports/sales-analytics',
        loadComponent: () =>
          import('./features/reports/sales-analytics/sales-analytics').then(
            (m) => m.SalesAnalyticsComponent,
          ),
      },
      {
        path: 'reports/consumption-analytics',
        loadComponent: () =>
          import('./features/reports/consumption-analytics/consumption-analytics').then(
            (m) => m.ConsumptionAnalyticsComponent,
          ),
      },
      {
        path: 'reports/milk-production',
        loadComponent: () =>
          import('./features/reports/milk-production-report/milk-production-report').then(
            (m) => m.MilkProductionReportComponent,
          ),
      },
      {
        path: 'reports/expense-analytics',
        loadComponent: () =>
          import('./features/reports/expense-analytics/expense-analytics').then(
            (m) => m.ExpenseAnalyticsComponent,
          ),
      },
      {
        path: 'reports/invoice-aging',
        loadComponent: () =>
          import('./features/reports/invoice-aging/invoice-aging').then(
            (m) => m.InvoiceAgingComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
