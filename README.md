# ♻️ EcoLoop

EcoLoop is a full-stack scrap pickup management platform that connects households and businesses with verified waste collectors. Users schedule pickups, earn EcoCoins as rewards, and track their environmental impact. Collectors manage their assigned pickups via a dedicated dashboard.

---

## 🚀 Features

- **User side:** Schedule scrap pickups, track status, earn EcoCoins, view wallet & transaction history
- **Collector side:** Browse pending pickup requests, accept jobs, verify via OTP, mark pickups as complete
- **Rewards system:** Users earn EcoCoins based on scrap weight × price per kg at time of completion
- **Wallet:** PostgreSQL-backed wallet tracks all EcoCoin transactions with idempotency
- **OTP verification:** Collectors verify phone numbers via SMS (Twilio) before account activation
- **Eco Impact tracking:** Dashboard shows total kg recycled and estimated CO₂ saved

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6 |
| Backend | Node.js, Express 5, ES Modules |
| Primary DB | MongoDB (users, pickups, scrap prices) |
| Wallet DB | PostgreSQL / Supabase (wallet, transactions) |
| Auth | JWT (httpOnly cookies + Authorization header) |
| OTP / SMS | Twilio |
| Security | Helmet, express-rate-limit, bcryptjs |

---

## 📁 Project Structure
```
EcoLoop/
├── frontend/          # React + Vite app
│   └── src/
│       ├── pages/     # User, Collector, Auth pages
│       ├── components/# Reusable UI components
│       ├── services/  # API call functions
│       ├── context/   # AuthContext
│       └── router.jsx # All route definitions
│
└── Server/            # Express backend
    └── src/
        ├── controllers/  # Request handlers
        ├── services/     # Business logic
        ├── models/       # Mongoose schemas
        ├── routes/       # Express routers
        ├── middlewares/  # Auth, role guards
        ├── config/       # DB connections, env
        └── migrations/   # PostgreSQL SQL migrations
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- PostgreSQL database (Supabase recommended)
- Twilio account (for SMS OTP)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/ecoloop.git
cd ecoloop
```

### 2. Backend Setup
```bash
cd Server
npm install  # Fill in your values (see Environment Variables below)
npm run dev            # Start backend on port 3000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev            # Start frontend on port 5173
```

---

## 🔐 Environment Variables
ALLOWED_ORIGIN=
NODE_ENV=

PORT=
MONGO_URI=
DB_NAME=

JWT_SECRET=
POSTGRES_URL=

VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
FAST2SMS_API_KEY=


SMS_PROVIDER=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=


## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user or collector |
| POST | `/api/auth/login` | Login and receive JWT |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/verify-otp/:userId` | Verify collector OTP |

### Pickups
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/pickups` | User | Create pickup request |
| GET | `/api/pickups/my` | User | Get my pickups |
| PATCH | `/api/pickups/cancel/:id` | User | Cancel pending pickup |
| GET | `/api/pickups/pending` | Collector | View available pickups |
| PUT | `/api/pickups/accept/:id` | Collector | Accept a pickup |
| PATCH | `/api/pickups/complete/:id` | Collector | Mark pickup complete |
| GET | `/api/pickups/assigned` | Collector | My assigned pickups |
| GET | `/api/pickups/completed` | Collector | My completed pickups |

### Wallet
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/wallet` | Get balance and transactions |

### Scrap Prices
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/scrap-prices` | Get current scrap prices |
| POST | `/api/admin/scrap-prices` | Set scrap price (admin) |

---

## 💰 How EcoCoins Work

1. User schedules a pickup and selects scrap type + approximate load
2. Collector accepts and completes the pickup
3. System calculates: `EcoCoins = weight (kg) × price per kg`
4. EcoCoins are credited to the user's wallet
5. Collector earns 10 EcoPoints per completed pickup

**Weight by load size:**
| Load | Weight |
|------|--------|
| Small | 2 kg |
| Medium | 5 kg |
| Large | 10 kg |
| Bulk | 20 kg |

---

## 🌱 Environmental Impact

EcoLoop estimates CO₂ saved as `total kg recycled × 0.5 kg CO₂`. Every completed pickup contributes to a cleaner environment.

---

## 📄 License

MIT
