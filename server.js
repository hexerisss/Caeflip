import express from 'express';
import cors from 'cors';
import Redis from 'ioredis';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Redis connection
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Middleware
app.use(cors());
app.use(express.json());

// Google OAuth secret (you'll need to set this in your .env)
const JWT_SECRET = process.env.JWT_SECRET || 'caeflip-secret-key-change-in-production';

// Roblox items data
const ITEMS = [
  { name: 'The Classic ROBLOX Fedora', value: 5100, demand: 'High', rarity: 'legendary' },
  { name: 'Tattletale', value: 4500, demand: 'Low', rarity: 'legendary' },
  { name: 'Valkyrie Helm', value: 3100, demand: 'Mid', rarity: 'epic' },
  { name: 'Gold Clockwork Headphones', value: 2500, demand: 'Mid', rarity: 'epic' },
  { name: 'Soviet Ushanka', value: 2180, demand: 'Mid', rarity: 'epic' },
  { name: 'Playful Vampire', value: 1600, demand: 'Low', rarity: 'rare' },
  { name: 'Supa Dupa Fly Cap', value: 870, demand: 'Low', rarity: 'uncommon' },
  { name: 'Evil Skeptic', value: 670, demand: 'Mid', rarity: 'uncommon' },
  { name: 'Bucket', value: 450, demand: 'Low', rarity: 'common' },
  { name: 'Kulle E Koala', value: 440, demand: 'Low', rarity: 'common' },
  { name: 'Black Iron Antlers', value: 440, demand: 'Mid', rarity: 'common' },
  { name: 'Bam', value: 420, demand: 'Low', rarity: 'common' },
  { name: 'Neon Green Beautiful Hair', value: 390, demand: 'Low', rarity: 'common' },
  { name: 'Katana Of Destiny', value: 360, demand: 'Low', rarity: 'common' },
  { name: 'Blue Wistful Wink', value: 330, demand: 'Low', rarity: 'common' },
  { name: 'Chill Cap', value: 330, demand: 'Low', rarity: 'common' },
  { name: 'Red Goof', value: 300, demand: 'Low', rarity: 'common' },
  { name: 'Sapphire Evil Eye', value: 250, demand: 'Low', rarity: 'common' },
  { name: 'LOLWHY', value: 200, demand: 'Horrendous', rarity: 'common' },
  { name: 'LOL Santa', value: 111, demand: 'Horrendous', rarity: 'common' }
];

// Cases with different item pools and prices
const CASES = [
  {
    id: 'starter',
    name: 'Starter Crate',
    price: 100,
    items: ITEMS,
    description: 'All items available'
  },
  {
    id: 'pro',
    name: 'Pro Case',
    price: 500,
    items: ITEMS.filter(item => item.value >= 300),
    description: 'Items worth $300+'
  },
  {
    id: 'legendary',
    name: 'Legendary Pack',
    price: 1500,
    items: ITEMS.filter(item => item.value >= 1000),
    description: 'Items worth $1000+'
  },
  {
    id: 'godly',
    name: 'Godly Box',
    price: 3000,
    items: ITEMS.filter(item => item.value >= 2500),
    description: 'Items worth $2500+'
  }
];

// Helper function to get weighted random item (70% house edge)
function getWeightedRandomItem(items) {
  // 70% chance for lower value items, 30% for higher value
  const houseEdge = Math.random() < 0.7;
  
  if (houseEdge) {
    // Weight towards lower value items
    const weightedItems = items.map(item => ({
      ...item,
      weight: 1 / (item.value + 1)
    }));
    const totalWeight = weightedItems.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const item of weightedItems) {
      random -= item.weight;
      if (random <= 0) return item;
    }
    return weightedItems[weightedItems.length - 1];
  } else {
    // 30% chance for better items - weight towards higher value
    const weightedItems = items.map(item => ({
      ...item,
      weight: item.value / 10000
    }));
    const totalWeight = weightedItems.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const item of weightedItems) {
      random -= item.weight;
      if (random <= 0) return item;
    }
    return weightedItems[weightedItems.length - 1];
  }
}

// Google OAuth callback endpoint
app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential } = req.body;
    
    // Verify Google token
    const ticket = await google.auth.oauth2.verifyIdToken({
      idToken: credential,
      audience: '365561042683-ipbq59a5ip4k37fhie29is9625rmmipp.apps.googleusercontent.com'
    });
    
    const payload = ticket.getPayload();
    const userId = payload['sub'];
    const email = payload['email'];
    const name = payload['name'];
    const picture = payload['picture'];
    
    // Check if user exists in Redis
    let userData = await redis.get(`user:${userId}`);
    
    if (!userData) {
      // Create new user
      userData = {
        id: userId,
        email,
        name,
        picture,
        balance: 0,
        robloxCookie: '',
        inventory: [],
        promoCodesUsed: [],
        createdAt: new Date().toISOString()
      };
      await redis.set(`user:${userId}`, JSON.stringify(userData));
      await redis.sadd('users', userId);
    } else {
      userData = JSON.parse(userData);
    }
    
    // Generate JWT token
    const token = jwt.sign({ userId, email, name }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        picture: userData.picture,
        balance: userData.balance,
        robloxCookie: userData.robloxCookie
      },
      token
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ success: false, error: 'Authentication failed' });
  }
});

// Get user data
app.get('/api/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userData = await redis.get(`user:${userId}`);
    
    if (!userData) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({ success: true, user: JSON.parse(userData) });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
});

// Update Roblox cookie
app.post('/api/user/:userId/cookie', async (req, res) => {
  try {
    const { userId } = req.params;
    const { cookie } = req.body;
    
    const userData = await redis.get(`user:${userId}`);
    if (!userData) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    const user = JSON.parse(userData);
    user.robloxCookie = cookie;
    await redis.set(`user:${userId}`, JSON.stringify(user));
    
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update cookie' });
  }
});

// Open crate
app.post('/api/crate/open', async (req, res) => {
  try {
    const { userId, caseId } = req.body;
    
    const userData = await redis.get(`user:${userId}`);
    if (!userData) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    const user = JSON.parse(userData);
    const selectedCase = CASES.find(c => c.id === caseId);
    
    if (!selectedCase) {
      return res.status(400).json({ success: false, error: 'Invalid case' });
    }
    
    if (user.balance < selectedCase.price) {
      return res.status(400).json({ success: false, error: 'Insufficient balance' });
    }
    
    // Deduct price
    user.balance -= selectedCase.price;
    
    // Get random item
    const item = getWeightedRandomItem(selectedCase.items);
    
    // Add to inventory
    user.inventory.push({
      ...item,
      wonAt: new Date().toISOString(),
      id: Date.now().toString()
    });
    
    await redis.set(`user:${userId}`, JSON.stringify(user));
    
    res.json({
      success: true,
      item,
      newBalance: user.balance,
      inventory: user.inventory
    });
  } catch (error) {
    console.error('Crate open error:', error);
    res.status(500).json({ success: false, error: 'Failed to open crate' });
  }
});

// Redeem promo code
app.post('/api/promo/redeem', async (req, res) => {
  try {
    const { userId, code } = req.body;
    
    const userData = await redis.get(`user:${userId}`);
    if (!userData) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    const user = JSON.parse(userData);
    
    // Check if user already used this code
    if (user.promoCodesUsed.includes(code)) {
      return res.status(400).json({ success: false, error: 'Code already used' });
    }
    
    // Get promo code data
    const promoData = await redis.get(`promo:${code}`);
    if (!promoData) {
      return res.status(400).json({ success: false, error: 'Invalid promo code' });
    }
    
    const promo = JSON.parse(promoData);
    
    // Check if code has uses left
    if (promo.usesLeft <= 0) {
      return res.status(400).json({ success: false, error: 'Promo code expired' });
    }
    
    // Redeem code
    user.balance += promo.amount;
    user.promoCodesUsed.push(code);
    promo.usesLeft -= 1;
    
    await redis.set(`user:${userId}`, JSON.stringify(user));
    await redis.set(`promo:${code}`, JSON.stringify(promo));
    
    res.json({
      success: true,
      balance: user.balance,
      amount: promo.amount
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to redeem code' });
  }
});

// Create promo code (admin only)
app.post('/api/promo/create', async (req, res) => {
  try {
    const { code, amount, uses } = req.body;
    
    if (!code || !amount || !uses) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    const promo = {
      code,
      amount: parseInt(amount),
      totalUses: parseInt(uses),
      usesLeft: parseInt(uses),
      createdAt: new Date().toISOString()
    };
    
    await redis.set(`promo:${code}`, JSON.stringify(promo));
    
    res.json({ success: true, promo });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create promo code' });
  }
});

// Get all promo codes (admin only)
app.get('/api/promo/all', async (req, res) => {
  try {
    const keys = await redis.keys('promo:*');
    const promos = [];
    
    for (const key of keys) {
      const data = await redis.get(key);
      promos.push(JSON.parse(data));
    }
    
    res.json({ success: true, promos });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch promos' });
  }
});

// Delete promo code (admin only)
app.delete('/api/promo/:code', async (req, res) => {
  try {
    const { code } = req.params;
    await redis.del(`promo:${code}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete promo code' });
  }
});

// Get Robux exchange rates
app.get('/api/robux/rates', async (req, res) => {
  try {
    // Fetch from pastebin
    const response = await axios.get('https://pastebin.com/raw/Lfg5wnAE');
    const rates = JSON.parse(response.data);
    res.json({ success: true, rates });
  } catch (error) {
    // Default rates if pastebin fails
    const defaultRates = [
      { robux: 100, value: 10 },
      { robux: 400, value: 40 },
      { robux: 800, value: 80 },
      { robux: 1700, value: 170 },
      { robux: 4500, value: 450 },
      { robux: 10000, value: 1000 }
    ];
    res.json({ success: true, rates: defaultRates });
  }
});

// Submit withdrawal request
app.post('/api/withdraw', async (req, res) => {
  try {
    const { userId, robuxAmount, username } = req.body;
    
    const userData = await redis.get(`user:${userId}`);
    if (!userData) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    const user = JSON.parse(userData);
    
    // Calculate value based on rates
    const rates = await redis.get('robuxRates');
    let rate = 0.1; // default 10 robux = 1 value
    
    if (rates) {
      const rateList = JSON.parse(rates);
      const matchingRate = rateList.find(r => r.robux === robuxAmount);
      if (matchingRate) {
        rate = matchingRate.value / robuxAmount;
      }
    }
    
    const withdrawValue = robuxAmount * rate;
    
    if (user.balance < withdrawValue) {
      return res.status(400).json({ success: false, error: 'Insufficient balance' });
    }
    
    // Deduct balance
    user.balance -= withdrawValue;
    
    // Create withdrawal request
    const withdrawal = {
      id: Date.now().toString(),
      userId: user.id,
      username,
      robuxAmount,
      value: withdrawValue,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    await redis.set(`user:${userId}`, JSON.stringify(user));
    await redis.lpush('withdrawals', JSON.stringify(withdrawal));
    
    res.json({ success: true, withdrawal });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to submit withdrawal' });
  }
});

// Get all withdrawals (admin only)
app.get('/api/withdrawals', async (req, res) => {
  try {
    const withdrawals = await redis.lrange('withdrawals', 0, -1);
    const withdrawalList = withdrawals.map(w => JSON.parse(w));
    res.json({ success: true, withdrawals: withdrawalList });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch withdrawals' });
  }
});

// Approve/reject withdrawal (admin only)
app.post('/api/withdraw/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approve' or 'reject'
    
    const withdrawals = await redis.lrange('withdrawals', 0, -1);
    let withdrawalIndex = -1;
    let withdrawal = null;
    
    for (let i = 0; i < withdrawals.length; i++) {
      const w = JSON.parse(withdrawals[i]);
      if (w.id === id) {
        withdrawalIndex = i;
        withdrawal = w;
        break;
      }
    }
    
    if (!withdrawal) {
      return res.status(404).json({ success: false, error: 'Withdrawal not found' });
    }
    
    if (action === 'approve') {
      withdrawal.status = 'approved';
    } else if (action === 'reject') {
      withdrawal.status = 'rejected';
      // Refund balance
      const userData = await redis.get(`user:${withdrawal.userId}`);
      if (userData) {
        const user = JSON.parse(userData);
        user.balance += withdrawal.value;
        await redis.set(`user:${withdrawal.userId}`, JSON.stringify(user));
      }
    }
    
    withdrawals[withdrawalIndex] = JSON.stringify(withdrawal);
    await redis.del('withdrawals');
    await redis.lpush('withdrawals', ...withdrawals);
    
    res.json({ success: true, withdrawal });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update withdrawal' });
  }
});

// Admin: Get all users
app.get('/api/admin/users', async (req, res) => {
  try {
    const userIds = await redis.smembers('users');
    const users = [];
    
    for (const userId of userIds) {
      const userData = await redis.get(`user:${userId}`);
      if (userData) {
        users.push(JSON.parse(userData));
      }
    }
    
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

// Admin: Add balance to user
app.post('/api/admin/user/:userId/balance', async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount } = req.body;
    
    const userData = await redis.get(`user:${userId}`);
    if (!userData) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    const user = JSON.parse(userData);
    user.balance += parseInt(amount);
    
    await redis.set(`user:${userId}`, JSON.stringify(user));
    
    res.json({ success: true, balance: user.balance });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update balance' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
