import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-admin-placeholder',
  imports: [MatCardModule],
  template: `
    <div class="page">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Admin Dashboard</mat-card-title>
          <mat-card-subtitle>Manage rides and coupons — dashboard coming soon.</mat-card-subtitle>
        </mat-card-header>
      </mat-card>
    </div>
  `,
  styles: `
    .page {
      max-width: 720px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }
  `,
})
export class AdminPlaceholderComponent {}
