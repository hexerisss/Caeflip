# Caeflip - Caelus Gambling Platform

A modern Roblox gambling platform built with React, Vite, and Tailwind CSS.

## Features

- **Google OAuth Login** - Secure authentication using Google
- **.ROBLOSECURITY Integration** - Link your Roblox account for full functionality
- **Multiple Game Modes**
  - Crate Opening (4 different cases with weighted odds)
  - Mines (Coming Soon)
  - Towers (Coming Soon)
- **Robux Withdrawal System** - Manual withdrawal requests
- **Inventory Management** - Track all your won items
- **Promo Code System** - Redeem codes for free Robux
- **Admin Panel** - Full user and economy management
- **70% House Edge** - Weighted odds favor the house

## Running the Project

### 1. Start the Backend Server

```bash
node server.js
```

The server will run on `http://localhost:3001`

### 2. Start the Frontend Development Server

In a separate terminal:

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

### 3. Build for Production

```bash
npm run build
```

The built files will be in the `dist` folder.

## Admin Access

- Click the key icon in the navigation bar
- Enter password: `kerimpro`
- Access features:
  - User management (add balance to any user)
  - Promo code creation/deletion
  - Withdrawal request approval

## Database

The application uses Redis for persistent storage. The Redis URL is configured in the `server.js` file.

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Framer Motion
- **Backend**: Express.js
- **Database**: Redis
- **Authentication**: Google OAuth 2.0
- **Icons**: Lucide React
- **Animations**: Framer Motion, Canvas Confetti

## Important Notes

- All withdrawals and deposits are done manually
- Join the Discord for faster processing: https://discord.gg/AHZzD9WJEb
- The .ROBLOSECURITY token is stored securely and can be changed anytime in the user profile
