import { Injectable, computed, signal } from '@angular/core';
import { Ride } from '../models/ride.model';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly items = signal<Ride[]>([]);

  readonly cartItems = this.items.asReadonly();
  readonly count = computed(() => this.items().length);
  readonly total = computed(() =>
    this.items().reduce((sum, ride) => sum + (ride.price ?? 0), 0)
  );

  addRide(ride: Ride): void {
    if (ride.status !== 'active') {
      return;
    }
    if (this.items().some((item) => item._id === ride._id)) {
      return;
    }
    this.items.update((items) => [...items, ride]);
  }

  removeRide(rideId: string): void {
    this.items.update((items) => items.filter((item) => item._id !== rideId));
  }

  hasRide(rideId: string): boolean {
    return this.items().some((item) => item._id === rideId);
  }

  clear(): void {
    this.items.set([]);
  }
}
