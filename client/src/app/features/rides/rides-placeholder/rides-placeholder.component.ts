import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-rides-placeholder',
  imports: [MatCardModule],
  template: `
    <div class="page">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Rides Catalog</mat-card-title>
          <mat-card-subtitle>Browse all park rides — full catalog coming soon.</mat-card-subtitle>
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
export class RidesPlaceholderComponent {}
