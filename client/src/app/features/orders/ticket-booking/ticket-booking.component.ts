import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OrderService } from '../../../core/services/order.service';
import { RideService } from '../../../core/services/ride.service';
import { CouponService } from '../../../core/services/coupon.service';
import { Ride } from '../../../core/models/ride.model';

const FULL_DAY_PRICE = 50;
const HOURLY_RATE = 15;

@Component({
  selector: 'app-ticket-booking',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatButtonModule,
    MatDatepickerModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  templateUrl: './ticket-booking.component.html',
  styleUrl: './ticket-booking.component.scss',
})
export class TicketBookingComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly orderService = inject(OrderService);
  private readonly rideService = inject(RideService);
  private readonly couponService = inject(CouponService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly loading = signal(false);
  protected readonly discountPercent = signal<number | null>(null);
  protected readonly couponMessage = signal<string | null>(null);
  protected readonly rideList = signal<Ride[]>([]);

  protected readonly form = this.fb.nonNullable.group({
    chosenDate: [null as Date | null, Validators.required],
    ticketType: ['full_day' as 'full_day' | 'hourly', Validators.required],
    hoursAmount: [3],
    rideId: [''],
    couponCode: [''],
  });

  protected readonly ticketType = toSignal(this.form.controls.ticketType.valueChanges, {
    initialValue: this.form.controls.ticketType.value,
  });

  protected readonly hoursAmount = toSignal(this.form.controls.hoursAmount.valueChanges, {
    initialValue: this.form.controls.hoursAmount.value,
  });

  protected readonly isHourly = computed(() => this.ticketType() === 'hourly');

  protected readonly basePrice = computed(() => {
    if (this.isHourly()) {
      const hours = this.hoursAmount() || 0;
      return HOURLY_RATE * hours;
    }
    return FULL_DAY_PRICE;
  });

  protected readonly discountApplied = computed(() => {
    const percent = this.discountPercent();
    if (!percent) {
      return 0;
    }
    return Math.round(this.basePrice() * (percent / 100) * 100) / 100;
  });

  protected readonly finalPrice = computed(() => {
    return Math.round((this.basePrice() - this.discountApplied()) * 100) / 100;
  });

  ngOnInit(): void {
    this.rideService.getRides('active').subscribe({
      next: (res) => this.rideList.set(res.rides),
      error: () => this.rideList.set([]),
    });
  }

  applyCoupon(): void {
    const code = this.form.controls.couponCode.value.trim();
    if (!code) {
      this.discountPercent.set(null);
      this.couponMessage.set(null);
      return;
    }

    this.couponService.validateCode(code).subscribe({
      next: (res) => {
        if (res.valid && res.discountPercent) {
          this.discountPercent.set(res.discountPercent);
          this.couponMessage.set(`Coupon applied: ${res.discountPercent}% off`);
        } else {
          this.discountPercent.set(null);
          this.couponMessage.set(res.message || 'Invalid coupon');
        }
      },
      error: (err) => {
        this.discountPercent.set(null);
        this.couponMessage.set(err.error?.message || 'Could not validate coupon');
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const chosenDate = raw.chosenDate;
    if (!chosenDate) {
      return;
    }

    this.loading.set(true);
    this.orderService
      .createOrder({
        ticketType: raw.ticketType,
        chosenDate: chosenDate.toISOString(),
        hoursAmount: raw.ticketType === 'hourly' ? raw.hoursAmount : undefined,
        rideId: raw.rideId || undefined,
        couponCode: raw.couponCode.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.snackBar.open('Ticket booked successfully!', 'Close', { duration: 3000 });
          this.router.navigate(['/my-orders']);
        },
        error: (err) => {
          this.loading.set(false);
          const message = err.error?.message || 'Booking failed';
          this.snackBar.open(message, 'Close', { duration: 5000 });
        },
        complete: () => this.loading.set(false),
      });
  }
}
