import { TestBed } from '@angular/core/testing';
import { CartService } from './cart.service';
import { Ride } from '../models/ride.model';

const ride = (id: string, name: string, price: number, status: Ride['status'] = 'active'): Ride => ({
  _id: id,
  name,
  price,
  status,
});

describe('CartService', () => {
  let service: CartService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CartService);
    service.clear();
  });

  it('starts empty', () => {
    expect(service.count()).toBe(0);
    expect(service.total()).toBe(0);
  });

  it('adds active rides', () => {
    service.addRide(ride('1', 'גלגל הענק', 30));
    expect(service.count()).toBe(1);
    expect(service.total()).toBe(30);
    expect(service.hasRide('1')).toBe(true);
  });

  it('does not add duplicate rides', () => {
    const item = ride('1', 'גלגל הענק', 30);
    service.addRide(item);
    service.addRide(item);
    expect(service.count()).toBe(1);
  });

  it('does not add maintenance rides', () => {
    service.addRide(ride('2', 'מתקן בתחזוקה', 20, 'maintenance'));
    expect(service.count()).toBe(0);
  });

  it('removes rides and clears cart', () => {
    service.addRide(ride('1', 'גלגל הענק', 30));
    service.addRide(ride('2', 'קרוסלה', 20));
    service.removeRide('1');
    expect(service.count()).toBe(1);
    expect(service.total()).toBe(20);

    service.clear();
    expect(service.count()).toBe(0);
  });
});
