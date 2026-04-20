import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'login', renderMode: RenderMode.Prerender },
  { path: 'dashboard', renderMode: RenderMode.Client },
  { path: 'masters/item-masters', renderMode: RenderMode.Client },
  { path: 'masters/farms', renderMode: RenderMode.Client },
  { path: 'masters/farm-items', renderMode: RenderMode.Client },
  { path: 'masters/services', renderMode: RenderMode.Client },
  { path: 'masters/unit-of-measures', renderMode: RenderMode.Client },
  { path: 'masters/item-categories', renderMode: RenderMode.Client },
  { path: 'masters/service-types', renderMode: RenderMode.Client },
  { path: 'expenses/suppliers', renderMode: RenderMode.Client },
  { path: 'expenses/purchases', renderMode: RenderMode.Client },
  { path: 'expenses/bills', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Client },
];
