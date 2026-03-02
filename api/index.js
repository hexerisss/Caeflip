import { createClient } from '@redis/client';

const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

await redis.connect();

console.log('Redis connected');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-token'
};

const adminSecret = process.env.ADMIN_PASSWORD || 'kerimpro';

const parseBody = async (req) => {
  if (req.body && typeof req.body === 'object') return req.body;
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(data || '{}'));
      } catch {
        resolve({});
      }
    });
  });
};

const getUserFromToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.split(' ')[1];
    return JSON.parse(Buffer.from(token, 'base64').toString());
  } catch {
    return null;
  }
};

const isAdmin = (req) => {
  const adminToken = req.headers['x-admin-token'];
  if (!adminToken) return false;
  try {
    const decoded = JSON.parse(Buffer.from(adminToken, 'base64').toString());
    return decoded.admin && decoded.password === adminSecret;
  } catch {
    return false;
  }
};

// Runtime managed by Vercel defaults

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ success: true });
  }

  try {
    // Auth routes
    if (req.url.includes('/api/auth/google')) {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      const body = await parseBody(req);
      const { googleId, email, name, picture, referralCode: incomingReferral } = body;
      if (!googleId) {
        return res.status(400).json({ error: 'Missing googleId' });
      }

      // Check if user exists
      const existing = await redis.get(`user:${googleId}`);
      let user;

      if (existing) {
        user = JSON.parse(existing);
      } else {
        // Create new user
        const userId = `CF-${Date.now().toString(36).toUpperCase()}`;
        const referralCode = `CAE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        user = {
          googleId, email, name, picture,
          userId, balance: 0, inventory: [], roblosecurity: '',
          history: [], referralCode, referrals: 0, referralEarnings: 0,
          totalWagered: 0, totalWon: 0, createdAt: new Date().toISOString(),
          usedPromoCodes: []
        };

        await redis.set(`user:${googleId}`, JSON.stringify(user));
        await redis.set(`user:ref:${referralCode}`, JSON.stringify(user));

        // Track referrals
        if (incomingReferral) {
          const referrerKey = `user:ref:${incomingReferral}`;
          const referrer = await redis.get(referrerKey);
          if (referrer) {
            const r = JSON.parse(referrer);
            r.referrals = (r.referrals || 0) + 1;
            r.referralEarnings = (r.referralEarnings || 0) + 25;
            await redis.set(referrerKey, JSON.stringify(r));

            // Add referral bonus to new user
            user.balance += 25;

            // Add referral history
            user.history.push({
              type: 'referral', from: r.name, time: new Date().toISOString(), amount: 25
            });
            await redis.set(`user:${googleId}`, JSON.stringify(user));
          }
        }
      }

      // Generate JWT (simple version)
      const token = Buffer.from(JSON.stringify({ googleId, admin: false })).toString('base64');

      return res.status(200).json({ token, user });
    }
    
    if (req.url.includes('/api/auth/roblosecurity')) {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      const decoded = getUserFromToken(req);
      if (!decoded) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { googleId } = decoded;
      const body = await parseBody(req);
      const { roblosecurity } = body;
      if (!roblosecurity) {
        return res.status(400).json({ error: 'Missing roblosecurity' });
      }

      const userStr = await redis.get(`user:${googleId}`);
      if (!userStr) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = JSON.parse(userStr);
      user.roblosecurity = roblosecurity;
      await redis.set(`user:${googleId}`, JSON.stringify(user));

      return res.status(200).json({ success: true, user });
    }
    
    if (req.url.includes('/api/user/profile')) {
      if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      const decoded = getUserFromToken(req);
      if (!decoded) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { googleId } = decoded;
      const userStr = await redis.get(`user:${googleId}`);
      if (!userStr) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = JSON.parse(userStr);
      return res.status(200).json(user);
    }
    
    // Admin verify
    if (req.url.includes('/api/admin/verify')) {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      const body = await parseBody(req);
      const { password } = body;
      if (password === adminSecret) {
        const adminToken = Buffer.from(JSON.stringify({ admin: true, password })).toString('base64');
        return res.status(200).json({ token: adminToken });
      }
      return res.status(401).json({ error: 'Invalid password' });
    }
    
    // Admin routes
    if (req.url.includes('/api/admin/users') && req.method === 'GET') {
      if (!isAdmin(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const users = [];
      const keys = await redis.keys('user:*');
      for (const key of keys) {
        if (key.startsWith('user:user:') || key.startsWith('user:ref:')) continue;
        const userStr = await redis.get(key);
        if (userStr) {
          users.push(JSON.parse(userStr));
        }
      }
      return res.status(200).json(users);
    }
    
    if (req.url.includes('/api/admin/add-balance') && req.method === 'POST') {
      if (!isAdmin(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const body = await parseBody(req);
      const { googleId, amount } = body;
      const userStr = await redis.get(`user:${googleId}`);
      if (!userStr) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = JSON.parse(userStr);
      user.balance += Number(amount) || 0;
      user.history.push({
        type: 'admin_credit',
        amount: Number(amount) || 0,
        time: new Date().toISOString()
      });
      await redis.set(`user:${googleId}`, JSON.stringify(user));

      return res.status(200).json({ success: true });
    }
    
    if (req.url.includes('/api/admin/promo/create') && req.method === 'POST') {
      if (!isAdmin(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const body = await parseBody(req);
      const { code, amount, maxUses } = body;
      if (!code) {
        return res.status(400).json({ error: 'Missing code' });
      }
      const promoKey = `promo:${code}`;
      const existing = await redis.get(promoKey);

      if (existing) {
        return res.status(400).json({ error: 'Code already exists' });
      }

      await redis.set(
        promoKey,
        JSON.stringify({ code, amount: Number(amount) || 0, maxUses: Number(maxUses) || 1, uses: 0 })
      );
      return res.status(200).json({ success: true });
    }
    
    if (req.url.includes('/api/admin/promo/delete') && req.method === 'POST') {
      if (!isAdmin(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const body = await parseBody(req);
      const { code } = body;
      await redis.del(`promo:${code}`);
      return res.status(200).json({ success: true });
    }
    
    if (req.url.includes('/api/admin/withdrawal/approve') && req.method === 'POST') {
      if (!isAdmin(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const body = await parseBody(req);
      const { withdrawalId } = body;
      const withdrawKey = `withdraw:${withdrawalId}`;
      const withdrawStr = await redis.get(withdrawKey);
      if (!withdrawStr) {
        return res.status(404).json({ error: 'Withdrawal not found' });
      }

      const withdraw = JSON.parse(withdrawStr);
      const userStr = await redis.get(`user:${withdraw.googleId}`);
      if (userStr) {
        const user = JSON.parse(userStr);
        user.history.push({
          type: 'withdraw_approved',
          amount: withdraw.amount,
          time: new Date().toISOString()
        });
        await redis.set(`user:${withdraw.googleId}`, JSON.stringify(user));
      }

      await redis.del(withdrawKey);
      return res.status(200).json({ success: true });
    }
    
    if (req.url.includes('/api/admin/withdrawal/reject') && req.method === 'POST') {
      if (!isAdmin(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const body = await parseBody(req);
      const { withdrawalId } = body;
      await redis.del(`withdraw:${withdrawalId}`);
      return res.status(200).json({ success: true });
    }
    
    if (req.url.includes('/api/admin/promo/list') && req.method === 'GET') {
      if (!isAdmin(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const promos = [];
      const keys = await redis.keys('promo:*');
      for (const key of keys) {
        const promoStr = await redis.get(key);
        if (promoStr) {
          promos.push(JSON.parse(promoStr));
        }
      }
      return res.status(200).json(promos);
    }
    
    if (req.url.includes('/api/withdraw/pending') && req.method === 'GET') {
      if (!isAdmin(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const withdrawals = [];
      const keys = await redis.keys('withdraw:*');
      for (const key of keys) {
        const withdrawStr = await redis.get(key);
        if (withdrawStr) {
          const withdraw = JSON.parse(withdrawStr);
          withdrawals.push({ id: key.replace('withdraw:', ''), ...withdraw });
        }
      }
      return res.status(200).json(withdrawals);
    }
    
    if (req.url.includes('/api/deposit/pending') && req.method === 'GET') {
      if (!isAdmin(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const deposits = [];
      const keys = await redis.keys('deposit:*');
      for (const key of keys) {
        const depositStr = await redis.get(key);
        if (depositStr) {
          const deposit = JSON.parse(depositStr);
          deposits.push({ id: key.replace('deposit:', ''), ...deposit });
        }
      }
      return res.status(200).json(deposits);
    }
    
    if (req.url.includes('/api/deposit/approve') && req.method === 'POST') {
      if (!isAdmin(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const body = await parseBody(req);
      const { depositId } = body;
      const depositKey = `deposit:${depositId}`;
      const depositStr = await redis.get(depositKey);
      if (!depositStr) {
        return res.status(404).json({ error: 'Deposit not found' });
      }

      const deposit = JSON.parse(depositStr);
      const userStr = await redis.get(`user:${deposit.googleId}`);
      if (userStr) {
        const user = JSON.parse(userStr);
        user.balance += Number(deposit.amount) || 0;
        user.history.push({
          type: 'deposit_approved',
          amount: Number(deposit.amount) || 0,
          time: new Date().toISOString()
        });
        await redis.set(`user:${deposit.googleId}`, JSON.stringify(user));
      }

      await redis.del(depositKey);
      return res.status(200).json({ success: true });
    }
    
    // Game routes
    if (req.url.includes('/api/crates/open') && req.method === 'POST') {
      const decoded = getUserFromToken(req);
      if (!decoded) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { googleId } = decoded;
      const body = await parseBody(req);
      const { cost, wonItem } = body;
      const userStr = await redis.get(`user:${googleId}`);
      if (!userStr) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = JSON.parse(userStr);
      user.balance -= Number(cost) || 0;
      user.inventory.push({ ...wonItem, timestamp: new Date().toISOString() });
      user.totalWagered += Number(cost) || 0;
      user.totalWon += Number(wonItem?.value) || 0;
      user.history.push({
        type: 'crate',
        item: wonItem?.name || 'Unknown',
        won: true,
        amount: Number(wonItem?.value) || 0,
        value: Number(wonItem?.value) || 0,
        time: new Date().toISOString()
      });

      await redis.set(`user:${googleId}`, JSON.stringify(user));
      return res.status(200).json(user);
    }
    
    if (req.url.includes('/api/mines/play') && req.method === 'POST') {
      const decoded = getUserFromToken(req);
      if (!decoded) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { googleId } = decoded;
      const body = await parseBody(req);
      const { bet, won, multiplier } = body;
      const userStr = await redis.get(`user:${googleId}`);
      if (!userStr) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = JSON.parse(userStr);
      const betValue = Number(bet) || 0;
      user.totalWagered += betValue;

      if (won) {
        const win = Math.floor(betValue * (Number(multiplier) || 1));
        user.balance += win;
        user.totalWon += win;
        user.history.push({
          type: 'mines',
          won: true,
          amount: win,
          multiplier: Number(multiplier) || 1,
          time: new Date().toISOString()
        });
      } else {
        user.history.push({
          type: 'mines',
          won: false,
          amount: betValue,
          bet: betValue,
          time: new Date().toISOString()
        });
      }

      await redis.set(`user:${googleId}`, JSON.stringify(user));
      return res.status(200).json(user);
    }
    
    if (req.url.includes('/api/towers/play') && req.method === 'POST') {
      const decoded = getUserFromToken(req);
      if (!decoded) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { googleId } = decoded;
      const body = await parseBody(req);
      const { bet, won, multiplier } = body;
      const userStr = await redis.get(`user:${googleId}`);
      if (!userStr) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = JSON.parse(userStr);
      const betValue = Number(bet) || 0;
      user.totalWagered += betValue;

      if (won) {
        const win = Math.floor(betValue * (Number(multiplier) || 1));
        user.balance += win;
        user.totalWon += win;
        user.history.push({
          type: 'towers',
          won: true,
          amount: win,
          multiplier: Number(multiplier) || 1,
          time: new Date().toISOString()
        });
      } else {
        user.history.push({
          type: 'towers',
          won: false,
          amount: betValue,
          bet: betValue,
          time: new Date().toISOString()
        });
      }

      await redis.set(`user:${googleId}`, JSON.stringify(user));
      return res.status(200).json(user);
    }
    
    if (req.url.includes('/api/inventory/sell') && req.method === 'POST') {
      const decoded = getUserFromToken(req);
      if (!decoded) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { googleId } = decoded;
      const body = await parseBody(req);
      const { itemIndex } = body;
      const userStr = await redis.get(`user:${googleId}`);
      if (!userStr) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = JSON.parse(userStr);
      if (itemIndex >= user.inventory.length || user.inventory[itemIndex].sold) {
        return res.status(400).json({ error: 'Invalid item' });
      }

      const item = user.inventory[itemIndex];
      const sellValue = Math.floor((Number(item.value) || 0) * 0.7);
      user.balance += sellValue;
      item.sold = true;
      user.history.push({
        type: 'sell',
        item: item.name,
        amount: sellValue,
        time: new Date().toISOString()
      });

      await redis.set(`user:${googleId}`, JSON.stringify(user));
      return res.status(200).json(user);
    }
    
    if (req.url.includes('/api/promo/redeem') && req.method === 'POST') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const token = authHeader.split(' ')[1];
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      const { googleId } = decoded;
      
      const { code } = req.body;
      const promoKey = `promo:${code}`;
      const promoStr = await redis.get(promoKey);
      if (!promoStr) {
        return res.status(404).json({ error: 'Invalid code' });
      }
      
      const promo = JSON.parse(promoStr);
      if (promo.uses >= promo.maxUses) {
        return res.status(400).json({ error: 'Code max uses reached' });
      }
      
      // Check if user already used this code
      const userStr = await redis.get(`user:${googleId}`);
      if (userStr) {
        const user = JSON.parse(userStr);
        const usedCodes = user.usedPromoCodes || [];
        if (usedCodes.includes(code)) {
          return res.status(400).json({ error: 'Code already used' });
        }
        
        user.balance += promo.amount;
        user.history.push({
          type: 'promo',
          code,
          amount: promo.amount,
          time: new Date().toISOString()
        });
        usedCodes.push(code);
        user.usedPromoCodes = usedCodes;
        
        promo.uses++;
        await redis.set(promoKey, JSON.stringify(promo));
        await redis.set(`user:${googleId}`, JSON.stringify(user));
        
        return res.status(200).json({ balance: user.balance, amount: promo.amount });
      }
      
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (req.url.includes('/api/promo/list') && req.method === 'GET') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const promos = [];
      const keys = await redis.keys('promo:*');
      for (const key of keys) {
        const promoStr = await redis.get(key);
        if (promoStr) {
          promos.push(JSON.parse(promoStr));
        }
      }
      return res.status(200).json(promos);
    }
    
    if (req.url.includes('/api/withdraw/request') && req.method === 'POST') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const token = authHeader.split(' ')[1];
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      const { googleId } = decoded;
      
      const { amount, robloxUsername } = req.body;
      const userStr = await redis.get(`user:${googleId}`);
      if (!userStr) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const user = JSON.parse(userStr);
      if (amount > user.balance) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }
      
      const withdrawId = `withdraw:${Date.now()}`;
      await redis.set(withdrawId, JSON.stringify({
        googleId, robloxUsername, amount,
        timestamp: new Date().toISOString(),
        status: 'pending'
      }));
      
      user.balance -= amount;
      user.history.push({
        type: 'withdraw',
        amount,
        time: new Date().toISOString()
      });
      
      await redis.set(`user:${googleId}`, JSON.stringify(user));
      return res.status(200).json(user);
    }
    
    if (req.url.includes('/api/deposit/request') && req.method === 'POST') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const token = authHeader.split(' ')[1];
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      const { googleId } = decoded;
      
      const { amount, caelusUsername } = req.body;
      const depositId = `deposit:${Date.now()}`;
      await redis.set(depositId, JSON.stringify({
        googleId, caelusUsername, amount,
        timestamp: new Date().toISOString(),
        status: 'pending'
      }));
      
      return res.status(200).json({ success: true });
    }
    
    if (req.url.includes('/api/robux-stock')) {
      return res.status(200).json({ stock: 150000 });
    }
    
    return res.status(404).json({ error: 'Not found' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
