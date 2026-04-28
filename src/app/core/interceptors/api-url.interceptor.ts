import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const apiUrlInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith('/api/')) {
    const apiBase = environment.apiUrl.replace(/\/api$/, '');
    return next(req.clone({ url: apiBase + req.url }));
  }
  return next(req);
};
