import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CouponValidation } from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class CouponService {
  private readonly http = inject(HttpClient);

  validateCode(code: string): Observable<CouponValidation> {
    return this.http.get<CouponValidation>(`${environment.apiUrl}/coupons/validate`, {
      params: { code },
    });
  }
}
