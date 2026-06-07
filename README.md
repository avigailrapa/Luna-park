# Luna-park

Full-stack amusement park management system built with Node.js, Angular, and MongoDB.

## Features

### Authentication & accounts (Partner A)

- User registration and login with JWT
- Role-based access (`customer`, `admin`)
- Password hashing via Mongoose hooks

### Ticketing & orders (Partner A)

- Book full-day or hourly tickets
- Optional ride selection and coupon codes
- Server-side price calculation with discounts
- Order history for customers; full order list for admins
- Shabbat and holiday blocking on order creation

### Rides & coupons (Partner B — `feature/part-2`)

- Rides catalog with image cards, audio, and data table
- Admin dashboard: rides CRUD (FormData upload) + coupons CRUD
- Multer media uploads (`/uploads/images`, `/uploads/audio`)
- Seed data with images downloaded from Unsplash on first run

### Server (`server/`)

- **Models:** `User.js`, `Order.js`, `Ride.js`, `Coupon.js`
- **Routes:** `/api/auth`, `/api/orders`, `/api/rides`, `/api/coupons`
- **Utils:** `pricing.js`, `couponValidator.js`, `upload.js`
- **Middleware:** auth, admin, shabbat, logger

### Client (`client/`)

- Login / Register
- Rides catalog with images and optional audio
- Ticket booking with live price preview
- Order history
- Admin dashboard for rides and coupons (Material tables)
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
Static uploads: `http://localhost:3000/uploads`

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
| GET | `/api/rides` | Public |
| GET | `/api/rides/:id` | Public |
| POST/PUT/DELETE | `/api/rides` | Admin (FormData; blocked on Shabbat/holidays) |
| GET | `/api/coupons/validate` | Public |
| GET/POST/PUT/DELETE | `/api/coupons` | Admin (mutations blocked on Shabbat/holidays) |

## Team ownership

| Area | Partner A | Partner B |
|------|-----------|-----------|
| Models | User, Order | Ride, Coupon |
| Routes | `/api/auth`, `/api/orders` | `/api/rides`, `/api/coupons` |
| Client | Login, Booking, Orders | Rides catalog, Admin dashboard |
| Shared | Logger, Shabbat middleware | `upload.js`, static `/uploads` |
