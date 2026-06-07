export interface Ride {
  _id: string;
  name: string;
  description?: string;
  capacity?: number;
  minimumHeight?: number;
  category?: string;
  status?: 'active' | 'maintenance';
  imageUrl?: string;
  audioUrl?: string;
}

export interface RideRef {
  _id: string;
  name: string;
}
