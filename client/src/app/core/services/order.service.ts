import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateOrderDto, Order } from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);

  createOrder(data: CreateOrderDto): Observable<{ order: Order }> {
    return this.http.post<{ order: Order }>(`${environment.apiUrl}/orders`, data);
  }

  getMyOrders(): Observable<{ orders: Order[] }> {
    return this.http.get<{ orders: Order[] }>(`${environment.apiUrl}/orders/my-orders`);
  }

  getAllOrders(): Observable<{ orders: Order[] }> {
    return this.http.get<{ orders: Order[] }>(`${environment.apiUrl}/orders`);
  }
}
