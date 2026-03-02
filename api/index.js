import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { createClient } from 'redis';
import axios from 'axios';

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

// Routes
app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body;
  try {
    // In a real app, verify credential with Google. For now, we decode or trust.
    const decoded = jwt.decode(credential);
    const redis = await getRedis();
    
    let user = await redis.get(`user:${decoded.sub}`);
    if (!user) {
      user = {
        id: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
        balance: 0,
        inventory: [],
        roblosecurity: '',
        createdAt: new Date().toISOString()
      };
      await redis.set(`user:${decoded.sub}`, JSON.stringify(user));
      await redis.sAdd('users', decoded.sub);
    } else {
      user = JSON.parse(user);
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/profile', authenticate, async (req, res) => {
  const redis = await getRedis();
  const user = await redis.get(`user:${req.user.id}`);
  res.json(JSON.parse(user));
});

app.post('/api/profile/roblosecurity', authenticate, async (req, res) => {
  const { token } = req.body;
  const redis = await getRedis();
  const userData = JSON.parse(await redis.get(`user:${req.user.id}`));
  userData.roblosecurity = token;
  await redis.set(`user:${req.user.id}`, JSON.stringify(userData));
  res.json({ success: true });
});

app.post('/api/promo/redeem', authenticate, async (req, res) => {
  const { code } = req.body;
  const redis = await getRedis();
  const promo = await redis.get(`promo:${code}`);
  if (!promo) return res.status(404).json({ error: 'Invalid code' });
  
  const promoData = JSON.parse(promo);
  if (promoData.uses <= 0) return res.status(400).json({ error: 'Code expired' });
  
  const hasUsed = await redis.sIsMember(`user:${req.user.id}:promos`, code);
  if (hasUsed) return res.status(400).json({ error: 'Already redeemed' });

  const userData = JSON.parse(await redis.get(`user:${req.user.id}`));
  userData.balance += promoData.amount;
  promoData.uses -= 1;

  await redis.set(`user:${req.user.id}`, JSON.stringify(userData));
  await redis.set(`promo:${code}`, JSON.stringify(promoData));
  await redis.sAdd(`user:${req.user.id}:promos`, code);

  res.json({ success: true, amount: promoData.amount, newBalance: userData.balance });
});

// Admin Routes
app.get('/api/admin/users', adminAuth, async (req, res) => {
  const redis = await getRedis();
  const userIds = await redis.sMembers('users');
  const users = await Promise.all(userIds.map(id => redis.get(`user:${id}`).then(JSON.parse)));
  res.json(users);
});

app.post('/api/admin/add-balance', adminAuth, async (req, res) => {
  const { userId, amount } = req.body;
  const redis = await getRedis();
  const userData = JSON.parse(await redis.get(`user:${userId}`));
  userData.balance += amount;
  await redis.set(`user:${userId}`, JSON.stringify(userData));
  res.json({ success: true });
});

app.get('/api/admin/withdrawals', adminAuth, async (req, res) => {
  const redis = await getRedis();
  const withdrawals = await redis.lRange('withdrawals', 0, -1).then(list => list.map(JSON.parse));
  res.json(withdrawals);
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

export default app;