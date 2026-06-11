# Luna Park — Client Instructions

Angular 21 RTL frontend for Luna Park — home carousel, rides, cart, booking, orders, admin, and floating AI agent.

## Quick Start

```bash
cd client
npm install
npm start
```

App: `http://localhost:4200`  
API: `http://localhost:3000/api` (see `src/environments/environment.ts`)

**Requires:** Server running on port 3000, MongoDB (local or Atlas via `MONGO_URI`).

## Pages & Routes

| Route | Page | Who |
|-------|------|-----|
| `/` | Home — image carousel, park intro | Everyone |
| `/rides` | Rides catalog (GYG-style cards) | Everyone |
| `/login` | Login | Everyone |
| `/register` | Register (customer) | Everyone |
| `/book` | Ticket booking | Customer |
| `/cart-checkout` | Cart + payment | Customer |
| `/my-orders` | Order history | Customer |
| `/admin` | Admin dashboard | Admin only |

## AI Agent (Floating Chat)

- **Not a route** — `app-agent-panel` in `app.html` (bottom-corner button)
- Site-colored Gemini-style panel
- Hebrew commands: `הוסף לסל`, `הצג מתקנים`, `מה בסל`, `עזרה`
- **Add to cart:** shows ride picker (name + price); click or type number/name
- **Login required** for add/remove cart actions through the agent
- Uses `AgentService` → `POST /api/agent/chat`

## Customer Flow

1. Browse rides at `/rides`
2. Add rides to cart (catalog or AI agent)
3. Checkout at `/cart-checkout` — apply coupon code for discount
4. View orders at `/my-orders`
5. Click **הצג** on barcode column:
   - View ticket barcode
   - **הדפסה** — print ticket
   - **שליחה למייל** — enter any email address and send

## Admin Flow

1. Login with admin account (configured in `server/.env` — credentials are **not** shown on the login page)
2. Redirected to `/admin` or use **ניהול** in navbar
3. Tabs:
   - **מתקנים** — add/delete rides (image + audio upload)
   - **קופונים** — add/delete/toggle coupons (code, discount %, expiry)

Customers use coupon codes during booking/checkout — discount applied server-side.

## Project Structure

```
src/app/
├── core/
│   ├── services/     # auth, ride, order, cart, coupon, agent
│   ├── guards/       # authGuard, roleGuard
│   ├── interceptors/ # JWT Bearer
│   └── models/
├── features/
│   ├── home/         # Carousel landing
│   ├── auth/
│   ├── rides/
│   ├── orders/       # booking, cart-checkout, order-history, barcode dialog
│   └── admin/
├── shared/
│   ├── components/navbar/
│   └── components/agent-panel/
├── app.routes.ts
└── styles.scss       # --gyg-* theme, RTL, Heebo font
```

Public images: `client/public/images/`  
Ride API images: `http://localhost:3000/uploads/images/`

## Key Services

| Service | Purpose |
|---------|---------|
| `AuthService` | Login, register, JWT, signals (`isAdmin`, `isCustomer`) |
| `CartService` | Client-side cart (signals) |
| `RideService` | Rides CRUD + FormData |
| `OrderService` | Orders, barcode blob, resend email |
| `CouponService` | Validate + admin CRUD |
| `AgentService` | AI chat API |

## Styling

- RTL (`direction: rtl` in `styles.scss`)
- Theme: coral orange `#ff5533`, navy `#1a2b49`
- Material components with custom CSS variables

## Scripts

```bash
npm start       # ng serve :4200
npm run build   # production build
npm run build:pages  # GitHub Pages build
npm test        # vitest — app, auth, cart, navbar specs
```

## Unit Tests

| File | Covers |
|------|--------|
| `app.spec.ts` | App bootstrap |
| `auth.service.spec.ts` | Login state, logout |
| `cart.service.spec.ts` | Add/remove/clear cart |
| `navbar.component.spec.ts` | Navbar component |

## Email Notes (Barcode)

Real email requires server SMTP configured in `server/.env`.  
If SMTP is missing, server may return a demo preview link (development only).  
After changing server `.env`, restart the server.

## Tips

- Hard refresh: `Ctrl+F5` if UI looks stale
- Admin password changes require **server restart**
- Do not put secrets in `environment.ts` or any client file
