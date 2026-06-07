import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OrderService } from '../../../core/services/order.service';
import { Order, RideRef } from '../../../core/models/order.model';

@Component({
  selector: 'app-order-history',
  imports: [
    DatePipe,
    RouterLink,
    MatCardModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './order-history.component.html',
  styleUrl: './order-history.component.scss',
})
export class OrderHistoryComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly loading = signal(true);
  protected readonly orders = signal<Order[]>([]);
  protected readonly displayedColumns = [
    'chosenDate',
    'ticketType',
    'ride',
    'coupon',
    'totalPrice',
    'discount',
    'finalPrice',
    'status',
  ];

  ngOnInit(): void {
    this.orderService.getMyOrders().subscribe({
      next: (res) => {
        this.orders.set(res.orders);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.snackBar.open(err.error?.message || 'טעינת ההזמנות נכשלה', 'סגור', {
          duration: 4000,
        });
      },
    });
  }

  ticketTypeLabel(order: Order): string {
    if (order.ticketType === 'full_day') {
      return 'יום שלם';
    }
    if (order.ticketType === 'hourly') {
      if (order.startHour != null && order.endHour != null) {
        const pad = (h: number) => String(h).padStart(2, '0');
        return `${pad(order.startHour)}:00–${pad(order.endHour)}:00`;
      }
      return `${order.hoursAmount} שעות`;
    }
    return 'מתקן';
  }

  statusLabel(status: Order['status']): string {
    const labels: Record<Order['status'], string> = {
      pending: 'ממתין',
      confirmed: 'אושר',
      cancelled: 'בוטל',
    };
    return labels[status] ?? status;
  }

  rideName(ride: Order['rideId']): string {
    if (!ride) {
      return '—';
    }
    if (typeof ride === 'string') {
      return ride;
    }
    return (ride as RideRef).name || '—';
  }
}
