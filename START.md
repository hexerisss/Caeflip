# 🚀 How to Start Caeflip

## Quick Start

You need to run **TWO servers** simultaneously:

### Terminal 1 - Backend API Server
```bash
node server.js
```
This runs the Express API server on `http://localhost:3001`

### Terminal 2 - Frontend Development Server  
```bash
npm run dev
```
This runs the React app on `http://localhost:5173`

## Step-by-Step Instructions

1. **Open your first terminal:**
   ```bash
   cd /path/to/caeflip
   node server.js
   ```
   You should see:
   ```
   ✅ Connected to Redis
   🚀 Caeflip API running on http://localhost:3001
   ```

2. **Open a second terminal:**
   ```bash
   cd /path/to/caeflip
   npm run dev
   ```
   You should see:
   ```
   VITE v7.x.x  ready in xxx ms
   
   ➜  Local:   http://localhost:5173/
   ```

3. **Open your browser** and go to:
   ```
   http://localhost:5173
   ```

## First Time Setup

If this is your first time running the project:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Follow the Quick Start steps above

## Using the Platform

1. **Login** with Google (click the Google sign-in button)
2. **Link .ROBLOSECURITY** when prompted (optional, but can add later)
3. **Redeem a promo code** or use admin to add balance
4. **Start playing!**

## Admin Access

1. Click the **Settings gear icon** in the navbar
2. Enter password: `kerimpro`
3. Click on the **Admin** tab to:
   - View all users
   - Add R$ 1000 to any user's balance
   - Create promo codes
   - Manage withdrawals

## Creating Your First Promo Code

1. Login as admin (password: `kerimpro`)
2. Go to **Admin** tab
3. Fill in:
   - **Code**: WELCOME (or any code you want)
   - **Amount**: 1000 (Robux amount)
   - **Max Uses**: 100 (how many times it can be used)
4. Click **Create Promo Code**
5. Users can now redeem it in the **Promo** tab!

## Troubleshooting

### "Failed to connect to Redis"
- Check your Redis URL is correct in `server.js`
- Make sure your Redis instance is running

### "Cannot connect to backend"
- Make sure `server.js` is running in Terminal 1
- Check that it's running on port 3001

### "Google login not working"
- Make sure your Google OAuth Client ID is configured
- Check browser console for errors

## Production Deployment

For production, you'll need to:

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Serve the `dist/` folder with a web server

3. Deploy the `server.js` backend to a Node.js hosting service

4. Update the `API_URL` in `src/App.tsx` to your production backend URL

5. Set up proper environment variables for Redis URL and JWT secret

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Express.js + Node.js
- **Database**: Redis (cloud-hosted)
- **Auth**: Google OAuth 2.0 + JWT

## Support

Join Discord: https://discord.gg/AHZzD9WJEb

---

Happy gambling! 🎰
