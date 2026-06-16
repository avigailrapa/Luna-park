import { AfterViewInit, Component, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

import { AuthService } from '../../core/services/auth.service';
import { RideService } from '../../core/services/ride.service';
import { Ride } from '../../core/models/ride.model';
import { getPublicVideoUrl, getRidePublicImage } from '../../core/constants/park-gallery';
import { environment } from '../../../environments/environment';

const CATEGORY_LABELS: Record<string, string> = {
  thrill: 'ריגושים',
  family: 'משפחה',
  kids: 'ילדים',
  water: 'מים',
  show: 'מופע',
};

@Component({
  selector: 'app-home',
  imports: [RouterLink, MatButtonModule, MatIconModule, MatCardModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, AfterViewInit {
  @ViewChild('heroVideo') private heroVideo?: ElementRef<HTMLVideoElement>;

  protected readonly auth = inject(AuthService);
  private readonly rideService = inject(RideService);

  protected readonly heroVideoUrl = getPublicVideoUrl('vid.mp4');
  protected readonly featuredRides = signal<Ride[]>([]);

  protected categoryLabel(category?: string): string {
    return category ? (CATEGORY_LABELS[category] ?? category) : '—';
  }

  protected mediaUrl(path?: string): string {
    if (!path) {
      return getRidePublicImage();
    }
    if (path.startsWith('http')) {
      return path;
    }
    return `${environment.uploadsUrl}${path}`;
  }

  protected rideImage(ride: Ride): string {
    if (!ride.imageUrl) {
      return getRidePublicImage(ride.name);
    }
    return this.mediaUrl(ride.imageUrl);
  }

  ngOnInit(): void {
    this.rideService.getRides().subscribe({
      next: (res) => {
        const active = res.rides.filter((r) => r.status === 'active');
        const picked: Ride[] = [];
        const categories = ['thrill', 'family', 'water', 'kids', 'show'];

        for (const cat of categories) {
          if (picked.length >= 3) break;
          const ride = active.find((r) => r.category === cat && !picked.includes(r));
          if (ride) picked.push(ride);
        }

        while (picked.length < 3 && picked.length < active.length) {
          const next = active.find((r) => !picked.includes(r));
          if (!next) break;
          picked.push(next);
        }

        this.featuredRides.set(picked);
      },
    });
  }

  ngAfterViewInit(): void {
    const video = this.heroVideo?.nativeElement;
    if (!video) {
      return;
    }

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    const startPlayback = () => {
      void video.play().catch(() => {
        // Autoplay may be blocked until user interaction — video still visible after manual play.
      });
    };

    if (video.readyState >= 2) {
      startPlayback();
      return;
    }

    video.addEventListener('loadeddata', startPlayback, { once: true });
    video.load();
  }
}
