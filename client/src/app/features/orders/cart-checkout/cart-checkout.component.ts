import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { CartService } from '../../../core/services/cart.service';
import { OrderService } from '../../../core/services/order.service';

@Component({
  selector: 'app-cart-checkout',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './cart-checkout.component.html',
  styleUrl: './cart-checkout.component.scss',
})
export class CartCheckoutComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  protected readonly cart = inject(CartService);
  private readonly orderService = inject(OrderService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly paying = signal(false);
  protected readonly paymentDone = signal(false);
  private paymentTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly form = this.fb.nonNullable.group({
    chosenDate: [null as Date | null, Validators.required],
    cardName: ['', [Validators.required, Validators.minLength(2)]],
    cardNumber: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]],
    expiry: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]],
    cvv: ['', [Validators.required, Validators.pattern(/^\d{3}$/)]],
  });

  ngOnInit(): void {
    if (this.cart.count() === 0) {
      this.router.navigate(['/rides']);
    }
  }

  ngOnDestroy(): void {
    if (this.paymentTimer !== null) {
      clearTimeout(this.paymentTimer);
      this.paymentTimer = null;
    }
  }

  protected formatCardNumber(value: string): void {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    this.form.controls.cardNumber.setValue(digits, { emitEvent: false });
  }

  protected formatExpiry(value: string): void {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    const formatted = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
    this.form.controls.expiry.setValue(formatted, { emitEvent: false });
  }

  protected pay(): void {
    if (this.form.invalid || this.cart.count() === 0) {
      this.form.markAllAsTouched();
      return;
    }

    const chosenDate = this.form.controls.chosenDate.value;
    if (!chosenDate) {
      return;
    }

    this.paying.set(true);
    this.paymentDone.set(false);

    this.paymentTimer = setTimeout(() => {
      this.paymentTimer = null;
      this.paymentDone.set(true);
      const dateIso = chosenDate.toISOString();
      const requests = this.cart.cartItems().map((ride) =>
        this.orderService.createOrder({
          ticketType: 'ride',
          chosenDate: dateIso,
          rideId: ride._id,
        })
      );

      forkJoin(requests).subscribe({
          next: (results) => {
            this.cart.clear();
            this.paying.set(false);
            const allEmailed = results.every((res) => res.emailSent);
            const anyEmailed = results.some((res) => res.emailSent);
            let msg = 'התשלום בוצע! ההזמנות בוצעו בהצלחה.';
            if (allEmailed) {
              msg = 'התשלום בוצע! אישורים עם ברקוד נשלחו לאימייל שלך.';
            } else if (anyEmailed) {
              msg +=
                ' חלק מהאישורים נשלחו לאימייל — לשאר לחצי "הצג ברקוד" בהזמנות שלי.';
            } else {
              msg += ' הציגי את הברקוד ב"ההזמנות שלי".';
            }
            this.snackBar.open(msg, 'סגור', { duration: 7000 });
            this.router.navigate(['/my-orders']);
          },
          error: (err) => {
            this.paying.set(false);
            this.paymentDone.set(false);
            this.snackBar.open(err.error?.message || 'ההזמנה נכשלה', 'סגור', { duration: 5000 });
          },
        });
    }, 1500);
  }
}
