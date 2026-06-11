# Luna Park — Server Instructions

Express 5 **TypeScript** API for Luna Park ticketing, rides, coupons, admin, AI agent, and ticket email.

## Quick Start

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

- API: `http://localhost:3000/api`
- Root: `GET /` — API status
- Health: `GET /api/health`
- Uploads: `http://localhost:3000/uploads`

**Requires:** Node.js 20+, MongoDB (local or **MongoDB Atlas**)

### MongoDB Atlas (team shared DB)

1. Get `MONGO_URI` from your partner (format: `mongodb+srv://...`)
2. Set in `server/.env`
3. In Atlas → **Network Access** → add your IP (or `0.0.0.0/0` for development)
4. Restart server — `seedDatabase()` syncs rides, coupons, and admin on startup

## Environment (`.env`)

Copy from `.env.example` and configure:

| Variable | Description |
|----------|-------------|
| `MONGO_URI` | MongoDB connection string (local or Atlas) |
| `CLIENT_ORIGINS` | Allowed frontend origins (comma-separated) |
| `JWT_SECRET` | Secret for JWT tokens |
| `PORT` | Default `3000` |
| `FULL_DAY_PRICE` | Full-day ticket price (default `50`) |
| `HOURLY_RATE` | Hourly rate (default `15`) |
| `ADMIN_NAME` | Admin display name |
| `ADMIN_EMAIL` | Admin login email (seeded on startup) |
| `ADMIN_PASSWORD` | Admin password (synced on every server start) |
| `SMTP_HOST` | e.g. `smtp.gmail.com` |
| `SMTP_PORT` | `587` for Gmail TLS |
| `SMTP_USER` | Gmail address (must match App Password account) |
| `SMTP_PASS` | Google App Password — 16 chars, no spaces |

### Admin user

On startup, `seedDatabase()` calls `seedAdmin()`:

- Creates admin if missing
- Updates name/password if admin already exists
- **Restart server** after changing `ADMIN_*` in `.env`

Default in development (if unset): `admin@luna-park.local` / `change-me-admin`

### Email (Gmail)

1. Enable 2-Step Verification on Google account
2. Create App Password: https://myaccount.google.com/apppasswords
3. Set in `.env`:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your@gmail.com
   SMTP_PASS=xxxxxxxxxxxxxxxx
   ```
4. Save and restart server (`npm run dev`)

**Important:** `SMTP_USER` and the sender address must be the same Gmail account. The code sets `from` from `SMTP_USER` automatically.

**Without SMTP:** In development only, emails use Ethereal demo (preview link). Tickets also saved to `logs/tickets/`.

`nodemon.json` watches `.env` — changes reload the server.

## Project Structure

```
src/
├── index.ts              # App entry, routes, seed on start
├── types/                # Shared TS types
├── agent/                # AI chat: intentParser, tools, agentService
├── config/env.ts         # Env vars (strips spaces from SMTP_PASS)
├── controllers/
├── middleware/           # auth, admin, shabbat, optionalAuth, logger
├── models/               # User, Order, Ride, Coupon
├── routes/
├── seed/seedData.ts      # 16 rides, 4 coupons, admin
└── utils/
    ├── pricing.ts        # + pricing.test.ts
    ├── jwt.ts            # + jwt.test.ts
    ├── intentParser.test.ts (in agent/)
    └── ...
```

## API Summary

### Auth (`/api/auth`)
- `POST /register` — create customer
- `POST /login` — JWT + user

### Rides (`/api/rides`)
- `GET /` — list (optional `?status=active`)
- `GET /:id` — single ride
- `POST /` — admin, multipart (image + audio)
- `PUT /:id` — admin, multipart
- `DELETE /:id` — admin

### Coupons (`/api/coupons`)
- `GET /validate?code=` — public validation
- `GET /` — admin list
- `POST /`, `PUT /:id`, `DELETE /:id` — admin

### Orders (`/api/orders`)
- `POST /` — customer create order (Shabbat blocked)
- `GET /my-orders` — customer history
- `GET /my-orders/:id/barcode` — PNG barcode
- `POST /my-orders/:id/resend-email` — body: `{ "email": "recipient@example.com" }`
- `GET /validate/:code` — admin ticket validation
- `GET /` — admin all orders

### Agent (`/api/agent`)
- `POST /chat` — `{ "message": "הצג מתקנים" }`
- `POST /execute` — `{ "tool": "list_rides", "params": {} }`
- `GET /tools` — available tools for current role

## Seed Data

First run creates:

- **16 rides** with local images in `uploads/images/`
- **4 coupons:** `LUNA10`, `SUMMER20`, `FAMILY15`, `VIP25`
- **Admin user** from `.env`

## Shabbat / Holidays

`middleware/shabbat.js` blocks POST/PUT/DELETE on orders, rides, and coupons during Shabbat/holidays (Jerusalem, `@hebcal/core`).

## Scripts

```bash
npm run dev    # nodemon + tsx (TypeScript, hot reload)
npm run build  # tsc → dist/
npm start      # node dist/index.js (production)
npm test       # vitest — pricing, jwt, intentParser, rideMatcher, ticketCode
```

## Do Not Commit

- `.env`
- `logs/`
- `uploads/` (generated media)
