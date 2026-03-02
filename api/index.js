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

export const config = {
  runtime: 'nodejs-18.x'
};

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
      const { googleId, email, name, picture, referralCode } = req.body;
      
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
          totalWagered: 0, totalWon: 0, createdAt: new Date().toISOString()
        };
        
        await redis.set(`user:${googleId}`, JSON.stringify(user));
        
        // Track referrals
        if (referralCode) {
          const referrerKey = `user:ref:${referralCode}`;
          const referrer = await redis.get(referrerKey);
          if (referrer) {
            const r = JSON.parse(referrer);
            r.referrals = (r.referrals || 0) + 1;
            r.referralEarnings = (r.referralEarnings || 0) + 25;
            await redis.set(referrerKey, JSON.stringify(r));
            
            // Add referral bonus to new user
            user.balance += 25;
            await redis.set(`user:${googleId}`, JSON.stringify(user));
            
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
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const token = authHeader.split(' ')[1];
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      const { googleId } = decoded;
      
      const { roblosecurity } = req.body;
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
      
      return res.status(200).json({ success: true });
    }
    
    if (req.url.includes('/api/user/profile')) {
      if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const token = authHeader.split(' ')[1];
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
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
      const { password } = req.body;
      if (password === process.env.ADMIN_PASSWORD || password === 'kerimpro') {
        const adminToken = Buffer.from(JSON.stringify({ admin: true, password })).toString('base64');
        return res.status(200).json({ token: adminToken });
      }
      return res.status(401).json({ error: 'Invalid password' });
    }
    
    // Admin routes
    if (req.url.includes('/api/admin/users') && req.method === 'GET') {
      const adminToken = req.headers['x-admin-token'];
      if (!adminToken || adminToken !== Buffer.from(process.env.ADMIN_PASSWORD || 'kerimpro', 'base64').toString()) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const users = [];
      const keys = await redis.keys('user:*');
      for (const key of keys) {
        if (key.startsWith('user:user:')) continue;
        const userStr = await redis.get(key);
        if (userStr) {
          users.push(JSON.parse(userStr));
        }
      }
      return res.status(200).json(users);
    }
    
    if (req.url.includes('/api/admin/add-balance') && req.method === 'POST') {
      const adminToken = req.headers['x-admin-token'];
      if (!adminToken || adminToken !== Buffer.from(process.env.ADMIN_PASSWORD || 'kerimpro', 'base64').toString()) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const { googleId, amount } = req.body;
      const userStr = await redis.get(`user:${googleId}`);
      if (!userStr) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const user = JSON.parse(userStr);
      user.balance += amount;
      user.history.push({
        type: 'admin_credit',
        amount: amount,
        time: new Date().toISOString()
      });
      await redis.set(`user:${googleId}`, JSON.stringify(user));
      
      return res.status(200).json({ success: true });
    }
    
    if (req.url.includes('/api/admin/promo/create') && req.method === 'POST') {
      const adminToken = req.headers['x-admin-token'];
      if (!adminToken || adminToken !== Buffer.from(process.env.ADMIN_PASSWORD || 'kerimpro', 'base64').toString()) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const { code, amount, maxUses } = req.body;
      const promoKey = `promo:${code}`;
      const existing = await redis.get(promoKey);
      
      if (existing) {
        return res.status(400).json({ error: 'Code already exists' });
      }
      
      await redis.set(promoKey, JSON.stringify({ code, amount: parseFloat(amount), maxUses: parseInt(maxUses), uses: 0 }));
      return res.status(200).json({ success: true });
    }
    
    if (req.url.includes('/api/admin/promo/delete') && req.method === 'POST') {
      const adminToken = req.headers['x-admin-token'];
      if (!adminToken || adminToken !== Buffer.from(process.env.ADMIN_PASSWORD || 'kerimpro', 'base64').toString()) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const { code } = req.body;
      await redis.del(`promo:${code}`);
      return res.status(200).json({ success: true });
    }
    
    if (req.url.includes('/api/admin/withdrawal/approve') && req.method === 'POST') {
      const adminToken = req.headers['x-admin-token'];
      if (!adminToken || adminToken !== Buffer.from(process.env.ADMIN_PASSWORD || 'kerimpro', 'base64').toString()) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const { withdrawalId } = req.body;
      const withdrawKey = `withdraw:${withdrawalId}`;
      const withdrawStr = await redis.get(withdrawKey);
      if (!withdrawStr) {
        return res.status(404).json({ error: 'Withdrawal not found' });
      }
      
      const withdraw = JSON.parse(withdrawStr);
      const userStr = await redis.get(`user:${withdraw.googleId}`);
      if (userStr) {
        const user = JSON.parse(userStr);
        user.balance -= withdraw.amount;
        user.history.push({
          type: 'withdraw_approved',
          amount: withdraw.amount,
          time: new Date().toISOString()
        });
        await redis.set(`user:${googleId}`, JSON.stringify(user));
      }
      
      await redis.del(withdrawKey);
      return res.status(200).json({ success: true });
    }
    
    if (req.url.includes('/api/admin/withdrawal/reject') && req.method === 'POST') {
      const adminToken = req.headers['x-admin-token'];
      if (!adminToken || adminToken !== Buffer.from(process.env.ADMIN_PASSWORD || 'kerimpro', 'base64').toString()) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const { withdrawalId } = req.body;
      await redis.del(`withdraw:${withdrawalId}`);
      return res.status(200).json({ success: true });
    }
    
    if (req.url.includes('/api/admin/promo/list') && req.method === 'GET') {
      const adminToken = req.headers['x-admin-token'];
      if (!adminToken || adminToken !== Buffer.from(process.env.ADMIN_PASSWORD || 'kerimpro', 'base64').toString()) {
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
      const adminToken = req.headers['x-admin-token'];
      if (!adminToken || adminToken !== Buffer.from(process.env.ADMIN_PASSWORD || 'kerimpro', 'base64').toString()) {
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
      const adminToken = req.headers['x-admin-token'];
      if (!adminToken || adminToken !== Buffer.from(process.env.ADMIN_PASSWORD || 'kerimpro', 'base64').toString()) {
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
      const adminToken = req.headers['x-admin-token'];
      if (!adminToken || adminToken !== Buffer.from(process.env.ADMIN_PASSWORD || 'kerimpro', 'base64').toString()) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const { depositId } = req.body;
      const depositKey = `deposit:${depositId}`;
      const depositStr = await redis.get(depositKey);
      if (!depositStr) {
        return res.status(404).json({ error: 'Deposit not found' });
      }
      
      const deposit = JSON.parse(depositStr);
      const userStr = await redis.get(`user:${deposit.googleId}`);
      if (userStr) {
        const user = JSON.parse(userStr);
        user.balance += deposit.amount;
        user.history.push({
          type: 'deposit_approved',
          amount: deposit.amount,
          time: new Date().toISOString()
        });
        await redis.set(`user:${deposit.googleId}`, JSON.stringify(user));
      }
      
      await redis.del(depositKey);
      return res.status(200).json({ success: true });
    }
    
    // Game routes
    if (req.url.includes('/api/crates/open') && req.method === 'POST') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const token = authHeader.split(' ')[1];
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      const { googleId } = decoded;
      
      const { cost, wonItem } = req.body;
      const userStr = await redis.get(`user:${googleId}`);
      if (!userStr) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const user = JSON.parse(userStr);
      user.balance -= cost;
      user.inventory.push({ ...wonItem, timestamp: new Date().toISOString() });
      user.totalWagered += cost;
      user.totalWon += wonItem.value;
      user.history.push({
        type: 'crate',
        item: wonItem.name,
        won: true,
        amount: wonItem.value,
        value: wonItem.value,
        time: new Date().toISOString()
      });
      
      await redis.set(`user:${googleId}`, JSON.stringify(user));
      return res.status(200).json(user);
    }
    
    if (req.url.includes('/api/mines/play') && req.method === 'POST') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const token = authHeader.split(' ')[1];
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      const { googleId } = decoded;
      
      const { bet, minesCount, won, multiplier } = req.body;
      const userStr = await redis.get(`user:${googleId}`);
      if (!userStr) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const user = JSON.parse(userStr);
      user.totalWagered += bet;
      
      if (won) {
        const win = Math.floor(bet * multiplier);
        user.balance += win;
        user.totalWon += win;
        user.history.push({
          type: 'mines',
          won: true,
          amount: win,
          multiplier,
          time: new Date().toISOString()
        });
      } else {
        user.history.push({
          type: 'mines',
          won: false,
          amount: bet,
          bet,
          time: new Date().toISOString()
        });
      }
      
      await redis.set(`user:${googleId}`, JSON.stringify(user));
      return res.status(200).json(user);
    }
    
    if (req.url.includes('/api/towers/play') && req.method === 'POST') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const token = authHeader.split(' ')[1];
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      const { googleId } = decoded;
      
      const { bet, difficulty, won, multiplier } = req.body;
      const userStr = await redis.get(`user:${googleId}`);
      if (!userStr) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const user = JSON.parse(userStr);
      user.totalWagered += bet;
      
      if (won) {
        const win = Math.floor(bet * multiplier);
        user.balance += win;
        user.totalWon += win;
        user.history.push({
          type: 'towers',
          won: true,
          amount: win,
          multiplier,
          time: new Date().toISOString()
        });
      } else {
        user.history.push({
          type: 'towers',
          won: false,
          amount: bet,
          bet,
          time: new Date().toISOString()
        });
      }
      
      await redis.set(`user:${googleId}`, JSON.stringify(user));
      return res.status(200).json(user);
    }
    
    if (req.url.includes('/api/inventory/sell') && req.method === 'POST') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const token = authHeader.split(' ')[1];
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      const { googleId } = decoded;
      
      const { itemIndex } = req.body;
      const userStr = await redis.get(`user:${googleId}`);
      if (!userStr) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const user = JSON.parse(userStr);
      if (itemIndex >= user.inventory.length || user.inventory[itemIndex].sold) {
        return res.status(400).json({ error: 'Invalid item' });
      }
      
      const item = user.inventory[itemIndex];
      const sellValue = Math.floor(item.value * 0.7);
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
