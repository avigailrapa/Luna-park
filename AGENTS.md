# AGENTS.md

Instructions for AI coding agents working in **Luna-park** — a full-stack amusement park management system (Hebrew RTL UI).

## Agent Persona

Operate as a senior full-stack developer and architect:

- **Modern syntax first** — Angular Signals, `inject()`, standalone components; Express 5 + Mongoose patterns on the server.
- **Security & performance** — Server-side validation, JWT, never trust client prices. **Never expose admin credentials in the UI.**
- **Clean code** — Minimal scope per change; match existing conventions.
- **Communication** — Direct and technical.

## Project Overview

Luna Park Tel Aviv — ticketing, rides catalog, cart checkout, coupons, admin dashboard, AI chat agent, barcode tickets, and optional email delivery.

| Layer | Stack |
|-------|-------|
| Server | Node.js 20+, Express 5, Mongoose 9, CommonJS, nodemailer, bwip-js |
| Client | Angular 21, standalone components, Angular Material, Signals, RTL (Heebo) |
| Database | MongoDB |

## Commands

### Server (`server/`)

```bash
cd server
cp .env.example .env
npm install
npm run dev    # nodemon — watches src/ and .env
npm start
```

API: `http://localhost:3000/api`  
Uploads: `http://localhost:3000/uploads`

### Client (`client/`)

```bash
cd client
npm install
npm start      # http://localhost:4200
npm run build
npm test
```

### Prerequisites

- Node.js 20+
- MongoDB: `mongodb://127.0.0.1:27017/luna-park`

## Architecture

```
project/
├── server/src/
│   ├── index.js
│   ├── agent/                 # NL intent parser + tool execution
│   ├── config/                # env.js, db.js
│   ├── controllers/
│   ├── middleware/            # auth, admin, shabbat, optionalAuth, logger
│   ├── models/                # User, Order, Ride, Coupon
│   ├── routes/                # auth, orders, rides, coupons, agent
│   ├── seed/seedData.js       # 16 rides, coupons, admin user
│   └── utils/                 # jwt, pricing, couponValidator, upload, orderEmail, barcode
└── client/src/app/
    ├── core/                  # services, guards, interceptors, models
    ├── features/              # home, auth, rides, orders, admin
    └── shared/                # navbar, agent-panel (floating chat)
```

## Client Routes

| Path | Component | Access |
|------|-----------|--------|
| `/` | Home (image carousel) | Public |
| `/rides` | Rides catalog | Public |
| `/login`, `/register` | Auth | Public |
| `/book` | Ticket booking | Customer |
| `/cart-checkout` | Cart checkout | Customer |
| `/my-orders` | Order history + barcode | Customer |
| `/admin` | Admin dashboard | Admin |

**AI agent:** floating panel (`app-agent-panel` in `app.html`) — not a separate route.

## API Routes

| Method | Path | Access |
|--------|------|--------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/rides`, `/api/rides/:id` | Public |
| POST/PUT/DELETE | `/api/rides` | Admin (multipart; Shabbat block) |
| GET | `/api/coupons/validate?code=` | Public |
| GET/POST/PUT/DELETE | `/api/coupons` | Admin (mutations Shabbat block) |
| POST | `/api/orders` | Customer (Shabbat block) |
| GET | `/api/orders/my-orders` | Customer |
| GET | `/api/orders/my-orders/:id/barcode` | Customer (PNG) |
| POST | `/api/orders/my-orders/:id/resend-email` | Customer (`{ email }` body) |
| GET | `/api/orders/validate/:code` | Admin |
| GET | `/api/orders` | Admin |
| GET | `/api/health` | Public |
| POST | `/api/agent/chat` | Optional JWT |
| POST | `/api/agent/execute` | Optional JWT |
| GET | `/api/agent/tools` | Optional JWT |

## Luna Park AI Agent

- **Server:** `server/src/agent/` — `intentParser.js`, `agentService.js`, `tools.js`, `rideMatcher.js`
- **Client:** `shared/components/agent-panel/` — Gemini-style floating chat (site colors)
- **Cart tools:** `pick_ride_for_cart`, `add_to_cart`, `remove_from_cart`; client-side `cart_show` / `cart_clear`
- **Hebrew examples:** `הוסף לסל`, `הצג מתקנים`, `ההזמנות שלי`, `בדוק קופון SUMMER20`

## Admin User

Seeded/synced on server start from `server/.env`:

- `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- Dev defaults if unset: `admin@luna-park.local` / `change-me-admin`
- Password updates apply **only after server restart** (nodemon watches `.env`)
- **Never** display admin credentials on login or public pages

Admin dashboard (`/admin`): rides CRUD + coupons CRUD. Seed coupons: `LUNA10`, `SUMMER20`, `FAMILY15`, `VIP25`.

## Email (Tickets)

- `server/src/utils/orderEmail.js` — order confirmation + barcode PNG attachment
- `SMTP_USER` must match the Gmail account; `from` address is derived from `SMTP_USER` (not a mismatched `EMAIL_FROM`)
- `SMTP_PASS`: Google **App Password**, 16 chars, no spaces (spaces stripped in `env.js`)
- Without SMTP in development: Ethereal demo email + preview URL (only when SMTP vars empty)
- Without SMTP when configured but auth fails: return error — do not fall back to demo
- Local fallback: `server/logs/tickets/{ticketCode}.html` + `.png`

## Ticket Barcode (Client)

- `ticket-barcode-dialog` — view barcode, **print**, **send email** (custom recipient field)
- `OrderService.resendOrderEmail(orderId, email)`

## Code Style

### Server (CommonJS)

- camelCase files; `module.exports`; async controllers with `try/catch` / `next(err)`
- Enums: `'full_day'`, `'hourly'`, `'ride'`, `'customer'`, `'admin'`

### Client (Angular)

- kebab-case files; `app-*` selectors; `inject()`; `@if` / `@for`
- CSS vars: `--gyg-orange`, `--gyg-navy`, etc. in `styles.scss`

## Environment (`server/.env`)

| Variable | Purpose |
|----------|---------|
| `MONGO_URI` | MongoDB |
| `JWT_SECRET` | JWT signing |
| `FULL_DAY_PRICE` / `HOURLY_RATE` | Server pricing (50 / 15) |
| `ADMIN_*` | Auto-seed admin user |
| `SMTP_HOST/PORT/USER/PASS` | Gmail (or other SMTP) for real emails |

Client: `client/src/environments/environment.ts` — `apiUrl`, `uploadsUrl`

## Security

- bcrypt password hashing; JWT Bearer auth
- Admin/customer role guards on client and server
- Server-side pricing only; Shabbat middleware on mutations
- Never commit `.env`, `server/logs/`, `server/uploads/`

## Git Conventions

- Do not commit or push unless explicitly asked
- Never force-push `main`

## Boundaries

**Always:** validate on server; keep admin secrets out of UI; restart server after `.env` email/admin changes.

**Never:** hard-code credentials; skip Shabbat on order/coupon/ride mutations; expose `SMTP_PASS` in client code.
