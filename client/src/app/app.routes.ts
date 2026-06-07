import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { TicketBookingComponent } from './features/orders/ticket-booking/ticket-booking.component';
import { OrderHistoryComponent } from './features/orders/order-history/order-history.component';
import { RidesCatalogComponent } from './features/rides/rides-catalog/rides-catalog.component';
import { CartCheckoutComponent } from './features/orders/cart-checkout/cart-checkout.component';
import { AdminDashboardComponent } from './features/admin/admin-dashboard/admin-dashboard.component';
import { HomeComponent } from './features/home/home.component';
export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'rides', component: RidesCatalogComponent },
  {
    path: 'book',
    component: TicketBookingComponent,
    canActivate: [authGuard, roleGuard('customer')],
  },
  {
    path: 'cart-checkout',
    component: CartCheckoutComponent,
    canActivate: [authGuard, roleGuard('customer')],
  },
  {
    path: 'my-orders',
    component: OrderHistoryComponent,
    canActivate: [authGuard, roleGuard('customer')],
  },
  {
    path: 'admin',
    component: AdminDashboardComponent,
    canActivate: [authGuard, roleGuard('admin')],
  },
  { path: '**', redirectTo: '' },
];
