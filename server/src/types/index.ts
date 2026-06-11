export type UserRole = 'customer' | 'admin';
export type AgentRole = 'guest' | UserRole;

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface AppError extends Error {
  statusCode?: number;
  status?: number;
  code?: string;
}

export type TicketType = 'full_day' | 'hourly' | 'ride';

export interface CouponLike {
  _id?: unknown;
  code: string;
  discountPercent: number;
}
