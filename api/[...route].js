import { createClient } from "redis";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-vercel";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "kerimpro";

let redisPromise;

function getRedis() {
  if (!redisPromise) {
    const url = process.env.REDIS_URL;
    if (!url) {
      throw new Error("Missing REDIS_URL environment variable");
    }

    const client = createClient({ url });
    client.on("error", (err) => console.error("Redis error:", err));
    redisPromise = client.connect().then(() => client);
  }

  return redisPromise;
}

function getBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

function getBearerToken(req) {
  const auth = req.headers.authorization || "";
  const parts = auth.split(" ");
  if (parts[0] === "Bearer" && parts[1]) return parts[1];
  return null;
}

function getUserFromAuth(req) {
  const token = getBearerToken(req);
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function getAdminFromAuth(req) {
  const raw = req.headers["x-admin-token"] || getBearerToken(req);
  if (!raw || typeof raw !== "string") return null;
  try {
    const parsed = jwt.verify(raw, JWT_SECRET);
    return parsed?.admin ? parsed : null;
  } catch {
    return null;
  }
}

async function readUser(redis, googleId) {
  const userData = await redis.get(`user:${googleId}`);
  return userData ? JSON.parse(userData) : null;
}

async function saveUser(redis, user) {
  await redis.set(`user:${user.googleId}`, JSON.stringify(user));
}

export default async function handler(req, res) {
  try {
    const redis = await getRedis();
    const method = req.method || "GET";
    const segments = Array.isArray(req.query.route) ? req.query.route : [];
    const route = `/${segments.join("/")}`;
    const body = getBody(req);

    // AUTH
    if (method === "POST" && route === "/auth/google") {
      const { googleId, email, name, picture } = body;
      if (!googleId || !email) {
        return res.status(400).json({ error: "Missing Google identity" });
      }

      let user = await readUser(redis, googleId);
      if (!user) {
        user = {
          googleId,
          email,
          name: name || "Caeflip User",
          picture: picture || "",
          balance: 0,
          roblosecurity: "",
          inventory: [],
          createdAt: new Date().toISOString(),
        };
        await saveUser(redis, user);
        await redis.sAdd("users:all", googleId);
      }

      const token = jwt.sign({ googleId, email }, JWT_SECRET, { expiresIn: "7d" });
      return res.status(200).json({ token, user });
    }

    if (method === "POST" && route === "/auth/roblosecurity") {
      const authUser = getUserFromAuth(req);
      if (!authUser) return res.status(401).json({ error: "Unauthorized" });

      const user = await readUser(redis, authUser.googleId);
      if (!user) return res.status(404).json({ error: "User not found" });

      user.roblosecurity = body.roblosecurity || "";
      await saveUser(redis, user);
      return res.status(200).json({ success: true, user });
    }

    // USER
    if (method === "GET" && route === "/user/profile") {
      const authUser = getUserFromAuth(req);
      if (!authUser) return res.status(401).json({ error: "Unauthorized" });

      const user = await readUser(redis, authUser.googleId);
      if (!user) return res.status(404).json({ error: "User not found" });

      return res.status(200).json(user);
    }

    // CRATES
    if (method === "POST" && route === "/crates/open") {
      const authUser = getUserFromAuth(req);
      if (!authUser) return res.status(401).json({ error: "Unauthorized" });

      const { crateType, cost, wonItem } = body;
      const user = await readUser(redis, authUser.googleId);
      if (!user) return res.status(404).json({ error: "User not found" });

      const numericCost = Number(cost) || 0;
      if (user.balance < numericCost) {
        return res.status(400).json({ error: "Insufficient balance" });
      }

      user.balance -= numericCost;
      if (wonItem) {
        user.inventory.push({
          ...wonItem,
          wonAt: new Date().toISOString(),
          crateType,
        });
      }

      await saveUser(redis, user);
      return res.status(200).json({ success: true, user });
    }

    // TOWERS
    if (method === "POST" && route === "/towers/play") {
      const authUser = getUserFromAuth(req);
      if (!authUser) return res.status(401).json({ error: "Unauthorized" });

      const { bet, won, multiplier } = body;
      const user = await readUser(redis, authUser.googleId);
      if (!user) return res.status(404).json({ error: "User not found" });

      const numericBet = Number(bet) || 0;
      const numericMultiplier = Number(multiplier) || 0;

      if (won) {
        user.balance += numericBet * numericMultiplier - numericBet;
      } else {
        user.balance -= numericBet;
      }

      await saveUser(redis, user);
      return res.status(200).json({ success: true, balance: user.balance });
    }

    // MINES
    if (method === "POST" && route === "/mines/play") {
      const authUser = getUserFromAuth(req);
      if (!authUser) return res.status(401).json({ error: "Unauthorized" });

      const { bet, won, multiplier } = body;
      const user = await readUser(redis, authUser.googleId);
      if (!user) return res.status(404).json({ error: "User not found" });

      const numericBet = Number(bet) || 0;
      const numericMultiplier = Number(multiplier) || 0;

      if (won) {
        user.balance += numericBet * numericMultiplier;
      }

      await saveUser(redis, user);
      return res.status(200).json({ success: true, balance: user.balance });
    }

    // PROMOS
    if (method === "POST" && route === "/promo/redeem") {
      const authUser = getUserFromAuth(req);
      if (!authUser) return res.status(401).json({ error: "Unauthorized" });

      const code = String(body.code || "").toUpperCase().trim();
      if (!code) return res.status(400).json({ error: "Missing promo code" });

      const promoData = await redis.get(`promo:${code}`);
      if (!promoData) return res.status(404).json({ error: "Invalid promo code" });

      const promo = JSON.parse(promoData);
      const usedKey = `promo:${code}:used:${authUser.googleId}`;
      const used = await redis.get(usedKey);
      if (used) return res.status(400).json({ error: "Code already used" });

      if ((promo.uses || 0) >= (promo.maxUses || 0)) {
        return res.status(400).json({ error: "Promo max uses reached" });
      }

      const user = await readUser(redis, authUser.googleId);
      if (!user) return res.status(404).json({ error: "User not found" });

      user.balance += Number(promo.amount) || 0;
      promo.uses = (promo.uses || 0) + 1;

      await saveUser(redis, user);
      await redis.set(`promo:${code}`, JSON.stringify(promo));
      await redis.set(usedKey, "1");

      return res.status(200).json({ success: true, amount: promo.amount, balance: user.balance });
    }

    if (method === "GET" && route === "/promo/list") {
      const admin = getAdminFromAuth(req);
      if (!admin) return res.status(401).json({ error: "Admin only" });

      const keys = await redis.keys("promo:*");
      const promos = [];
      for (const key of keys) {
        if (key.includes(":used:")) continue;
        const item = await redis.get(key);
        if (item) promos.push(JSON.parse(item));
      }
      return res.status(200).json(promos);
    }

    // WITHDRAW
    if (method === "POST" && route === "/withdraw/request") {
      const authUser = getUserFromAuth(req);
      if (!authUser) return res.status(401).json({ error: "Unauthorized" });

      const amount = Number(body.amount) || 0;
      const robloxUsername = String(body.robloxUsername || "").trim();
      if (amount <= 0 || !robloxUsername) {
        return res.status(400).json({ error: "Invalid withdrawal request" });
      }

      const user = await readUser(redis, authUser.googleId);
      if (!user) return res.status(404).json({ error: "User not found" });
      if (user.balance < amount) return res.status(400).json({ error: "Insufficient balance" });

      user.balance -= amount;
      await saveUser(redis, user);

      const id = `withdrawal:${Date.now()}:${authUser.googleId}`;
      const withdrawal = {
        id,
        googleId: authUser.googleId,
        name: user.name,
        email: user.email,
        amount,
        robloxUsername,
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      await redis.set(id, JSON.stringify(withdrawal));
      await redis.sAdd("withdrawals:pending", id);
      return res.status(200).json({ success: true, withdrawal });
    }

    if (method === "GET" && route === "/withdraw/pending") {
      const admin = getAdminFromAuth(req);
      if (!admin) return res.status(401).json({ error: "Admin only" });

      const ids = await redis.sMembers("withdrawals:pending");
      const data = await Promise.all(ids.map((id) => redis.get(id)));
      const withdrawals = data.filter(Boolean).map((item) => JSON.parse(item));
      return res.status(200).json(withdrawals);
    }

    // ADMIN
    if (method === "POST" && route === "/admin/verify") {
      if (body.password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: "Invalid admin password" });
      }
      const token = jwt.sign({ admin: true }, JWT_SECRET, { expiresIn: "24h" });
      return res.status(200).json({ success: true, token });
    }

    if (method === "GET" && route === "/admin/users") {
      const admin = getAdminFromAuth(req);
      if (!admin) return res.status(401).json({ error: "Admin only" });

      const ids = await redis.sMembers("users:all");
      const users = [];
      for (const id of ids) {
        const user = await readUser(redis, id);
        if (!user) continue;
        users.push({
          googleId: user.googleId,
          email: user.email,
          name: user.name,
          balance: user.balance,
          inventoryCount: Array.isArray(user.inventory) ? user.inventory.length : 0,
          createdAt: user.createdAt,
        });
      }
      return res.status(200).json(users);
    }

    if (method === "POST" && route === "/admin/add-balance") {
      const admin = getAdminFromAuth(req);
      if (!admin) return res.status(401).json({ error: "Admin only" });

      const { googleId, amount } = body;
      const user = await readUser(redis, googleId);
      if (!user) return res.status(404).json({ error: "User not found" });

      user.balance += Number(amount) || 0;
      await saveUser(redis, user);
      return res.status(200).json({ success: true, newBalance: user.balance });
    }

    if (method === "POST" && route === "/admin/promo/create") {
      const admin = getAdminFromAuth(req);
      if (!admin) return res.status(401).json({ error: "Admin only" });

      const code = String(body.code || "").toUpperCase().trim();
      const amount = Number(body.amount) || 0;
      const maxUses = Number(body.maxUses) || 0;
      if (!code || amount <= 0 || maxUses <= 0) {
        return res.status(400).json({ error: "Invalid promo payload" });
      }

      const promo = { code, amount, maxUses, uses: 0, createdAt: new Date().toISOString() };
      await redis.set(`promo:${code}`, JSON.stringify(promo));
      return res.status(200).json({ success: true, promo });
    }

    if (method === "POST" && route === "/admin/withdrawal/approve") {
      const admin = getAdminFromAuth(req);
      if (!admin) return res.status(401).json({ error: "Admin only" });

      const id = body.withdrawalId;
      const raw = await redis.get(id);
      if (!raw) return res.status(404).json({ error: "Withdrawal not found" });

      const withdrawal = JSON.parse(raw);
      withdrawal.status = "approved";
      withdrawal.updatedAt = new Date().toISOString();

      await redis.set(id, JSON.stringify(withdrawal));
      await redis.sRem("withdrawals:pending", id);
      await redis.sAdd("withdrawals:approved", id);

      return res.status(200).json({ success: true });
    }

    if (method === "POST" && route === "/admin/withdrawal/reject") {
      const admin = getAdminFromAuth(req);
      if (!admin) return res.status(401).json({ error: "Admin only" });

      const id = body.withdrawalId;
      const raw = await redis.get(id);
      if (!raw) return res.status(404).json({ error: "Withdrawal not found" });

      const withdrawal = JSON.parse(raw);
      const user = await readUser(redis, withdrawal.googleId);
      if (!user) return res.status(404).json({ error: "User not found" });

      user.balance += Number(withdrawal.amount) || 0;
      await saveUser(redis, user);

      withdrawal.status = "rejected";
      withdrawal.updatedAt = new Date().toISOString();

      await redis.set(id, JSON.stringify(withdrawal));
      await redis.sRem("withdrawals:pending", id);
      await redis.sAdd("withdrawals:rejected", id);

      return res.status(200).json({ success: true });
    }

    return res.status(404).json({ error: `Route not found: ${method} ${route}` });
  } catch (error) {
    console.error("API failure:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
