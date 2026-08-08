# Vaayu

> A hyperlocal campus-delivery app for IIIT Tiruchirappalli.

Vaayu helps students discover nearby campus shops, build an order, choose a scheduled or instant delivery option, and follow the order through fulfillment. It also includes a simplified, multilingual dashboard for shop partners and workers.

The primary app is built with Expo and React Native. This repository also contains a Vite web prototype and a small Express API for local experimentation.

## What’s included

- Google sign-in through Supabase Auth, with customer access limited to `@iiitt.ac.in` accounts
- Customer and partner/worker roles
- Campus shop catalogue with category filters, search, saved shops, menus, and a one-shop-at-a-time cart
- Scheduled delivery slots and instant delivery, configurable delivery/platform fees, delivery notes, and cash-on-delivery checkout
- Remote app configuration, server-side promo-code validation, and Supabase order creation
- Live order history and status tracking through Supabase Realtime
- Shop-owner dashboard for accepting, preparing, dispatching, and completing orders; includes Hindi and English interface strings
- Expo push-token registration plus a Supabase Edge Function for sending push notifications

## Tech stack

| Area | Technology |
| --- | --- |
| Mobile app | Expo SDK 54, React Native, TypeScript |
| Styling | Tailwind React Native Classnames (`twrnc`) |
| Backend services | Supabase Auth, Postgres, Realtime, Edge Functions |
| Notifications | Expo Notifications / Expo Push Service |
| Local API prototype | Express, TypeScript, JSON-file persistence |
| Web prototype | Vite, React, Tailwind CSS, Framer Motion |

## Repository layout

```text
.
├── App.tsx                   # Expo app shell, session and navigation state
├── screens/                  # Customer, authentication, and partner UI
├── components/               # Shared UI components
├── lib/                      # Supabase, Auth, notifications, remote config
├── assets/                   # App icons and catalogue imagery
├── supabase/functions/       # Edge Function for Expo push notifications
├── backend/                  # Standalone Express API prototype
└── web-version/              # Vite web prototype
```

## Getting started: mobile app

### Prerequisites

- Node.js LTS and npm
- An Expo-compatible Android/iOS simulator or a physical device
- A Supabase project for authentication, data, and realtime features

### 1. Clone and install

```bash
git clone https://github.com/nishant-000/vaayu-hyperlocal-delivery-app.git
cd vaayu-hyperlocal-delivery-app
npm install
```

### 2. Configure Supabase

Create a `.env` file from the example and fill in your project credentials:

```bash
cp .env.example .env
```

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp`.

In Supabase, enable the Google provider and add this redirect URL:

```text
vaayu://auth/callback
```

The app expects these Supabase resources when using the live data paths:

- `shops` and related `menu_items`
- `orders`
- `app_config`
- `push_tokens`
- `validate_promo_code(p_code, p_cart_total)` RPC

Enable Realtime for `orders` and `app_config`. Apply Row Level Security policies before deploying: customer users should only be able to read their own orders, while partner/worker access should be scoped to their shop.

If the `shops` query is unavailable, the home screen falls back to a small local sample catalogue. Remote-config failures similarly fall back to defaults, so the UI remains usable during development.

### 3. Run the app

```bash
npm start
```

Then use the Expo developer tools to open a target, or run one of:

```bash
npm run android
npm run ios
npm run web
```

## Push notifications

The app registers Expo push tokens in the `push_tokens` table after notification permission is granted. Deploy the included Edge Function to send notifications through Expo:

```bash
supabase functions deploy send-push
```

The function expects the standard Supabase runtime variables `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` when it needs to remove unregistered devices. Keep service-role keys server-side only.

## Local Express API prototype

`backend/` is a standalone prototype API. It provides registration, fee estimation, order creation, order listing/status updates, and delivery configuration; it stores development data in a generated `backend/db.json` file.

```bash
cd backend
npm install
npm run dev
```

It starts at `http://localhost:3000`. The current Expo checkout and tracking implementation use Supabase directly; the Express API is useful for local experimentation or as a starting point for a dedicated service layer.

## Web prototype

The responsive browser version is isolated in `web-version/`:

```bash
cd web-version
npm install
npm run dev
```

For live Supabase access, provide `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `web-version/.env.local`.

## Delivery workflow

```text
Customer signs in
    → discovers a shop and adds items
    → selects scheduled or instant delivery
    → enters delivery details and optionally applies a promo
    → checkout creates an order in Supabase
    → partner/worker handles the order in the dashboard
    → Realtime updates the customer’s order-tracking view
```

## Important implementation notes

- Checkout currently records `payment_mode: "cod"`; no online payment gateway is integrated.
- Customer Google sign-in is intentionally restricted to the `@iiitt.ac.in` domain in `lib/auth.ts`. Partner accounts use the partner role saved in user metadata.
- Core service configuration lives in `lib/remoteConfig.ts`, with safe in-app defaults for fees, delivery areas, banners, and promo codes.
- Do not commit private API keys, service-role keys, or production `.env` files. An anonymous Supabase key is intended for client use, but its database permissions must still be protected with RLS.

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm start` | Start Expo developer tools |
| `npm run android` | Open the Expo app on Android |
| `npm run ios` | Open the Expo app on iOS |
| `npm run web` | Run the Expo web target |
| `npm --prefix backend run dev` | Start the local Express API |
| `npm --prefix web-version run dev` | Start the Vite web prototype |

## Contributing

Contributions are welcome. Please keep customer and partner flows usable on small mobile screens, preserve the Supabase role boundaries, and test the relevant Expo target before opening a pull request.

## License

No license has been specified for this repository yet.
