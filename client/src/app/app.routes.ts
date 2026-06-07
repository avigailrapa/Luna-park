import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { TicketBookingComponent } from './features/orders/ticket-booking/ticket-booking.component';
import { OrderHistoryComponent } from './features/orders/order-history/order-history.component';
import { RidesPlaceholderComponent } from './features/rides/rides-placeholder/rides-placeholder.component';
import { AdminPlaceholderComponent } from './features/admin/admin-placeholder/admin-placeholder.component';

export const routes: Routes = [
  { path: '', redirectTo: 'rides', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'rides', component: RidesPlaceholderComponent },
  {
    path: 'book',
    component: TicketBookingComponent,
    canActivate: [authGuard, roleGuard('customer')],
  },
  {
    path: 'my-orders',
    component: OrderHistoryComponent,
    canActivate: [authGuard, roleGuard('customer')],
  },
  {
    path: 'admin',
    component: AdminPlaceholderComponent,
    canActivate: [authGuard, roleGuard('admin')],
  },
  { path: '**', redirectTo: 'rides' },
];
