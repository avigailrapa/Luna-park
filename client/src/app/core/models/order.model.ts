export interface RideRef {
  _id: string;
  name: string;
}

export interface Order {
  _id: string;
  userId: string;
  rideId?: RideRef | string | null;
  ticketType: 'full_day' | 'hourly';
  purchaseDate: string;
  chosenDate: string;
  hoursAmount?: number | null;
  couponCode?: string | null;
  totalPrice: number;
  discountApplied: number;
  finalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt?: string;
}

export interface CreateOrderDto {
  ticketType: 'full_day' | 'hourly';
  chosenDate: string;
  hoursAmount?: number;
  rideId?: string;
  couponCode?: string;
}

export interface CouponValidation {
  valid: boolean;
  discountPercent?: number;
  message?: string;
}
