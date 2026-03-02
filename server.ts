import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Redis from 'ioredis';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { v4 as uuidv4 } from 'uuid';
import { createServer } from 'http';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

// Redis connection
const redis = new Redis(process.env.REDIS_URL);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express.json());
app.use(session({
  secret: 'caelus-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));
app.use(passport.initialize());
app.use(passport.session());

// Passport Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'placeholder',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const userId = profile.id;
      const username = profile.displayName;
      const email = profile.emails?.[0]?.value || '';
      const avatar = profile.photos?.[0]?.value || 'https://www.caelus.lol/img/roblox_logo.svg';

      // Check if user exists
      const existingUser = await redis.get(`user:${userId}`);
      
      if (existingUser) {
        const userData = JSON.parse(existingUser);
        return done(null, { ...userData, userId });
      }

      // Create new user
      const newUser = {
        userId,
        username,
        email,
        avatar,
        balance: 10000, // Starting balance
        createdAt: new Date().toISOString(),
        deposits: [],
        history: [],
      };

      await redis.setEx(`user:${userId}`, 86400, JSON.stringify(newUser));
      return done(null, newUser);
    } catch (error) {
      return done(error as Error);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, (user as any).userId);
});

passport.deserializeUser(async (userId: string, done) => {
  try {
    const userData = await redis.get(`user:${userId}`);
    if (!userData) {
      return done(null, false);
    }
    done(null, JSON.parse(userData));
  } catch (error) {
    done(error as Error);
  }
});

// Auth Routes
app.get('/api/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/api/auth/google/callback',
  passport.authenticate('google', { 
    session: true,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=true`
  }),
  (req, res) => {
    res.redirect(`${process.env.FRONTEND_URL}`);
  }
);

app.get('/api/auth/me', (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true });
  });
});

// Admin Routes
app.post('/api/admin/login', async (req, res) => {
  const { password } = req.body;
  
  if (password === process.env.ADMIN_PASSWORD) {
    const adminSession = {
      isAdmin: true,
      loginTime: new Date().toISOString(),
    };
    await redis.setEx('admin:session', 3600, JSON.stringify(adminSession));
    res.json({ success: true, isAdmin: true });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

app.get('/api/admin/session', async (req, res) => {
  const adminSession = await redis.get('admin:session');
  if (adminSession) {
    res.json({ isAdmin: true });
  } else {
    res.status(401).json({ error: 'Not authorized' });
  }
});

app.get('/api/admin/users', async (req, res) => {
  const adminSession = await redis.get('admin:session');
  if (!adminSession) {
    return res.status(401).json({ error: 'Not authorized' });
  }

  try {
    const keys = await redis.keys('user:*');
    const users = await Promise.all(
      keys.map(async (key) => {
        const userData = await redis.get(key);
        return userData ? JSON.parse(userData) : null;
      })
    );
    res.json(users.filter(Boolean));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/admin/deposits', async (req, res) => {
  const adminSession = await redis.get('admin:session');
  if (!adminSession) {
    return res.status(401).json({ error: 'Not authorized' });
  }

  try {
    const keys = await redis.keys('deposit:*');
    const deposits = await Promise.all(
      keys.map(async (key) => {
        const depositData = await redis.get(key);
        return depositData ? JSON.parse(depositData) : null;
      })
    );
    res.json(deposits.filter(Boolean));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch deposits' });
  }
});

app.post('/api/admin/deposit/:id/approve', async (req, res) => {
  const adminSession = await redis.get('admin:session');
  if (!adminSession) {
    return res.status(401).json({ error: 'Not authorized' });
  }

  const { id } = req.params;
  const depositKey = `deposit:${id}`;
  
  try {
    const depositData = await redis.get(depositKey);
    if (!depositData) {
      return res.status(404).json({ error: 'Deposit not found' });
    }

    const deposit = JSON.parse(depositData);
    
    // Update user balance
    const userData = await redis.get(`user:${deposit.userId}`);
    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = JSON.parse(userData);
    user.balance += deposit.amount;
    await redis.setEx(`user:${deposit.userId}`, 86400, JSON.stringify(user));

    // Update deposit status
    deposit.status = 'approved';
    deposit.approvedAt = new Date().toISOString();
    await redis.setEx(depositKey, 86400, JSON.stringify(deposit));

    res.json({ success: true, message: 'Deposit approved' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve deposit' });
  }
});

app.post('/api/admin/deposit/:id/reject', async (req, res) => {
  const adminSession = await redis.get('admin:session');
  if (!adminSession) {
    return res.status(401).json({ error: 'Not authorized' });
  }

  const { id } = req.params;
  const depositKey = `deposit:${id}`;
  
  try {
    const depositData = await redis.get(depositKey);
    if (!depositData) {
      return res.status(404).json({ error: 'Deposit not found' });
    }

    const deposit = JSON.parse(depositData);
    deposit.status = 'rejected';
    deposit.rejectedAt = new Date().toISOString();
    await redis.setEx(depositKey, 86400, JSON.stringify(deposit));

    res.json({ success: true, message: 'Deposit rejected' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject deposit' });
  }
});

// User Routes
app.post('/api/deposit', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { amount, gamepassId, transactionId } = req.body;
  const userId = (req.user as any).userId;
  const depositId = uuidv4();

  const deposit = {
    id: depositId,
    userId,
    username: (req.user as any).username,
    amount,
    gamepassId,
    transactionId,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  await redis.setEx(`deposit:${depositId}`, 86400, JSON.stringify(deposit));
  
  // Add to user's deposits
  const userData = await redis.get(`user:${userId}`);
  if (userData) {
    const user = JSON.parse(userData);
    user.deposits = [...(user.deposits || []), depositId];
    await redis.setEx(`user:${userId}`, 86400, JSON.stringify(user));
  }

  res.json({ success: true, depositId });
});

app.get('/api/deposits', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const userId = (req.user as any).userId;
  const userData = await redis.get(`user:${userId}`);
  
  if (!userData) {
    return res.status(404).json({ error: 'User not found' });
  }

  const user = JSON.parse(userData);
  const depositIds = user.deposits || [];
  
  const deposits = await Promise.all(
    depositIds.map(async (id: string) => {
      const depositData = await redis.get(`deposit:${id}`);
      return depositData ? JSON.parse(depositData) : null;
    })
  );

  res.json(deposits.filter(Boolean));
});

app.post('/api/spin', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { crateType } = req.body;
  const userId = (req.user as any).userId;

  const crates = {
    classic: { cost: 100, minItemValue: 0 },
    premium: { cost: 250, minItemValue: 200 },
    legendary: { cost: 500, minItemValue: 500 },
    elite: { cost: 1000, minItemValue: 1000 },
  };

  const crate = crates[crateType as keyof typeof crates];
  if (!crate) {
    return res.status(400).json({ error: 'Invalid crate type' });
  }

  const userData = await redis.get(`user:${userId}`);
  if (!userData) {
    return res.status(404).json({ error: 'User not found' });
  }

  const user = JSON.parse(userData);
  
  if (user.balance < crate.cost) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }

  // Deduct cost
  user.balance -= crate.cost;
  
  // Select random item (house-favored odds)
  const allItems = [
    { name: 'The Classic ROBLOX Fedora', value: 5100, rarity: 'legendary', demand: 'High' },
    { name: 'Tattletale', value: 4500, rarity: 'legendary', demand: 'Low' },
    { name: 'Valkyrie Helm', value: 3100, rarity: 'epic', demand: 'Mid' },
    { name: 'Gold Clockwork Headphones', value: 2500, rarity: 'epic', demand: 'Mid' },
    { name: 'Soviet Ushanka', value: 2180, rarity: 'epic', demand: 'Mid' },
    { name: 'Playful Vampire', value: 1600, rarity: 'rare', demand: 'Low' },
    { name: 'Supa Dupa Fly Cap', value: 870, rarity: 'uncommon', demand: 'Low' },
    { name: 'Evil Skeptic', value: 670, rarity: 'uncommon', demand: 'Mid' },
    { name: 'Bucket', value: 450, rarity: 'common', demand: 'Low' },
    { name: 'Kulle E Koala', value: 440, rarity: 'common', demand: 'Low' },
    { name: 'Black Iron Antlers', value: 440, rarity: 'common', demand: 'Mid' },
    { name: 'Bam', value: 420, rarity: 'common', demand: 'Low' },
    { name: 'Neon Green Beautiful Hair', value: 390, rarity: 'common', demand: 'Low' },
    { name: 'Katana Of Destiny', value: 360, rarity: 'common', demand: 'Low' },
    { name: 'Blue Wistful Wink', value: 330, rarity: 'common', demand: 'Low' },
    { name: 'Chill Cap', value: 330, rarity: 'common', demand: 'Low' },
    { name: 'Red Goof', value: 300, rarity: 'common', demand: 'Low' },
    { name: 'Sapphire Evil Eye', value: 250, rarity: 'common', demand: 'Low' },
    { name: 'LOLWHY', value: 200, rarity: 'common', demand: 'Horrendous' },
    { name: 'LOL Santa', value: 111, rarity: 'common', demand: 'Horrendous' },
  ];

  const filteredItems = allItems.filter(item => item.value >= crate.minItemValue);
  
  // House-favored probability
  const rand = Math.random() * 100;
  let selectedRarity: string;
  
  if (rand < 0.3) selectedRarity = 'legendary';
  else if (rand < 4.3) selectedRarity = 'epic';
  else if (rand < 16.3) selectedRarity = 'rare';
  else if (rand < 41.3) selectedRarity = 'uncommon';
  else selectedRarity = 'common';

  const itemsByRarity = filteredItems.filter(item => item.rarity === selectedRarity);
  const selectedItem = itemsByRarity.length > 0 
    ? itemsByRarity[Math.floor(Math.random() * itemsByRarity.length)]
    : filteredItems[Math.floor(Math.random() * filteredItems.length)];

  // Add item value to balance
  user.balance += selectedItem.value;
  
  // Save spin history
  const spin = {
    id: uuidv4(),
    crateType,
    crateCost: crate.cost,
    item: selectedItem,
    profit: selectedItem.value - crate.cost,
    timestamp: new Date().toISOString(),
  };
  
  user.history = [spin, ...(user.history || [])].slice(0, 50); // Keep last 50 spins
  
  // Save user data
  await redis.setEx(`user:${userId}`, 86400, JSON.stringify(user));

  // Generate spin animation data (50 items for roulette)
  const spinItems: typeof selectedItem[] = [];
  for (let i = 0; i < 49; i++) {
    spinItems.push(filteredItems[Math.floor(Math.random() * filteredItems.length)]);
  }
  spinItems.push(selectedItem); // Winner at position 50

  res.json({
    success: true,
    item: selectedItem,
    profit: selectedItem.value - crate.cost,
    balance: user.balance,
    spinItems,
    spin,
  });
});

app.get('/api/items', (req, res) => {
  const items = [
    { name: 'The Classic ROBLOX Fedora', value: 5100, rarity: 'legendary', demand: 'High' },
    { name: 'Tattletale', value: 4500, rarity: 'legendary', demand: 'Low' },
    { name: 'Valkyrie Helm', value: 3100, rarity: 'epic', demand: 'Mid' },
    { name: 'Gold Clockwork Headphones', value: 2500, rarity: 'epic', demand: 'Mid' },
    { name: 'Soviet Ushanka', value: 2180, rarity: 'epic', demand: 'Mid' },
    { name: 'Playful Vampire', value: 1600, rarity: 'rare', demand: 'Low' },
    { name: 'Supa Dupa Fly Cap', value: 870, rarity: 'uncommon', demand: 'Low' },
    { name: 'Evil Skeptic', value: 670, rarity: 'uncommon', demand: 'Mid' },
    { name: 'Bucket', value: 450, rarity: 'common', demand: 'Low' },
    { name: 'Kulle E Koala', value: 440, rarity: 'common', demand: 'Low' },
    { name: 'Black Iron Antlers', value: 440, rarity: 'common', demand: 'Mid' },
    { name: 'Bam', value: 420, rarity: 'common', demand: 'Low' },
    { name: 'Neon Green Beautiful Hair', value: 390, rarity: 'common', demand: 'Low' },
    { name: 'Katana Of Destiny', value: 360, rarity: 'common', demand: 'Low' },
    { name: 'Blue Wistful Wink', value: 330, rarity: 'common', demand: 'Low' },
    { name: 'Chill Cap', value: 330, rarity: 'common', demand: 'Low' },
    { name: 'Red Goof', value: 300, rarity: 'common', demand: 'Low' },
    { name: 'Sapphire Evil Eye', value: 250, rarity: 'common', demand: 'Low' },
    { name: 'LOLWHY', value: 200, rarity: 'common', demand: 'Horrendous' },
    { name: 'LOL Santa', value: 111, rarity: 'common', demand: 'Horrendous' },
  ];
  res.json(items);
});

app.get('/api/history', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const userId = (req.user as any).userId;
  const userData = await redis.get(`user:${userId}`);
  
  if (!userData) {
    return res.status(404).json({ error: 'User not found' });
  }

  const user = JSON.parse(userData);
  res.json(user.history || []);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Caelus.lol server running on port ${PORT}`);
  console.log(`📦 Redis connected`);
  console.log(`🔐 Google OAuth configured`);
});

export default app;
