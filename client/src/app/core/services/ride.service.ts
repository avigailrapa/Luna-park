import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Ride } from '../models/ride.model';

@Injectable({ providedIn: 'root' })
export class RideService {
  private readonly http = inject(HttpClient);

  getRides(status?: string): Observable<{ rides: Ride[] }> {
    const params = status ? { status } : undefined;
    return this.http.get<{ rides: Ride[] }>(`${environment.apiUrl}/rides`, { params });
  }
}
