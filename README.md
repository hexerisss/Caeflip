# 🪐 Caeflip - Caelus Gambling Platform

A full-stack gambling platform for Caelus.lol with Google OAuth, Redis database, and multiple game modes.

## 🚀 Features

- **Google OAuth 2.0 Authentication**
- **Redis Database** for persistent user data
- **Multiple Game Modes:**
  - 📦 Crates (4 different cases with 20 items)
  - 🏗️ Towers (Easy/Medium/Hard difficulty)
  - 💣 Mines (Customizable mine count)
- **Inventory System** for won items
- **Robux Withdrawals** (manual processing)
- **Promo Codes** with usage limits
- **Admin Panel** (password: `kerimpro`)
  - View all users
  - Add balance to users
  - Create/delete promo codes
  - Approve/reject withdrawals
- **70% House Edge** probability system

## 📋 Prerequisites

- Node.js 18+ installed
- Redis database (already configured)

## 🛠️ Setup & Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the backend server (in one terminal):**
   ```bash
   node server.js
   ```
   The API will run on `http://localhost:3001`

3. **Run the frontend (in another terminal):**
   ```bash
   npm run dev
   ```
   The app will run on `http://localhost:5173`

## 🎮 How to Use

1. **Login** with your Google account
2. **Link .ROBLOSECURITY** for Caelus account verification
3. **Start with R$ 0** balance
4. **Redeem promo codes** or have admin add balance
5. **Play games** to win items and Robux
6. **Withdraw** your winnings

## 👑 Admin Access

1. Click the **Settings** icon in the navbar
2. Enter password: `kerimpro`
3. Access the **Admin** tab to:
   - View all registered users
   - Add balance to any user (+R$ 1000 per click)
   - Create promo codes with custom amounts and usage limits
   - Approve or reject withdrawal requests

## 🎁 Game Modes

### Crates
- **Starter Case** - R$ 100
- **Premium Case** - R$ 500 (items ≥ R$ 250)
- **Elite Case** - R$ 1,500 (items ≥ R$ 870)
- **Godly Case** - R$ 3,000 (items ≥ R$ 2,180)

### Towers
Climb 10 levels by choosing safe tiles:
- **Easy:** 3 tiles, 2 safe (2x multiplier)
- **Medium:** 4 tiles, 1 safe (5x multiplier)
- **Hard:** 5 tiles, 1 safe (20x multiplier)

### Mines
Reveal tiles without hitting mines:
- Choose 1-10 mines
- Each safe tile increases multiplier
- Cashout anytime to secure winnings

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/google` - Google OAuth login
- `POST /api/auth/roblosecurity` - Link ROBLOSECURITY

### User
- `GET /api/user/profile` - Get user profile
- `POST /api/user/update-balance` - Update balance

### Games
- `POST /api/crates/open` - Open a crate
- `POST /api/towers/play` - Play towers game
- `POST /api/mines/play` - Play mines game

### Promo Codes
- `POST /api/promo/redeem` - Redeem promo code
- `GET /api/promo/list` - List all promo codes

### Withdrawals
- `POST /api/withdraw/request` - Request withdrawal
- `GET /api/withdraw/pending` - Get pending withdrawals

### Admin
- `POST /api/admin/verify` - Admin login
- `GET /api/admin/users` - Get all users
- `POST /api/admin/add-balance` - Add balance to user
- `POST /api/admin/promo/create` - Create promo code
- `DELETE /api/admin/promo/:code` - Delete promo code
- `POST /api/admin/withdrawal/approve` - Approve withdrawal
- `POST /api/admin/withdrawal/reject` - Reject withdrawal

## 🎨 Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** Express.js, Node.js
- **Database:** Redis
- **Auth:** Google OAuth 2.0
- **Animations:** Framer Motion
- **UI:** Lucide React Icons

## 📞 Support

Join our Discord for support and faster withdrawal processing:
**https://discord.gg/AHZzD9WJEb**

## 🔐 Security

- All user data is stored in Redis with unique Google IDs
- .ROBLOSECURITY tokens are stored securely
- JWT tokens for session management
- Admin panel protected by password

## 📝 License

MIT License - Feel free to use and modify!

---

Made with ❤️ for Caelus.lol
