# Luna-park

Full-stack amusement park management system built with Node.js, Angular, and MongoDB.

## Features

### Authentication & accounts

- User registration and login with JWT
- Role-based access (`customer`, `admin`)
- Password hashing via Mongoose hooks

### Ticketing & orders

- Book full-day or hourly tickets
- Optional ride selection and coupon codes
- Server-side price calculation with discounts
- Order history for customers; full order list for admins
- Shabbat and holiday blocking on order creation

### Server (`server/`)

- **Models:** `User.js`, `Order.js`
- **Routes:** `/api/auth`, `/api/orders`
- **Utils:** `pricing.js`, `couponValidator.js`
- **Middleware:** auth, admin, shabbat, logger

### Client (`client/`)

- Login / Register
- Ticket booking with live price preview
- Order history
- AuthService with Signals, route guards, JWT interceptor

## Quick start

### Prerequisites

- Node.js 20+
- MongoDB running locally

### Server

```bash
cd server
cp .env.example .env   # if .env missing
npm install
npm run dev
```

API: `http://localhost:3000/api`

### Client

```bash
cd client
npm install
npm start
```

App: `http://localhost:4200`

## API

| Method | Path | Access |
|--------|------|--------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| POST | `/api/orders` | Customer (JWT; blocked on Shabbat/holidays) |
| GET | `/api/orders/my-orders` | Customer |
| GET | `/api/orders` | Admin |

## Related modules

The booking flow integrates with the rides and coupons modules:

- `GET /api/rides` — populate the ride dropdown when booking
- `GET /api/coupons/validate` — preview coupon discounts
- `models/Coupon.js` — required for applying coupon codes on orders
- `models/Ride.js` — validates optional `rideId` on orders

Until those modules are in place, orders work without a ride or coupon; invalid coupon requests return `503`.
