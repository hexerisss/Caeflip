import { createClient } from 'redis';

let redis = null;

async function getRedis() {
  if (!redis) {
    redis = createClient({ url: process.env.REDIS_URL });
    redis.on('error', (e) => console.error('Redis error', e));
    await redis.connect();
  }
  return redis;
}

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'kerimpro';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-admin-token');
}

async function body(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return new Promise((resolve) => {
    let d = '';
    req.on('data', c => d += c);
    req.on('end', () => { try { resolve(JSON.parse(d || '{}')); } catch { resolve({}); } });
  });
}

function getUser(req) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return null;
  try { return JSON.parse(Buffer.from(h.split(' ')[1], 'base64').toString()); } catch { return null; }
}

function checkAdmin(req) {
  const t = req.headers['x-admin-token'];
  if (!t) return false;
  try {
    const d = JSON.parse(Buffer.from(t, 'base64').toString());
    return d.admin === true && d.password === ADMIN_PASSWORD;
  } catch { return false; }
}

function makeToken(payload) {
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = await getRedis();
  const url = req.url.replace(/\?.*$/, '');
  const method = req.method;

  try {

    // ─── AUTH ────────────────────────────────────────────────
    if (url === '/api/auth/google' && method === 'POST') {
      const { googleId, email, name, picture, referralCode } = await body(req);
      if (!googleId) return res.status(400).json({ error: 'Missing googleId' });

      let user = null;
      const raw = await db.get(`user:${googleId}`);
      if (raw) {
        user = JSON.parse(raw);
      } else {
        const userId = 'CF-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        const refCode = 'CAE-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        user = {
          googleId, email, name, picture,
          userId, balance: 0,
          inventory: [], history: [],
          roblosecurity: '',
          referralCode: refCode,
          referredBy: referralCode || null,
          referrals: 0, referralEarnings: 0,
          totalWagered: 0, totalWon: 0,
          createdAt: new Date().toISOString(),
          lastSeen: new Date().toISOString(),
          usedPromoCodes: []
        };
        // Referral bonus
        if (referralCode) {
          const refRaw = await db.get(`refcode:${referralCode}`);
          if (refRaw) {
            const refGoogleId = refRaw;
            const refUserRaw = await db.get(`user:${refGoogleId}`);
            if (refUserRaw) {
              const refUser = JSON.parse(refUserRaw);
              refUser.referrals = (refUser.referrals || 0) + 1;
              refUser.referralEarnings = (refUser.referralEarnings || 0) + 50;
              refUser.balance += 50;
              refUser.history.push({ type: 'referral_earn', amount: 50, who: name, time: new Date().toISOString() });
              await db.set(`user:${refGoogleId}`, JSON.stringify(refUser));
            }
          }
          user.balance = 25;
          user.history.push({ type: 'referral_bonus', amount: 25, time: new Date().toISOString() });
        }
        await db.set(`user:${googleId}`, JSON.stringify(user));
        await db.set(`refcode:${user.referralCode}`, googleId);
        // Add to users index
        await db.sAdd('users:all', googleId);
      }

      // Update last seen
      user.lastSeen = new Date().toISOString();
      await db.set(`user:${googleId}`, JSON.stringify(user));

      const token = makeToken({ googleId });
      return res.status(200).json({ token, user });
    }

    if (url === '/api/auth/roblosecurity' && method === 'POST') {
      const decoded = getUser(req);
      if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
      const { roblosecurity } = await body(req);
      if (!roblosecurity) return res.status(400).json({ error: 'Missing token' });
      const raw = await db.get(`user:${decoded.googleId}`);
      if (!raw) return res.status(404).json({ error: 'User not found' });
      const user = JSON.parse(raw);
      user.roblosecurity = roblosecurity;
      await db.set(`user:${decoded.googleId}`, JSON.stringify(user));
      return res.status(200).json({ success: true, user });
    }

    if (url === '/api/user/profile' && method === 'GET') {
      const decoded = getUser(req);
      if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
      const raw = await db.get(`user:${decoded.googleId}`);
      if (!raw) return res.status(404).json({ error: 'User not found' });
      return res.status(200).json(JSON.parse(raw));
    }

    // ─── ADMIN AUTH ──────────────────────────────────────────
    if (url === '/api/admin/verify' && method === 'POST') {
      const { password } = await body(req);
      if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Wrong password' });
      const token = makeToken({ admin: true, password });
      return res.status(200).json({ token });
    }

    // ─── ADMIN USERS ─────────────────────────────────────────
    if (url === '/api/admin/users' && method === 'GET') {
      if (!checkAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
      const ids = await db.sMembers('users:all');
      const users = [];
      for (const id of ids) {
        const raw = await db.get(`user:${id}`);
        if (raw) users.push(JSON.parse(raw));
      }
      return res.status(200).json(users);
    }

    if (url === '/api/admin/add-balance' && method === 'POST') {
      if (!checkAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
      const { googleId, amount } = await body(req);
      const raw = await db.get(`user:${googleId}`);
      if (!raw) return res.status(404).json({ error: 'User not found' });
      const user = JSON.parse(raw);
      user.balance += Number(amount) || 0;
      user.history.push({ type: 'admin_credit', amount: Number(amount) || 0, time: new Date().toISOString() });
      await db.set(`user:${googleId}`, JSON.stringify(user));
      return res.status(200).json({ success: true, balance: user.balance });
    }

    if (url === '/api/admin/set-balance' && method === 'POST') {
      if (!checkAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
      const { googleId, amount } = await body(req);
      const raw = await db.get(`user:${googleId}`);
      if (!raw) return res.status(404).json({ error: 'User not found' });
      const user = JSON.parse(raw);
      user.balance = Number(amount) || 0;
      user.history.push({ type: 'admin_set', amount: Number(amount) || 0, time: new Date().toISOString() });
      await db.set(`user:${googleId}`, JSON.stringify(user));
      return res.status(200).json({ success: true, balance: user.balance });
    }

    // ─── ADMIN PROMOS ────────────────────────────────────────
    if (url === '/api/admin/promo/create' && method === 'POST') {
      if (!checkAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
      const { code, amount, maxUses } = await body(req);
      if (!code || !amount || !maxUses) return res.status(400).json({ error: 'Missing fields' });
      const existing = await db.get(`promo:${code}`);
      if (existing) return res.status(400).json({ error: 'Code already exists' });
      const promo = { code: code.toUpperCase(), amount: Number(amount), maxUses: Number(maxUses), uses: 0, createdAt: new Date().toISOString() };
      await db.set(`promo:${code.toUpperCase()}`, JSON.stringify(promo));
      await db.sAdd('promos:all', code.toUpperCase());
      return res.status(200).json({ success: true, promo });
    }

    if (url === '/api/admin/promo/delete' && method === 'POST') {
      if (!checkAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
      const { code } = await body(req);
      await db.del(`promo:${code}`);
      await db.sRem('promos:all', code);
      return res.status(200).json({ success: true });
    }

    if (url === '/api/admin/promo/list' && method === 'GET') {
      if (!checkAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
      const codes = await db.sMembers('promos:all');
      const promos = [];
      for (const c of codes) {
        const raw = await db.get(`promo:${c}`);
        if (raw) promos.push(JSON.parse(raw));
      }
      return res.status(200).json(promos);
    }

    // ─── ADMIN WITHDRAWALS ───────────────────────────────────
    if (url === '/api/admin/withdrawal/approve' && method === 'POST') {
      if (!checkAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
      const { withdrawalId } = await body(req);
      const raw = await db.get(`withdraw:${withdrawalId}`);
      if (!raw) return res.status(404).json({ error: 'Not found' });
      const w = JSON.parse(raw);
      // Update user history
      const uRaw = await db.get(`user:${w.googleId}`);
      if (uRaw) {
        const u = JSON.parse(uRaw);
        u.history.push({ type: 'withdraw_approved', amount: w.amount, time: new Date().toISOString() });
        await db.set(`user:${w.googleId}`, JSON.stringify(u));
      }
      await db.del(`withdraw:${withdrawalId}`);
      await db.sRem('withdrawals:pending', withdrawalId);
      return res.status(200).json({ success: true });
    }

    if (url === '/api/admin/withdrawal/reject' && method === 'POST') {
      if (!checkAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
      const { withdrawalId } = await body(req);
      const raw = await db.get(`withdraw:${withdrawalId}`);
      if (!raw) return res.status(404).json({ error: 'Not found' });
      const w = JSON.parse(raw);
      // Refund the user
      const uRaw = await db.get(`user:${w.googleId}`);
      if (uRaw) {
        const u = JSON.parse(uRaw);
        u.balance += w.amount;
        u.history.push({ type: 'withdraw_rejected', amount: w.amount, time: new Date().toISOString() });
        await db.set(`user:${w.googleId}`, JSON.stringify(u));
      }
      await db.del(`withdraw:${withdrawalId}`);
      await db.sRem('withdrawals:pending', withdrawalId);
      return res.status(200).json({ success: true });
    }

    if (url === '/api/withdraw/pending' && method === 'GET') {
      if (!checkAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
      const ids = await db.sMembers('withdrawals:pending');
      const list = [];
      for (const id of ids) {
        const raw = await db.get(`withdraw:${id}`);
        if (raw) list.push({ id, ...JSON.parse(raw) });
      }
      return res.status(200).json(list);
    }

    // ─── ADMIN DEPOSITS ──────────────────────────────────────
    if (url === '/api/deposit/approve' && method === 'POST') {
      if (!checkAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
      const { depositId } = await body(req);
      const raw = await db.get(`deposit:${depositId}`);
      if (!raw) return res.status(404).json({ error: 'Not found' });
      const d = JSON.parse(raw);
      const uRaw = await db.get(`user:${d.googleId}`);
      if (uRaw) {
        const u = JSON.parse(uRaw);
        u.balance += Number(d.amount);
        u.history.push({ type: 'deposit_approved', amount: Number(d.amount), time: new Date().toISOString() });
        await db.set(`user:${d.googleId}`, JSON.stringify(u));
      }
      await db.del(`deposit:${depositId}`);
      await db.sRem('deposits:pending', depositId);
      return res.status(200).json({ success: true });
    }

    if (url === '/api/deposit/reject' && method === 'POST') {
      if (!checkAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
      const { depositId } = await body(req);
      await db.del(`deposit:${depositId}`);
      await db.sRem('deposits:pending', depositId);
      return res.status(200).json({ success: true });
    }

    if (url === '/api/deposit/pending' && method === 'GET') {
      if (!checkAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
      const ids = await db.sMembers('deposits:pending');
      const list = [];
      for (const id of ids) {
        const raw = await db.get(`deposit:${id}`);
        if (raw) list.push({ id, ...JSON.parse(raw) });
      }
      return res.status(200).json(list);
    }

    // ─── PROMO (USER) ────────────────────────────────────────
    if (url === '/api/promo/redeem' && method === 'POST') {
      const decoded = getUser(req);
      if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
      const { code } = await body(req);
      if (!code) return res.status(400).json({ error: 'Missing code' });
      const promoRaw = await db.get(`promo:${code.toUpperCase()}`);
      if (!promoRaw) return res.status(404).json({ error: 'Invalid promo code' });
      const promo = JSON.parse(promoRaw);
      if (promo.uses >= promo.maxUses) return res.status(400).json({ error: 'Code has reached max uses' });
      const uRaw = await db.get(`user:${decoded.googleId}`);
      if (!uRaw) return res.status(404).json({ error: 'User not found' });
      const user = JSON.parse(uRaw);
      if ((user.usedPromoCodes || []).includes(code.toUpperCase())) return res.status(400).json({ error: 'Already used this code' });
      user.balance += promo.amount;
      user.usedPromoCodes = [...(user.usedPromoCodes || []), code.toUpperCase()];
      user.history.push({ type: 'promo', code: code.toUpperCase(), amount: promo.amount, time: new Date().toISOString() });
      promo.uses++;
      await db.set(`promo:${code.toUpperCase()}`, JSON.stringify(promo));
      await db.set(`user:${decoded.googleId}`, JSON.stringify(user));
      return res.status(200).json({ success: true, amount: promo.amount, balance: user.balance });
    }

    if (url === '/api/promo/list' && method === 'GET') {
      // For admin header
      if (checkAdmin(req)) {
        const codes = await db.sMembers('promos:all');
        const promos = [];
        for (const c of codes) {
          const raw = await db.get(`promo:${c}`);
          if (raw) promos.push(JSON.parse(raw));
        }
        return res.status(200).json(promos);
      }
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // ─── WITHDRAW (USER) ─────────────────────────────────────
    if (url === '/api/withdraw/request' && method === 'POST') {
      const decoded = getUser(req);
      if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
      const { amount, caelusUsername } = await body(req);
      if (!amount || !caelusUsername) return res.status(400).json({ error: 'Missing fields' });
      const uRaw = await db.get(`user:${decoded.googleId}`);
      if (!uRaw) return res.status(404).json({ error: 'User not found' });
      const user = JSON.parse(uRaw);
      if (Number(amount) > user.balance) return res.status(400).json({ error: 'Insufficient balance' });
      user.balance -= Number(amount);
      user.history.push({ type: 'withdraw_pending', amount: Number(amount), caelusUsername, time: new Date().toISOString() });
      await db.set(`user:${decoded.googleId}`, JSON.stringify(user));
      const wId = Date.now().toString();
      await db.set(`withdraw:${wId}`, JSON.stringify({
        googleId: decoded.googleId, name: user.name, email: user.email,
        caelusUsername, amount: Number(amount),
        status: 'pending', timestamp: new Date().toISOString()
      }));
      await db.sAdd('withdrawals:pending', wId);
      return res.status(200).json({ success: true, balance: user.balance });
    }

    // ─── DEPOSIT (USER) ──────────────────────────────────────
    if (url === '/api/deposit/request' && method === 'POST') {
      const decoded = getUser(req);
      if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
      const { amount, caelusUsername } = await body(req);
      if (!amount || !caelusUsername) return res.status(400).json({ error: 'Missing fields' });
      const uRaw = await db.get(`user:${decoded.googleId}`);
      if (!uRaw) return res.status(404).json({ error: 'User not found' });
      const user = JSON.parse(uRaw);
      const dId = Date.now().toString();
      await db.set(`deposit:${dId}`, JSON.stringify({
        googleId: decoded.googleId, name: user.name, email: user.email,
        caelusUsername, amount: Number(amount),
        status: 'pending', timestamp: new Date().toISOString()
      }));
      await db.sAdd('deposits:pending', dId);
      user.history.push({ type: 'deposit_pending', amount: Number(amount), caelusUsername, time: new Date().toISOString() });
      await db.set(`user:${decoded.googleId}`, JSON.stringify(user));
      return res.status(200).json({ success: true });
    }

    // ─── INVENTORY SELL ──────────────────────────────────────
    if (url === '/api/inventory/sell' && method === 'POST') {
      const decoded = getUser(req);
      if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
      const { itemId } = await body(req);
      const uRaw = await db.get(`user:${decoded.googleId}`);
      if (!uRaw) return res.status(404).json({ error: 'User not found' });
      const user = JSON.parse(uRaw);
      const idx = user.inventory.findIndex(i => i.id === itemId && !i.sold);
      if (idx === -1) return res.status(404).json({ error: 'Item not found' });
      const item = user.inventory[idx];
      const sellValue = Math.floor(item.value * 0.7);
      user.inventory[idx].sold = true;
      user.balance += sellValue;
      user.history.push({ type: 'sell', item: item.name, amount: sellValue, time: new Date().toISOString() });
      await db.set(`user:${decoded.googleId}`, JSON.stringify(user));
      return res.status(200).json({ success: true, balance: user.balance, sellValue });
    }

    // ─── GAMES ───────────────────────────────────────────────
    if (url === '/api/crates/open' && method === 'POST') {
      const decoded = getUser(req);
      if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
      const { cost, wonItem } = await body(req);
      const uRaw = await db.get(`user:${decoded.googleId}`);
      if (!uRaw) return res.status(404).json({ error: 'User not found' });
      const user = JSON.parse(uRaw);
      if (user.balance < Number(cost)) return res.status(400).json({ error: 'Insufficient balance' });
      user.balance -= Number(cost);
      const itemWithId = { ...wonItem, id: Date.now().toString() + Math.random().toString(36).substring(2), sold: false, wonAt: new Date().toISOString() };
      user.inventory.push(itemWithId);
      user.totalWagered = (user.totalWagered || 0) + Number(cost);
      user.totalWon = (user.totalWon || 0) + Number(wonItem.value);
      user.history.push({ type: 'crate', item: wonItem.name, value: wonItem.value, cost: Number(cost), rarity: wonItem.rarity, time: new Date().toISOString() });
      await db.set(`user:${decoded.googleId}`, JSON.stringify(user));
      return res.status(200).json({ success: true, user });
    }

    if (url === '/api/mines/result' && method === 'POST') {
      const decoded = getUser(req);
      if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
      const { bet, won, multiplier, minesCount } = await body(req);
      const uRaw = await db.get(`user:${decoded.googleId}`);
      if (!uRaw) return res.status(404).json({ error: 'User not found' });
      const user = JSON.parse(uRaw);
      const betAmt = Number(bet) || 0;
      user.totalWagered = (user.totalWagered || 0) + betAmt;
      if (won) {
        const win = Math.floor(betAmt * (Number(multiplier) || 1));
        user.balance += win;
        user.totalWon = (user.totalWon || 0) + win;
        user.history.push({ type: 'mines', won: true, bet: betAmt, amount: win, multiplier: Number(multiplier), minesCount, time: new Date().toISOString() });
      } else {
        user.history.push({ type: 'mines', won: false, bet: betAmt, amount: betAmt, minesCount, time: new Date().toISOString() });
      }
      await db.set(`user:${decoded.googleId}`, JSON.stringify(user));
      return res.status(200).json({ success: true, balance: user.balance });
    }

    if (url === '/api/towers/result' && method === 'POST') {
      const decoded = getUser(req);
      if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
      const { bet, won, multiplier, difficulty, level } = await body(req);
      const uRaw = await db.get(`user:${decoded.googleId}`);
      if (!uRaw) return res.status(404).json({ error: 'User not found' });
      const user = JSON.parse(uRaw);
      const betAmt = Number(bet) || 0;
      user.totalWagered = (user.totalWagered || 0) + betAmt;
      if (won) {
        const win = Math.floor(betAmt * (Number(multiplier) || 1));
        user.balance += win;
        user.totalWon = (user.totalWon || 0) + win;
        user.history.push({ type: 'towers', won: true, bet: betAmt, amount: win, multiplier: Number(multiplier), difficulty, level, time: new Date().toISOString() });
      } else {
        user.history.push({ type: 'towers', won: false, bet: betAmt, amount: betAmt, difficulty, level, time: new Date().toISOString() });
      }
      await db.set(`user:${decoded.googleId}`, JSON.stringify(user));
      return res.status(200).json({ success: true, balance: user.balance });
    }

    // ─── ROBUX STOCK ─────────────────────────────────────────
    if (url === '/api/robux-stock' && method === 'GET') {
      try {
        const r = await fetch('https://pastebin.com/raw/Lfg5wnAE');
        const text = await r.text();
        const match = text.match(/[\d,]+/);
        const stock = match ? parseInt(match[0].replace(/,/g, '')) : 0;
        return res.status(200).json({ stock });
      } catch {
        return res.status(200).json({ stock: 0 });
      }
    }

    return res.status(404).json({ error: `Not found: ${url}` });

  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}
