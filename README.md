# CampusPulse – Project Documentation

> **The premier digital ecosystem for University of Cape Coast (UCC) students**
> Built with Next.js 15, TypeScript, Tailwind CSS, Supabase & Framer Motion

---

## 🚀 Live Development Server
```
http://localhost:3000
```
Run with: `npm run dev`

---

## 📁 Project Structure

```
campuspulse/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/          # Login page
│   │   │   └── register/       # Multi-step registration
│   │   ├── page.tsx            # Landing page
│   │   ├── home/               # Main dashboard
│   │   ├── edwom/              # Student Marketplace
│   │   │   ├── page.tsx        # Browse products
│   │   │   ├── product/[id]/   # Product detail
│   │   │   ├── sell/           # Create listing
│   │   │   ├── cart/           # Shopping cart
│   │   │   ├── checkout/       # Checkout
│   │   │   └── orders/         # Order history
│   │   ├── y3adwuma/           # Task Platform
│   │   │   ├── page.tsx        # Browse tasks
│   │   │   ├── task/[id]/      # Task detail + apply
│   │   │   └── post-task/      # Create new task
│   │   ├── ezzyride/           # Rides & Delivery
│   │   │   ├── page.tsx        # Book ride/delivery
│   │   │   └── track/[id]/     # Live tracking
│   │   ├── messages/           # Real-time chat
│   │   ├── notifications/      # Notification center
│   │   ├── profile/            # User profile + wallet
│   │   ├── settings/           # App settings
│   │   └── admin/              # Admin dashboard
│   ├── components/
│   │   ├── layout/
│   │   │   └── navigation.tsx  # Sidebar + MobileNav + TopBar
│   │   ├── providers/
│   │   │   └── theme-provider.tsx
│   │   └── ui/
│   │       └── theme-toggle.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts       # Browser Supabase client
│   │   │   └── server.ts       # Server Supabase client
│   │   └── utils.ts            # formatCurrency, slugify, etc.
│   └── types/
│       └── index.ts            # Full TypeScript types
├── supabase/
│   └── schema.sql              # Complete PostgreSQL schema
├── tailwind.config.ts          # Design system + brand colors
├── postcss.config.js
├── next.config.ts
└── .env.local.example          # Environment variables template
```

---

## 🏗️ Modules

### 🛍️ EDWOM – Student Marketplace
- Browse products by category (Electronics, Fashion, Books, Food, etc.)
- Market area sections: Kotokuraba, Abura, Science Market
- Product detail with gallery, seller info, buy/cart/wishlist
- Sell items with photo upload, condition selector, pricing
- Order management

### 💼 Y3 ADWUMA – Task Platform
- Browse and filter tasks by category and urgency
- Post tasks with reward, deadline, location, urgency flag
- Apply to tasks with cover message and proposed price
- Applicant management + escrow payment system

### 🏍️ EZZYRIDE – Campus Rides & Delivery
- Book rides, food pickup, package delivery, document delivery
- Simulated Google Maps view with live rider dots
- Nearby rider cards with ETA and ratings
- MTN MoMo / Telecel / AirtelTigo payment selection
- Live booking → rider found flow

### 💬 Real-Time Chat
- Conversation list with online status, typing indicators
- Message bubbles with read receipts
- Supports student ↔ vendor, student ↔ rider, student ↔ worker

### 🔔 Notifications
- Categorized: Order, Task, Message, Ride, Promo, System
- Read/unread state, mark-all-read

### 🛡️ Admin Dashboard
- Real-time metrics: Users, Revenue, Orders, Tasks, Riders, Rating
- Pending vendor/rider approvals with approve/reject
- Recent users table with status badges
- Transaction monitoring
- Activity bar chart (30 days)
- Moderation queue: flagged products, reported tasks, reviews

---

## 🗄️ Database Schema (Supabase PostgreSQL)

| Table | Description |
|-------|-------------|
| `profiles` | Extended user profiles for all roles |
| `stores` | Vendor store management |
| `categories` | Product categories (seeded with 11) |
| `products` | Marketplace listings with full-text search |
| `orders` + `order_items` | Order management |
| `tasks` | Y3 ADWUMA task listings |
| `task_applications` | Task applicant tracking |
| `rides` | EZZYRIDE booking records |
| `deliveries` | Package/food delivery records |
| `rider_profiles` | Rider verification + location |
| `chat_rooms` + `messages` | Real-time messaging |
| `reviews` | Cross-module ratings (1–5 stars) |
| `wallets` + `transactions` | Payment tracking |
| `notifications` | Push/in-app notifications |
| `admin_logs` | Admin action audit trail |

**Row Level Security (RLS)** enabled on all sensitive tables.

**Triggers:**
- Auto-create profile + wallet on signup
- Auto-update `updated_at` timestamps
- Auto-count task applicants

---

## 🔧 Environment Setup

Copy `.env.local.example` to `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_key
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=your_paystack_key
PAYSTACK_SECRET_KEY=your_paystack_secret
```

---

## 💳 Payments (Paystack Ghana)

Supported methods:
- **MTN Mobile Money**
- **Telecel Cash**
- **AirtelTigo Money**

Integration points:
- Product checkout → `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
- Task escrow → hold funds until completion
- Ride/delivery payment → release on trip end

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Primary | Deep Blue `#1d4ed8` |
| Accent | Electric Blue `#0e93e9` |
| EDWOM | Blue `#1d4ed8` |
| Y3 ADWUMA | Emerald `#059669` |
| EZZYRIDE | Purple `#7c3aed` |
| Font (body) | Inter |
| Font (display) | Outfit |
| Radius | `0.75rem` |
| Glass effect | `backdrop-blur-xl + border-white/10` |

---

## 🚢 Deployment

### Vercel (Frontend)
```bash
npm install -g vercel
vercel --prod
```

### Supabase (Backend)
1. Create project at supabase.com
2. Run `supabase/schema.sql` in SQL editor
3. Enable Realtime on: `messages`, `notifications`, `rides`
4. Configure Auth providers (Email + Phone)

---

## 📋 Pages Summary

| URL | Page | Status |
|-----|------|--------|
| `/` | Landing page | ✅ 200 |
| `/login` | Sign in | ✅ 200 |
| `/register` | Multi-step signup | ✅ 200 |
| `/home` | Dashboard | ✅ 200 |
| `/edwom` | Marketplace | ✅ 200 |
| `/edwom/product/[id]` | Product detail | ✅ 200 |
| `/edwom/sell` | List item | ✅ 200 |
| `/y3adwuma` | Task platform | ✅ 200 |
| `/y3adwuma/task/[id]` | Task detail | ✅ 200 |
| `/y3adwuma/post-task` | Post task | ✅ 200 |
| `/ezzyride` | Ride booking | ✅ 200 |
| `/messages` | Chat | ✅ 200 |
| `/notifications` | Notifications | ✅ 200 |
| `/profile` | User profile | ✅ 200 |
| `/settings` | App settings | ✅ 200 |
| `/admin` | Admin dashboard | ✅ 200 |
