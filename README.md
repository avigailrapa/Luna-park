# Luna-park

A full-stack amusement park management and digital ticketing system.  
Hebrew UI (RTL), modern booking-platform-inspired design, Angular 21 on the client, and Node.js + MongoDB on the server.

**Luna-park** is a full-stack amusement park ticketing and management system — Hebrew UI, image-rich catalog, cart checkout, barcode confirmations, AI assistant, and admin tools.

## Project overview

Visitors can browse a home page with a carousel of real park photos, explore a catalog of **16 rides**, add attractions to a cart and pay, or book an entry ticket (full day / hourly) with coupon codes. After checkout, they receive confirmation with a **digital barcode** (email or “My Orders”). A floating **AI agent** helps find rides and build a cart. Admins manage rides, coupons, and orders from a dedicated dashboard.

| Layer | Stack |
|-------|-------|
| Client | Angular 21, Angular Material, Signals, standalone components |
| Server | Node.js 20+, Express 5, Mongoose 9 |
| Database | MongoDB |
| Auth | JWT, role-based (`customer`, `admin`) |

## Features

### Home & user experience

- Home page (`/`) with image carousel and a preview of 3 featured rides
- Rides catalog (`/rides`) — cards with images, prices, and status
- GetYourGuide-style layout — navigation, cards, and brand colors
- Real park images (Wikimedia Commons), stored locally under `/uploads`

### AI agent

- Floating chat panel on every page
- Natural-language ride search and recommendations
- Add rides to cart via the agent
- Server-side tools: ride lookup, cart actions, order helpers

### Authentication & accounts

- User registration and login with JWT
- Role-based access (`customer`, `admin`)
- Password hashing via Mongoose hooks
- Admin user seeded/synced from `.env` on startup

### Ticketing & orders

- Book full-day or hourly tickets with live price preview
- Cart: add rides from catalog → checkout (demo payment flow)
- Coupon codes with server-side validation and discounts
- Server-side price calculation — never trust client totals
- Order history; barcode dialog with print and email options
- Email confirmation with embedded barcode (SMTP / local fallback)
- Shabbat and holiday blocking on order creation

### Rides & coupons

- 16 rides seeded with park images
- Rides catalog with image cards and add-to-cart
- Admin dashboard: rides CRUD (FormData upload) + coupons CRUD
- Multer media uploads (`/uploads/images`, `/uploads/audio`)

### Server (`server/`)

- **Models:** `User.js`, `Order.js`, `Ride.js`, `Coupon.js`
- **Routes:** `/api/auth`, `/api/orders`, `/api/rides`, `/api/coupons`, `/api/agent`
- **Utils:** `pricing.js`, `couponValidator.js`, `upload.js`, `barcode.js`, `orderEmail.js`
- **Agent:** `agentService.js`, `intentParser.js`, `rideMatcher.js`, `tools.js`
- **Middleware:** auth, admin, shabbat, logger, optionalAuth
- **Seed:** rides, coupons, admin user, image backfill from Wikimedia

### Client (`client/`)

- Home, Login / Register, Rides catalog, Cart checkout
- Ticket booking with hourly time range and coupons
- Order history with barcode view
- Admin dashboard for rides and coupons
- AI agent panel and chat components
- AuthService with Signals, route guards, JWT interceptor, CartService

## Quick start

### Prerequisites

- Node.js 20+
- MongoDB running locally

### Server

```bash
cd server
cp .env.example .env   # if .env missing — set MONGO_URI, ADMIN_EMAIL, ADMIN_PASSWORD
npm install
npm run dev
```

API: `http://localhost:3000/api`  
Static uploads: `http://localhost:3000/uploads`

On first run, seed downloads ride images from Wikimedia (requires network).

### Client

```bash
cd client
npm install
npm start
```

App: `http://localhost:4200`

### Default admin (from `.env`)

Configure `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `server/.env` before first startup.

## Live demo link (GitHub Pages)

After pushing to `main`, the site is published automatically to:

**https://sarigetsel.github.io/Luna-park/**

### One-time GitHub setup

1. Open the repo on GitHub → **Settings** → **Pages**
2. Under **Build and deployment**, set **Source** to **GitHub Actions**
3. Push to `main` (or run the **Deploy site to GitHub Pages** workflow manually)

### Backend for the live site

GitHub Pages hosts only the Angular frontend. The API must run in the cloud (for example [Render](https://render.com)):

1. Create a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster and copy the connection string
2. On Render, create a **Web Service** from this repo (or import `render.yaml`)
3. Set environment variables: `MONGO_URI`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and optional SMTP vars
4. Ensure `CLIENT_ORIGINS` includes `https://sarigetsel.github.io`
5. The frontend expects the API at `https://luna-park-api.onrender.com` (see `client/src/environments/environment.prod.ts`)

Share the GitHub Pages URL with anyone — they can browse the site without installing anything locally.

## API

| Method | Path | Access |
|--------|------|--------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| POST | `/api/orders` | Customer (JWT; blocked on Shabbat/holidays) |
| GET | `/api/orders/my-orders` | Customer |
| GET | `/api/orders/my-orders/:id/barcode` | Customer |
| GET | `/api/orders` | Admin |
| GET | `/api/rides` | Public |
| GET | `/api/rides/:id` | Public |
| POST/PUT/DELETE | `/api/rides` | Admin (FormData; blocked on Shabbat/holidays) |
| GET | `/api/coupons/validate` | Public |
| GET/POST/PUT/DELETE | `/api/coupons` | Admin (mutations blocked on Shabbat/holidays) |
| GET | `/api/agent/tools` | Public (optional JWT) |
| POST | `/api/agent/chat` | Public (optional JWT) |
| POST | `/api/agent/execute` | Public (optional JWT) |

## Team ownership

| Area | Partner A | Partner B |
|------|-----------|-----------|
| Models | User, Order | Ride, Coupon |
| Routes | `/api/auth`, `/api/orders` | `/api/rides`, `/api/coupons` |
| Client | Login, Booking, Orders, Cart | Home, Rides catalog, Admin dashboard |
| Shared | Logger, Shabbat middleware, barcode/email, AI agent | `upload.js`, static `/uploads`, seed |
