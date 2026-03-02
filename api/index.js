import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { createClient } from 'redis';

const app = express();
app.use(cors());
app.use(express.json());

const REDIS_URL = process.env.REDIS_URL || 'redis://default:R9iQ6XdQm8kmzTLaANgzQXVAELk9v7nc@redis-16823.c82.us-east-1-2.ec2.cloud.redislabs.com:16823';
const JWT_SECRET = process.env.JWT_SECRET || 'caeflip-secret-key-123';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'kerimpro';

let redisClient;

async function getRedis() {
  if (!redisClient) {
    redisClient = createClient({ url: REDIS_URL });
    redisClient.on('error', (err) => console.log('Redis Client Error', err));
    await redisClient.connect();
  }
  return redisClient;
}

// Auth Middleware
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Admin Middleware
const adminAuth = (req, res, next) => {
  const adminToken = req.headers['x-admin-token'];
  if (adminToken === ADMIN_PASSWORD) {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden' });
  }
};

// --- AUTH ROUTES ---

app.post('/api/auth/google', async (req, res) => {
  const { googleId, email, name, picture } = req.body;
  try {
    const redis = await getRedis();
    
    let userStr = await redis.get(`user:${googleId}`);
    let user;
    
    if (!userStr) {
      user = {
        googleId,
        email,
        name,
        picture,
        balance: 0,
        inventory: [],
        roblosecurity: '',
        createdAt: new Date().toISOString()
      };
      await redis.set(`user:${googleId}`, JSON.stringify(user));
      await redis.sAdd('users', googleId);
    } else {
      user = JSON.parse(userStr);
      // Update profile info if changed
      user.name = name;
      user.picture = picture;
      await redis.set(`user:${googleId}`, JSON.stringify(user));
    }

    const token = jwt.sign({ googleId: user.googleId, email: user.email }, JWT_SECRET);
    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/roblosecurity', authenticate, async (req, res) => {
  const { roblosecurity } = req.body;
  try {
    const redis = await getRedis();
    const userStr = await redis.get(`user:${req.user.googleId}`);
    if (!userStr) return res.status(404).json({ error: 'User not found' });
    
    const user = JSON.parse(userStr);
    user.roblosecurity = roblosecurity;
    await redis.set(`user:${req.user.googleId}`, JSON.stringify(user));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/user/profile', authenticate, async (req, res) => {
  try {
    const redis = await getRedis();
    const userStr = await redis.get(`user:${req.user.googleId}`);
    if (!userStr) return res.status(404).json({ error: 'User not found' });
    res.json(JSON.parse(userStr));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- GAME ROUTES ---

app.post('/api/crates/open', authenticate, async (req, res) => {
  const { crateType, cost, wonItem } = req.body;
  try {
    const redis = await getRedis();
    const userStr = await redis.get(`user:${req.user.googleId}`);
    if (!userStr) return res.status(404).json({ error: 'User not found' });
    
    const user = JSON.parse(userStr);
    if (user.balance < cost) return res.status(400).json({ error: 'Insufficient balance' });
    
    user.balance -= cost;
    user.inventory.push({ ...wonItem, wonAt: new Date().toISOString() });
    // Add item value to balance? No, usually inventory items are separate or sold.
    // Based on frontend logic: "Win items and their value is added to your balance" was old prompt, 
    // but usually in gambling sites you get the ITEM in inventory.
    // The frontend code: `setUser(response.data.user)` updates local state.
    // The previous frontend implementation didn't auto-sell. 
    // Wait, the prompt said "add an inventory system". So keeping in inventory is correct.
    
    await redis.set(`user:${req.user.googleId}`, JSON.stringify(user));
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/towers/play', authenticate, async (req, res) => {
  const { bet, won, multiplier } = req.body;
  try {
    const redis = await getRedis();
    const userStr = await redis.get(`user:${req.user.googleId}`);
    if (!userStr) return res.status(404).json({ error: 'User not found' });
    
    const user = JSON.parse(userStr);
    
    // Frontend handles the game logic, backend just updates balance
    // In a real app, backend should validate the game steps!
    // For now, we trust the frontend's result but verify balance.
    
    // If user lost, they lost the bet.
    // If user won, they win bet * multiplier - bet (profit) OR just set balance?
    // Frontend says: `setUser({ ...user, balance: user.balance + towersBet * multiplier - towersBet });` for win
    // `setUser({ ...user, balance: user.balance - towersBet });` for loss
    
    // But wait, the frontend sends the request AFTER the game ends?
    // "clickTowerTile" -> if won, axios.post
    // "clickTowerTile" -> if lost, axios.post
    
    // Actually, it's safer to deduct bet at START. But frontend implementation sends result at END.
    // We will process the net change.
    
    if (won) {
      const winnings = (bet * multiplier) - bet;
      user.balance += winnings;
    } else {
      user.balance -= bet;
    }
    
    // Prevent negative balance
    if (user.balance < 0) user.balance = 0;
    
    await redis.set(`user:${req.user.googleId}`, JSON.stringify(user));
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/mines/play', authenticate, async (req, res) => {
  const { bet, won, multiplier } = req.body;
  try {
    const redis = await getRedis();
    const userStr = await redis.get(`user:${req.user.googleId}`);
    if (!userStr) return res.status(404).json({ error: 'User not found' });
    
    const user = JSON.parse(userStr);
    
    if (won) {
      // Logic: Bet was already deducted locally? No.
      // Frontend: `setUser({ ...user, balance: user.balance - minesBet });` at START.
      // Then `cashoutMines`: `setUser({ ...user, balance: user.balance + winAmount });`
      
      // Since frontend sends request only on cashout or loss:
      // If won: User gets (bet * multiplier). Net change: + (bet * multiplier) - bet.
      // If lost: User loses bet. Net change: -bet.
      
      // WAIT! The frontend `startMinesGame` does NOT call API. It only updates local state.
      // API is called only on `cashout` (won=true) or `hitMine` (won=false).
      // So we need to apply the transaction.
      
      if (won) {
        // User bet 100, won 200. Profit 100.
        // Balance should be: old - 100 + 200 = old + 100.
        // So we apply: balance = balance - bet + (bet * multiplier)
        user.balance = user.balance - bet + (bet * multiplier);
      } else {
        user.balance -= bet;
      }
    } else {
      user.balance -= bet;
    }
    
    if (user.balance < 0) user.balance = 0;
    
    await redis.set(`user:${req.user.googleId}`, JSON.stringify(user));
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- PROMO ROUTES ---

app.post('/api/promo/redeem', authenticate, async (req, res) => {
  const { code } = req.body;
  try {
    const redis = await getRedis();
    const promoStr = await redis.get(`promo:${code}`);
    if (!promoStr) return res.status(404).json({ error: 'Invalid code' });
    
    const promo = JSON.parse(promoStr);
    if (promo.uses >= promo.maxUses) return res.status(400).json({ error: 'Code expired' });
    
    const hasUsed = await redis.sIsMember(`user:${req.user.googleId}:promos`, code);
    if (hasUsed) return res.status(400).json({ error: 'Already redeemed' });

    const userStr = await redis.get(`user:${req.user.googleId}`);
    const user = JSON.parse(userStr);
    
    user.balance += parseFloat(promo.amount);
    promo.uses += 1;

    await redis.set(`user:${req.user.googleId}`, JSON.stringify(user));
    await redis.set(`promo:${code}`, JSON.stringify(promo));
    await redis.sAdd(`user:${req.user.googleId}:promos`, code);

    res.json({ success: true, amount: promo.amount, balance: user.balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/promo/list', adminAuth, async (req, res) => {
  try {
    const redis = await getRedis();
    const keys = await redis.keys('promo:*');
    const promos = [];
    for (const key of keys) {
      const p = await redis.get(key);
      if (p) promos.push(JSON.parse(p));
    }
    res.json(promos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- WITHDRAW ROUTES ---

app.post('/api/withdraw/request', authenticate, async (req, res) => {
  const { amount, robloxUsername } = req.body;
  try {
    const redis = await getRedis();
    const userStr = await redis.get(`user:${req.user.googleId}`);
    const user = JSON.parse(userStr);
    
    if (user.balance < amount) return res.status(400).json({ error: 'Insufficient balance' });
    
    user.balance -= amount;
    await redis.set(`user:${req.user.googleId}`, JSON.stringify(user));
    
    const withdrawal = {
      id: Math.random().toString(36).substr(2, 9),
      googleId: user.googleId,
      name: user.name,
      robloxUsername,
      amount,
      status: 'pending',
      timestamp: new Date().toISOString()
    };
    
    // Add to specific withdrawal list or just a global list
    // Storing as a list of strings
    await redis.rPush('withdrawals', JSON.stringify(withdrawal));
    
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/withdraw/pending', adminAuth, async (req, res) => {
  try {
    const redis = await getRedis();
    const list = await redis.lRange('withdrawals', 0, -1);
    const withdrawals = list.map(item => JSON.parse(item)).filter(w => w.status === 'pending');
    res.json(withdrawals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ADMIN ROUTES ---

app.post('/api/admin/verify', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ token: ADMIN_PASSWORD });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

app.get('/api/admin/users', adminAuth, async (req, res) => {
  try {
    const redis = await getRedis();
    const userIds = await redis.sMembers('users');
    const users = [];
    for (const id of userIds) {
      const u = await redis.get(`user:${id}`);
      if (u) users.push(JSON.parse(u));
    }
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/add-balance', adminAuth, async (req, res) => {
  const { googleId, amount } = req.body;
  try {
    const redis = await getRedis();
    const userStr = await redis.get(`user:${googleId}`);
    if (!userStr) return res.status(404).json({ error: 'User not found' });
    
    const user = JSON.parse(userStr);
    user.balance += amount;
    await redis.set(`user:${googleId}`, JSON.stringify(user));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/promo/create', adminAuth, async (req, res) => {
  const { code, amount, maxUses } = req.body;
  try {
    const redis = await getRedis();
    const promo = {
      code,
      amount: parseFloat(amount),
      maxUses: parseInt(maxUses),
      uses: 0,
      createdAt: new Date().toISOString()
    };
    await redis.set(`promo:${code}`, JSON.stringify(promo));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/withdrawal/approve', adminAuth, async (req, res) => {
  const { withdrawalId } = req.body;
  try {
    const redis = await getRedis();
    const list = await redis.lRange('withdrawals', 0, -1);
    const withdrawals = list.map(item => JSON.parse(item));
    
    const index = withdrawals.findIndex(w => w.id === withdrawalId);
    if (index === -1) return res.status(404).json({ error: 'Withdrawal not found' });
    
    withdrawals[index].status = 'approved';
    
    // Update the list in Redis (Delete all and re-add or update at index)
    // LSET index value
    await redis.lSet('withdrawals', index, JSON.stringify(withdrawals[index]));
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/withdrawal/reject', adminAuth, async (req, res) => {
  const { withdrawalId } = req.body;
  try {
    const redis = await getRedis();
    const list = await redis.lRange('withdrawals', 0, -1);
    const withdrawals = list.map(item => JSON.parse(item));
    
    const index = withdrawals.findIndex(w => w.id === withdrawalId);
    if (index === -1) return res.status(404).json({ error: 'Withdrawal not found' });
    
    const withdrawal = withdrawals[index];
    withdrawal.status = 'rejected';
    
    // Refund the user
    const userStr = await redis.get(`user:${withdrawal.googleId}`);
    if (userStr) {
      const user = JSON.parse(userStr);
      user.balance += withdrawal.amount;
      await redis.set(`user:${withdrawal.googleId}`, JSON.stringify(user));
    }
    
    await redis.lSet('withdrawals', index, JSON.stringify(withdrawal));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

export default app;
