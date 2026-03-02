# Caelus.lol - Roblox Gambling Site

A full-stack Roblox gambling site with Google OAuth authentication, Redis database, and admin panel.

## Features

### 🔐 Authentication
- **Google OAuth 2.0** - Login with your Google account
- **Admin Panel** - Access with password `kerimpro`
- **Session Management** - Secure session handling with Redis

### 🎲 Gambling Features
- **4 Crate Types**:
  - Classic Crate ($100) - All items
  - Premium Case ($250) - Items ≥$200
  - Legendary Vault ($500) - Items ≥$500
  - Elite Collection ($1000) - Items ≥$1000
- **Animated Roulette** - 50-slot spinning animation
- **House-Favored Odds**:
  - Legendary (≥$4000): 0.3%
  - Epic ($2000-$4000): 4%
  - Rare ($1000-$2000): 12%
  - Uncommon ($500-$1000): 25%
  - Common (<$500): 58.7%

### 💰 Deposit System
- **Game Pass Deposits** - Request deposits via caelus.lol game passes
- **Admin Approval** - Manual deposit approval system
- **Discord Integration** - Faster deposits via Discord

### 👤 User Features
- **Profile Display** - Avatar, username, and balance
- **Spin History** - Track all your spins with profit/loss
- **Item Catalog** - Browse all 20 items with values
- **Starting Balance** - $10,000 for new users

### 🎨 Modern Design
- **Bloxflip-inspired UI** - Clean, modern interface
- **Responsive** - Works on all devices
- **Purple Theme** - Gradient backgrounds and animations
- **Real-time Updates** - Live balance and history updates

## Tech Stack

### Frontend
- React 19
- TypeScript
- Tailwind CSS
- React Router
- Axios

### Backend
- Node.js
- Express
- TypeScript
- Passport.js (Google OAuth)
- Express Session

### Database
- Redis (Cloud Redis Labs)

## Setup

### 1. Environment Variables

The `.env` file is already configured with:
```
REDIS_URL=redis://default:R9iQ6XdQm8kmzTLaANgzQXVAELk9v7nc@redis-16823.c82.us-east-1-2.ec2.cloud.redislabs.com:16823
GOOGLE_CLIENT_ID=365561042683-ipbq59a5ip4k37fhie29is9625rmmipp.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET_HERE
GOOGLE_CALLBACK_URL=http://localhost:5173/api/auth/google/callback
PORT=3001
FRONTEND_URL=http://localhost:5173
ADMIN_PASSWORD=kerimpro
```

**IMPORTANT**: You need to set your `GOOGLE_CLIENT_SECRET` in the `.env` file.

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the Application

**Development (Frontend + Backend):**
```bash
npm run dev:all
```

**Frontend Only:**
```bash
npm run dev
```

**Backend Only:**
```bash
npm run server
```

### 4. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Admin Panel**: http://localhost:5173/admin (login with password: `kerimpro`)

## API Endpoints

### Authentication
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Admin
- `POST /api/admin/login` - Admin login (password: `kerimpro`)
- `GET /api/admin/session` - Check admin session
- `GET /api/admin/users` - Get all users
- `GET /api/admin/deposits` - Get all deposits
- `POST /api/admin/deposit/:id/approve` - Approve deposit
- `POST /api/admin/deposit/:id/reject` - Reject deposit

### User
- `POST /api/deposit` - Request deposit
- `GET /api/deposits` - Get user deposits
- `POST /api/spin` - Spin a crate
- `GET /api/items` - Get all items
- `GET /api/history` - Get spin history

## Admin Panel

Access the admin panel by:
1. Navigate to `/admin-login`
2. Enter password: `kerimpro`
3. Access features at `/admin`:
   - View all registered users
   - See user balances and avatars
   - Approve/reject deposit requests
   - Manage the platform

## Discord

Join our Discord for faster deposits and support:
https://discord.gg/AHZzD9WJEb

## Items

All 20 Old Roblox Revival items are included:
1. The Classic ROBLOX Fedora - $5,100 (Legendary)
2. Tattletale - $4,500 (Legendary)
3. Valkyrie Helm - $3,100 (Epic)
4. Gold Clockwork Headphones - $2,500 (Epic)
5. Soviet Ushanka - $2,180 (Epic)
6. Playful Vampire - $1,600 (Rare)
7. Supa Dupa Fly Cap - $870 (Uncommon)
8. Evil Skeptic - $670 (Uncommon)
9. Bucket - $450 (Common)
10. Kulle E Koala - $440 (Common)
11. Black Iron Antlers - $440 (Common)
12. Bam - $420 (Common)
13. Neon Green Beautiful Hair - $390 (Common)
14. Katana Of Destiny - $360 (Common)
15. Blue Wistful Wink - $330 (Common)
16. Chill Cap - $330 (Common)
17. Red Goof - $300 (Common)
18. Sapphire Evil Eye - $250 (Common)
19. LOLWHY - $200 (Common)
20. LOL Santa - $111 (Common)

## Security Notes

- Redis session storage with 24-hour expiration
- HTTP-only cookies for session security
- CORS configured for frontend domain
- Admin password protection
- Manual deposit approval system

## License

MIT License - Feel free to modify and use!
