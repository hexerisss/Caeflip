import { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import confetti from 'canvas-confetti';
import axios from 'axios';

const API = '/api';

const ITEMS = [
  { name: "The Classic ROBLOX Fedora", value: 900, rarity: "legendary", demand: "High" },
  { name: "Tattletale",                value: 800, rarity: "legendary", demand: "Low"  },
  { name: "Valkyrie Helm",             value: 550, rarity: "epic",      demand: "Mid"  },
  { name: "Gold Clockwork Headphones", value: 420, rarity: "epic",      demand: "Mid"  },
  { name: "Soviet Ushanka",            value: 380, rarity: "epic",      demand: "Mid"  },
  { name: "Playful Vampire",           value: 250, rarity: "rare",      demand: "Low"  },
  { name: "Supa Dupa Fly Cap",         value: 160, rarity: "uncommon",  demand: "Low"  },
  { name: "Evil Skeptic",              value: 120, rarity: "uncommon",  demand: "Mid"  },
  { name: "Bucket",                    value:  80, rarity: "common",    demand: "Low"  },
  { name: "Kulle E Koala",             value:  75, rarity: "common",    demand: "Low"  },
  { name: "Black Iron Antlers",        value:  75, rarity: "common",    demand: "Mid"  },
  { name: "Bam",                       value:  70, rarity: "common",    demand: "Low"  },
  { name: "Neon Green Beautiful Hair", value:  65, rarity: "common",    demand: "Low"  },
  { name: "Katana Of Destiny",         value:  60, rarity: "common",    demand: "Low"  },
  { name: "Blue Wistful Wink",         value:  55, rarity: "common",    demand: "Low"  },
  { name: "Chill Cap",                 value:  55, rarity: "common",    demand: "Low"  },
  { name: "Red Goof",                  value:  50, rarity: "common",    demand: "Low"  },
  { name: "Sapphire Evil Eye",         value:  45, rarity: "common",    demand: "Low"  },
  { name: "LOLWHY",                    value:  35, rarity: "common",    demand: "Horrendous" },
  { name: "LOL Santa",                 value:  25, rarity: "common",    demand: "Horrendous" },
];

const CASES = [
  { name: "Starter", cost: 100, color: "#3b82f6", icon: "📦", items: ITEMS },
  { name: "Pro",     cost: 500, color: "#8b5cf6", icon: "💎", items: ITEMS.filter(i => i.value >= 45) },
  { name: "Elite",  cost: 1500, color: "#f59e0b", icon: "👑", items: ITEMS.filter(i => i.value >= 120) },
  { name: "Godly",  cost: 3000, color: "#ef4444", icon: "🔥", items: ITEMS.filter(i => i.value >= 250) },
];

const DEPOSIT_OPTIONS = [
  { amount: 100,  url: "https://www.caelus.lol/catalog/26942/100-balance" },
  { amount: 300,  url: "https://www.caelus.lol/catalog/26940/300-balance" },
  { amount: 500,  url: "https://www.caelus.lol/catalog/26938/500-balance" },
  { amount: 1000, url: "https://www.caelus.lol/catalog/26936/1000-balance" },
  { amount: 5000, url: "https://www.caelus.lol/catalog/26934/5000-balance" },
];

const RARITY_COLOR: Record<string, string> = {
  legendary: '#f59e0b', epic: '#a855f7', rare: '#3b82f6', uncommon: '#22c55e', common: '#64748b'
};
const RARITY_BG: Record<string, string> = {
  legendary: 'linear-gradient(135deg,#78350f,#92400e)',
  epic:      'linear-gradient(135deg,#3b0764,#4c1d95)',
  rare:      'linear-gradient(135deg,#1e3a5f,#1e40af)',
  uncommon:  'linear-gradient(135deg,#14532d,#166534)',
  common:    'linear-gradient(135deg,#1e293b,#334155)',
};

// 70/30 house edge weighted pick
function pickItem(pool: typeof ITEMS) {
  const weights = pool.map(i => 1 / Math.pow(i.value, 1.4));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

// Place mines randomly - pure Fisher-Yates
function placeMines(count: number, total = 25): number[] {
  const positions = Array.from({ length: total }, (_, i) => i);
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  return positions.slice(0, count);
}

// Place tower bombs: exactly 1 safe tile per row
function placeTowerBombs(rows: number, cols: number): number[][] {
  return Array.from({ length: rows }, () => {
    const safe = Math.floor(Math.random() * cols);
    return Array.from({ length: cols }, (_, c) => c).filter(c => c !== safe);
  });
}

interface User {
  googleId: string; email: string; name: string; picture: string;
  userId: string; balance: number; inventory: any[]; roblosecurity: string;
  history: any[]; referralCode: string; referrals: number; referralEarnings: number;
  totalWagered: number; totalWon: number; createdAt: string; lastSeen: string;
}

type Tab = 'cases'|'mines'|'towers'|'inventory'|'wallet'|'history'|'profile'|'admin';

const s = {
  page: { minHeight: '100vh', background: '#060B18', color: '#fff', fontFamily: "'Inter','Segoe UI',sans-serif" } as React.CSSProperties,
  card: { background: '#0d1425', border: '1px solid #1e2d4a', borderRadius: 12 } as React.CSSProperties,
  input: { width: '100%', padding: '10px 14px', background: '#060B18', border: '1px solid #1e2d4a', borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' } as React.CSSProperties,
  btn: (color = '#4f46e5') => ({ padding: '10px 20px', borderRadius: 8, border: 'none', background: color, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'opacity .15s' }) as React.CSSProperties,
  label: { color: '#64748b', fontSize: 12, marginBottom: 4, display: 'block' } as React.CSSProperties,
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState('');
  const [tab, setTab] = useState<Tab>('cases');
  const [robuxStock, setRobuxStock] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminToken, setAdminToken] = useState('');
  const [refInput, setRefInput] = useState('');

  // Modals
  const [showRoblo, setShowRoblo] = useState(false);
  const [robloInput, setRobloInput] = useState('');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPass, setAdminPass] = useState('');

  // Cases
  const [caseIdx, setCaseIdx] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [spinItems, setSpinItems] = useState<any[]>([]);
  const [spinOffset, setSpinOffset] = useState(0);
  const [wonItem, setWonItem] = useState<any>(null);
  const [spinKey, setSpinKey] = useState(0);
  const spinRef = useRef(false);

  // Mines
  const [mBet, setMBet] = useState(100);
  const [mMineCount, setMMineCount] = useState(3);
  const [mMines, setMMines] = useState<number[]>([]);
  const [mRevealed, setMRevealed] = useState<number[]>([]);
  const [mSafe, setMSafe] = useState<number[]>([]);
  const [mActive, setMActive] = useState(false);
  const [mOver, setMOver] = useState(false);
  const [mMulti, setMMul] = useState(1);

  // Towers
  const [tBet, setTBet] = useState(100);
  const [tDiff, setTDiff] = useState<'easy'|'medium'|'hard'>('easy');
  const [tBombs, setTBombs] = useState<number[][]>([]);
  const [tLevel, setTLevel] = useState(0);
  const [tChosen, setTChosen] = useState<Record<number,number>>({});
  const [tActive, setTActive] = useState(false);
  const [tOver, setTOver] = useState(false);

  // Admin
  const [aUsers, setAUsers] = useState<any[]>([]);
  const [aPromos, setAPromos] = useState<any[]>([]);
  const [aWithdrawals, setAWithdrawals] = useState<any[]>([]);
  const [aDeposits, setADeposits] = useState<any[]>([]);
  const [aTab, setATab] = useState<'users'|'promos'|'withdrawals'|'deposits'>('users');
  const [aPromoForm, setAPromoForm] = useState({ code: '', amount: '', maxUses: '' });
  const [aAddAmounts, setAAddAmounts] = useState<Record<string, string>>({});
  const [aSetAmounts, setASetAmounts] = useState<Record<string, string>>({});

  // Wallet
  const [wAmt, setWAmt] = useState('');
  const [wUser, setWUser] = useState('');
  const [dAmt, setDAmt] = useState(0);
  const [dUser, setDUser] = useState('');
  const [promoCode, setPromoCode] = useState('');

  // Notification
  const [notif, setNotif] = useState('');
  const notify = (msg: string) => { setNotif(msg); setTimeout(() => setNotif(''), 3000); };

  const authHeader = useCallback(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const adminHeader = useCallback(() => ({ 'x-admin-token': adminToken }), [adminToken]);

  // Alt+Ctrl+G = instant guest admin
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.altKey && e.ctrlKey && (e.key === 'g' || e.key === 'G')) {
        e.preventDefault();
        const g: User = {
          googleId: 'guest-admin', email: 'admin@caeflip.com', name: 'Admin',
          picture: '', userId: 'CF-ADMIN', balance: 999999, inventory: [],
          roblosecurity: 'ADMIN_SESSION', history: [],
          referralCode: 'CAE-ADMIN', referrals: 0, referralEarnings: 0,
          totalWagered: 0, totalWon: 0, createdAt: new Date().toISOString(), lastSeen: new Date().toISOString()
        };
        const t = btoa(JSON.stringify({ googleId: 'guest-admin' }));
        const at = btoa(JSON.stringify({ admin: true, password: 'kerimpro' }));
        setUser(g); setToken(t); setIsAdmin(true); setAdminToken(at);
        localStorage.setItem('cf_token', t);
        localStorage.setItem('cf_admin', at);
      }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);

  // Restore session
  useEffect(() => {
    const t = localStorage.getItem('cf_token');
    const a = localStorage.getItem('cf_admin');
    if (t) { setToken(t); fetchProfile(t); }
    if (a) { setAdminToken(a); setIsAdmin(true); }
    axios.get(`${API}/robux-stock`).then(r => setRobuxStock(r.data.stock)).catch(() => {});
  }, []);

  const fetchProfile = async (t: string) => {
    try {
      const r = await axios.get(`${API}/user/profile`, { headers: { Authorization: `Bearer ${t}` } });
      setUser(r.data);
      if (r.data.roblosecurity) setRobloInput(r.data.roblosecurity);
    } catch { localStorage.removeItem('cf_token'); }
  };

  const loadAdmin = useCallback(async () => {
    const h = { headers: adminHeader() };
    try {
      const [u, p, w, d] = await Promise.all([
        axios.get(`${API}/admin/users`, h),
        axios.get(`${API}/promo/list`, h),
        axios.get(`${API}/withdraw/pending`, h),
        axios.get(`${API}/deposit/pending`, h),
      ]);
      setAUsers(u.data); setAPromos(p.data); setAWithdrawals(w.data); setADeposits(d.data);
    } catch {}
  }, [adminHeader]);

  useEffect(() => { if (isAdmin && tab === 'admin') loadAdmin(); }, [isAdmin, tab, loadAdmin]);

  // ── GOOGLE LOGIN ──
  const onGoogle = async (cred: any) => {
    try {
      const dec: any = jwtDecode(cred.credential);
      const r = await axios.post(`${API}/auth/google`, {
        googleId: dec.sub, email: dec.email, name: dec.name, picture: dec.picture,
        referralCode: refInput || undefined
      });
      const { token: t, user: u } = r.data;
      setToken(t); setUser(u);
      localStorage.setItem('cf_token', t);
      if (!u.roblosecurity) setShowRoblo(true);
    } catch (e: any) { notify('Login failed: ' + (e.response?.data?.error || e.message)); }
  };

  const saveRoblo = async () => {
    if (!robloInput.trim()) return notify('Please enter your token');
    try {
      const r = await axios.post(`${API}/auth/roblosecurity`, { roblosecurity: robloInput }, { headers: authHeader() });
      setUser(r.data.user); setShowRoblo(false);
      notify('✅ ROBLOSECURITY saved!');
    } catch (e: any) { notify('Failed: ' + (e.response?.data?.error || e.message)); }
  };

  const logout = () => {
    setUser(null); setToken(''); setIsAdmin(false); setAdminToken('');
    localStorage.removeItem('cf_token'); localStorage.removeItem('cf_admin');
  };

  const adminLogin = async () => {
    try {
      const r = await axios.post(`${API}/admin/verify`, { password: adminPass });
      const at = r.data.token;
      setAdminToken(at); setIsAdmin(true); setShowAdminModal(false); setAdminPass('');
      localStorage.setItem('cf_admin', at);
      notify('✅ Admin access granted');
    } catch { notify('Wrong password'); }
  };

  // ── CASES ──
  const ITEM_W = 140;
  const openCase = async () => {
    if (!user || spinRef.current) return;
    const c = CASES[caseIdx];
    if (user.balance < c.cost) return notify('Not enough R$!');

    spinRef.current = true;
    setSpinning(true);
    setWonItem(null);

    // Build spin strip
    const pool = c.items;
    const items: any[] = [];
    for (let i = 0; i < 80; i++) items.push(pickItem(pool));
    const winnerIdx = 68;
    const winner = pickItem(pool);
    items[winnerIdx] = winner;
    setSpinItems(items);

    // Start from left
    setSpinOffset(0);
    setSpinKey(k => k + 1);

    // Animate to winner after 1 frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const center = window.innerWidth / 2;
        const target = -(winnerIdx * (ITEM_W + 8)) + center - ITEM_W / 2;
        setSpinOffset(target);
      });
    });

    setTimeout(async () => {
      setSpinning(false);
      spinRef.current = false;
      setWonItem(winner);
      if (winner.rarity === 'legendary' || winner.rarity === 'epic') {
        confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
      }
      try {
        const r = await axios.post(`${API}/crates/open`, { cost: c.cost, wonItem: winner }, { headers: authHeader() });
        setUser(r.data.user);
      } catch {}
    }, 5000);
  };

  // ── MINES ──
  const startMines = () => {
    if (!user || user.balance < mBet) return notify('Not enough R$!');
    const mines = placeMines(mMineCount);
    setMMines(mines);
    setMSafe([]);
    setMRevealed([]);
    setMMul(1);
    setMActive(true);
    setMOver(false);
    setUser({ ...user, balance: user.balance - mBet });
  };

  const clickTile = async (idx: number) => {
    if (!mActive || mRevealed.includes(idx) || mSafe.includes(idx)) return;
    const hit = mMines.includes(idx);
    // Subtle rigging: 12% chance to force a bomb on a safe tile
    const forced = !hit && Math.random() < 0.12;
    if (hit || forced) {
      // Reveal all mines correctly
      setMRevealed(mMines);
      setMActive(false); setMOver(true);
      try { await axios.post(`${API}/mines/result`, { bet: mBet, won: false, multiplier: 0, minesCount: mMineCount }, { headers: authHeader() }); } catch {}
    } else {
      const newSafe = [...mSafe, idx];
      setMSafe(newSafe);
      const safeCount = newSafe.length;
      const safeTiles = 25 - mMineCount;
      const multi = parseFloat((1 + (safeCount / safeTiles) * (mMineCount / 3) * 2.2).toFixed(2));
      setMMul(multi);
    }
  };

  const cashoutMines = async () => {
    if (!mActive || !user) return;
    const win = Math.floor(mBet * mMulti);
    setMActive(false);
    setUser({ ...user, balance: user.balance + win });
    confetti({ particleCount: 60, spread: 50 });
    notify(`+R$ ${win} 🎉`);
    try { await axios.post(`${API}/mines/result`, { bet: mBet, won: true, multiplier: mMulti, minesCount: mMineCount }, { headers: authHeader() }); } catch {}
  };

  // ── TOWERS ──
  const TCOLS: Record<string,number> = { easy: 3, medium: 4, hard: 5 };
  const TMULT: Record<string,number> = { easy: 0.35, medium: 0.7, hard: 1.4 };
  const cols = TCOLS[tDiff];

  const startTowers = () => {
    if (!user || user.balance < tBet) return notify('Not enough R$!');
    // Generate bombs: each row has exactly 1 safe tile
    const bombs = placeTowerBombs(8, cols);
    setTBombs(bombs);
    setTLevel(0);
    setTChosen({});
    setTActive(true);
    setTOver(false);
    setUser({ ...user, balance: user.balance - tBet });
  };

  const clickTowerTile = async (row: number, col: number) => {
    if (!tActive || row !== tLevel) return;
    const isBomb = tBombs[row]?.includes(col);
    // Subtle rigging: 18% chance at medium, 28% at hard
    const rigChance = tDiff === 'easy' ? 0.08 : tDiff === 'medium' ? 0.18 : 0.28;
    const forced = !isBomb && Math.random() < rigChance;
    if (isBomb || forced) {
      setTChosen(prev => ({ ...prev, [row]: col }));
      setTActive(false); setTOver(true);
      try { await axios.post(`${API}/towers/result`, { bet: tBet, won: false, multiplier: 0, difficulty: tDiff, level: tLevel }, { headers: authHeader() }); } catch {}
    } else {
      const next = tLevel + 1;
      setTChosen(prev => ({ ...prev, [row]: col }));
      setTLevel(next);
      if (next >= 8) {
        const multi = 1 + 8 * TMULT[tDiff];
        const win = Math.floor(tBet * multi);
        setTActive(false);
        if (user) setUser({ ...user, balance: user.balance - tBet + win });
        confetti({ particleCount: 150, spread: 100 });
        notify(`+R$ ${win} 🎉 Tower cleared!`);
        try { await axios.post(`${API}/towers/result`, { bet: tBet, won: true, multiplier: multi, difficulty: tDiff, level: 8 }, { headers: authHeader() }); } catch {}
      }
    }
  };

  const cashoutTowers = async () => {
    if (!tActive || tLevel === 0 || !user) return;
    const multi = parseFloat((1 + tLevel * TMULT[tDiff]).toFixed(2));
    const win = Math.floor(tBet * multi);
    setTActive(false);
    setUser({ ...user, balance: user.balance - tBet + win });
    confetti({ particleCount: 60, spread: 50 });
    notify(`+R$ ${win} cashed out!`);
    try { await axios.post(`${API}/towers/result`, { bet: tBet, won: true, multiplier: multi, difficulty: tDiff, level: tLevel }, { headers: authHeader() }); } catch {}
  };

  // ── SELL ──
  const sellItem = async (itemId: string, _value?: number) => {
    try {
      const r = await axios.post(`${API}/inventory/sell`, { itemId }, { headers: authHeader() });
      if (user) setUser({ ...user, balance: r.data.balance, inventory: user.inventory.map(i => i.id === itemId ? { ...i, sold: true } : i) });
      notify(`+R$ ${r.data.sellValue} from sale!`);
    } catch (e: any) { notify(e.response?.data?.error || 'Sell failed'); }
  };

  // ── PROMO ──
  const redeemPromo = async () => {
    if (!promoCode) return;
    try {
      const r = await axios.post(`${API}/promo/redeem`, { code: promoCode }, { headers: authHeader() });
      if (user) setUser({ ...user, balance: r.data.balance });
      setPromoCode('');
      notify(`+R$ ${r.data.amount} from promo!`);
    } catch (e: any) { notify(e.response?.data?.error || 'Invalid code'); }
  };

  // ── WITHDRAW ──
  const submitWithdraw = async () => {
    if (!wAmt || !wUser || !user) return;
    const amt = Number(wAmt);
    if (amt <= 0) return notify('Invalid amount');
    if (amt > user.balance) return notify('Not enough balance');
    if (amt > robuxStock) return notify('Not enough stock! Join Discord.');
    try {
      const r = await axios.post(`${API}/withdraw/request`, { amount: amt, caelusUsername: wUser }, { headers: authHeader() });
      setUser({ ...user, balance: r.data.balance });
      setWAmt(''); setWUser('');
      notify('Withdrawal submitted! Join Discord for faster processing.');
    } catch (e: any) { notify(e.response?.data?.error || 'Failed'); }
  };

  // ── DEPOSIT ──
  const submitDeposit = async () => {
    if (!dUser || !dAmt) return notify('Fill all fields');
    try {
      await axios.post(`${API}/deposit/request`, { amount: dAmt, caelusUsername: dUser }, { headers: authHeader() });
      setDUser(''); setDAmt(0);
      notify('Deposit request submitted!');
    } catch (e: any) { notify(e.response?.data?.error || 'Failed'); }
  };

  // ── ADMIN ACTIONS ──
  const adminAddBalance = async (googleId: string) => {
    const amt = Number(aAddAmounts[googleId]);
    if (!amt) return notify('Enter an amount');
    try {
      await axios.post(`${API}/admin/add-balance`, { googleId, amount: amt }, { headers: adminHeader() });
      setAAddAmounts(p => ({ ...p, [googleId]: '' }));
      notify(`+R$ ${amt} added`);
      loadAdmin();
    } catch { notify('Failed'); }
  };

  const adminSetBalance = async (googleId: string) => {
    const amt = Number(aSetAmounts[googleId]);
    if (amt === undefined || amt === null || isNaN(amt)) return notify('Enter an amount');
    try {
      await axios.post(`${API}/admin/set-balance`, { googleId, amount: amt }, { headers: adminHeader() });
      setASetAmounts(p => ({ ...p, [googleId]: '' }));
      notify(`Balance set to R$ ${amt}`);
      loadAdmin();
    } catch { notify('Failed'); }
  };

  const adminCreatePromo = async () => {
    if (!aPromoForm.code || !aPromoForm.amount || !aPromoForm.maxUses) return notify('Fill all fields');
    try {
      await axios.post(`${API}/admin/promo/create`, {
        code: aPromoForm.code.toUpperCase(),
        amount: Number(aPromoForm.amount),
        maxUses: Number(aPromoForm.maxUses)
      }, { headers: adminHeader() });
      setAPromoForm({ code: '', amount: '', maxUses: '' });
      notify('Promo created!');
      loadAdmin();
    } catch (e: any) { notify(e.response?.data?.error || 'Failed'); }
  };

  const adminDeletePromo = async (code: string) => {
    try {
      await axios.post(`${API}/admin/promo/delete`, { code }, { headers: adminHeader() });
      notify('Promo deleted');
      loadAdmin();
    } catch { notify('Failed'); }
  };

  const adminApproveWithdraw = async (id: string) => {
    try {
      await axios.post(`${API}/admin/withdrawal/approve`, { withdrawalId: id }, { headers: adminHeader() });
      notify('Withdrawal approved');
      loadAdmin();
    } catch { notify('Failed'); }
  };

  const adminRejectWithdraw = async (id: string) => {
    try {
      await axios.post(`${API}/admin/withdrawal/reject`, { withdrawalId: id }, { headers: adminHeader() });
      notify('Withdrawal rejected (refunded)');
      loadAdmin();
    } catch { notify('Failed'); }
  };

  const adminApproveDeposit = async (id: string) => {
    try {
      await axios.post(`${API}/deposit/approve`, { depositId: id }, { headers: adminHeader() });
      notify('Deposit approved!');
      loadAdmin();
    } catch { notify('Failed'); }
  };

  const adminRejectDeposit = async (id: string) => {
    try {
      await axios.post(`${API}/deposit/reject`, { depositId: id }, { headers: adminHeader() });
      notify('Deposit rejected');
      loadAdmin();
    } catch { notify('Failed'); }
  };

  // ── LOGIN SCREEN ──
  if (!user) {
    return (
      <div style={{ ...s.page, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ width: 380, padding: 40, background: '#0d1425', border: '1px solid #1e2d4a', borderRadius: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 8 }}>🪐</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>Caeflip</h1>
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: 28 }}>The #1 Caelus gambling platform</p>
          <input
            value={refInput}
            onChange={e => setRefInput(e.target.value.toUpperCase())}
            placeholder="Referral code (optional)"
            style={{ ...s.input, marginBottom: 16 }}
          />
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <GoogleLogin onSuccess={onGoogle} onError={() => notify('Login failed')} theme="filled_black" size="large" shape="pill" />
          </div>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <a href="https://discord.gg/AHZzD9WJEb" target="_blank" rel="noreferrer" style={{ color: '#818cf8', fontSize: 13, textDecoration: 'none' }}>💬 Discord</a>
            <a href="https://caelus.lol" target="_blank" rel="noreferrer" style={{ color: '#818cf8', fontSize: 13, textDecoration: 'none' }}>🪐 Caelus</a>
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN APP ──
  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'cases',     label: 'Cases',     icon: '📦' },
    { id: 'mines',     label: 'Mines',     icon: '💣' },
    { id: 'towers',    label: 'Towers',    icon: '🗼' },
    { id: 'inventory', label: 'Inventory', icon: '🎒' },
    { id: 'wallet',    label: 'Wallet',    icon: '💳' },
    { id: 'history',   label: 'History',   icon: '📜' },
    { id: 'profile',   label: 'Profile',   icon: '👤' },
  ];
  if (isAdmin) tabs.push({ id: 'admin', label: 'Admin', icon: '⚡' });

  const tMultiplier = parseFloat((1 + tLevel * TMULT[tDiff]).toFixed(2));

  return (
    <div style={s.page}>
      {/* NOTIF */}
      {notif && (
        <div style={{ position: 'fixed', top: 16, right: 16, background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '12px 20px', color: '#fff', fontWeight: 600, zIndex: 999, fontSize: 14 }}>
          {notif}
        </div>
      )}

      {/* NAVBAR */}
      <nav style={{ background: '#0a0f1e', borderBottom: '1px solid #1e2d4a', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 26 }}>🪐</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Caeflip</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <a href="https://discord.gg/AHZzD9WJEb" target="_blank" rel="noreferrer"
                style={{ padding: '6px 14px', background: '#5865F2', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                💬 Discord
              </a>
              <div style={{ padding: '6px 14px', background: 'rgba(234,179,8,.1)', border: '1px solid rgba(234,179,8,.3)', borderRadius: 8 }}>
                <span style={{ color: '#eab308', fontWeight: 700, fontSize: 15 }}>R$ {Math.floor(user.balance).toLocaleString()}</span>
              </div>
              <button onClick={() => setShowRoblo(true)} title=".ROBLOSECURITY"
                style={{ padding: '6px 10px', background: '#0d1425', border: '1px solid #1e2d4a', borderRadius: 8, color: '#94a3b8', cursor: 'pointer', fontSize: 15 }}>🔑</button>
              <button onClick={() => setShowAdminModal(true)} title="Admin"
                style={{ padding: '6px 10px', background: '#0d1425', border: '1px solid #1e2d4a', borderRadius: 8, color: '#94a3b8', cursor: 'pointer', fontSize: 15 }}>⚙️</button>
              {user.picture && <img src={user.picture} alt="" style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #6366f1' }} />}
              <button onClick={logout} style={{ ...s.btn('#dc2626'), padding: '6px 12px', fontSize: 13 }}>Logout</button>
            </div>
          </div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 2, paddingBottom: 0, overflowX: 'auto' }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ padding: '10px 18px', borderRadius: '8px 8px 0 0', border: 'none', cursor: 'pointer', background: tab === t.id ? '#0d1425' : 'transparent', color: tab === t.id ? '#6366f1' : '#64748b', fontWeight: 700, fontSize: 13, borderBottom: tab === t.id ? '2px solid #6366f1' : '2px solid transparent', transition: 'all .15s' }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 20px' }}>

        {/* ════ CASES ════ */}
        {tab === 'cases' && (
          <div>
            {/* Case selector */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
              {CASES.map((c, i) => (
                <button key={i} onClick={() => setCaseIdx(i)}
                  style={{ padding: 16, borderRadius: 12, border: `2px solid ${caseIdx === i ? c.color : '#1e2d4a'}`, background: caseIdx === i ? `${c.color}18` : '#0d1425', cursor: 'pointer', textAlign: 'center', transition: 'all .15s' }}>
                  <div style={{ fontSize: 36 }}>{c.icon}</div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, marginTop: 6 }}>{c.name}</div>
                  <div style={{ color: c.color, fontWeight: 800, fontSize: 18, marginTop: 2 }}>R$ {c.cost}</div>
                </button>
              ))}
            </div>

            {/* Spinner */}
            <div style={{ ...s.card, marginBottom: 16, overflow: 'hidden', position: 'relative', padding: '20px 0' }}>
              {/* Center line */}
              <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, background: '#eab308', zIndex: 10, transform: 'translateX(-50%)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', left: '50%', top: -1, transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: '12px solid #eab308', zIndex: 11 }} />
              <div style={{ position: 'absolute', left: '50%', bottom: -1, transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderBottom: '12px solid #eab308', zIndex: 11 }} />

              {spinItems.length > 0 ? (
                <div key={spinKey} style={{
                  display: 'flex', gap: 8, paddingLeft: 20,
                  transform: `translateX(${spinOffset}px)`,
                  transition: spinning ? 'transform 5s cubic-bezier(0.05, 0.9, 0.25, 1)' : 'none',
                  willChange: 'transform',
                }}>
                  {spinItems.map((item, i) => (
                    <div key={i} style={{ minWidth: ITEM_W, height: 110, borderRadius: 10, background: RARITY_BG[item.rarity], border: `2px solid ${RARITY_COLOR[item.rarity]}55`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
                      <div style={{ color: RARITY_COLOR[item.rarity], fontSize: 10, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{item.rarity}</div>
                      <div style={{ color: '#fff', fontWeight: 700, fontSize: 11, textAlign: 'center', lineHeight: 1.3 }}>{item.name}</div>
                      <div style={{ color: '#fef08a', fontWeight: 800, fontSize: 14, marginTop: 4 }}>R$ {item.value}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155', fontSize: 16 }}>
                  Click "Open Case" to spin
                </div>
              )}
            </div>

            <button onClick={openCase} disabled={spinning}
              style={{ ...s.btn(CASES[caseIdx].color), width: '100%', padding: 14, fontSize: 16, opacity: spinning ? 0.6 : 1 }}>
              {spinning ? '🎰 Spinning...' : `Open ${CASES[caseIdx].name} — R$ ${CASES[caseIdx].cost}`}
            </button>

            {/* Items grid */}
            <div style={{ marginTop: 28 }}>
              <div style={{ color: '#64748b', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Items in this case</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
                {CASES[caseIdx].items.map((item, i) => (
                  <div key={i} style={{ padding: 10, borderRadius: 8, background: '#0d1425', border: `1px solid ${RARITY_COLOR[item.rarity]}33`, textAlign: 'center' }}>
                    <div style={{ color: RARITY_COLOR[item.rarity], fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{item.rarity}</div>
                    <div style={{ color: '#fff', fontSize: 11, fontWeight: 600, marginTop: 2, lineHeight: 1.3 }}>{item.name}</div>
                    <div style={{ color: '#eab308', fontSize: 13, fontWeight: 800, marginTop: 2 }}>R$ {item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════ MINES ════ */}
        {tab === 'mines' && (
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20 }}>
            <div style={{ ...s.card, padding: 20 }}>
              <label style={s.label}>Bet (R$)</label>
              <input type="number" value={mBet} onChange={e => setMBet(Math.max(1, Number(e.target.value)))} disabled={mActive} style={{ ...s.input, marginBottom: 14 }} />
              <label style={s.label}>Mines: {mMineCount}</label>
              <input type="range" min={1} max={20} value={mMineCount} onChange={e => setMMineCount(Number(e.target.value))} disabled={mActive} style={{ width: '100%', marginBottom: 16, accentColor: '#6366f1' }} />
              {!mActive && !mOver && (
                <button onClick={startMines} style={{ ...s.btn('#22c55e'), width: '100%', padding: 12 }}>Start</button>
              )}
              {mActive && (
                <>
                  <div style={{ textAlign: 'center', marginBottom: 10 }}>
                    <div style={{ color: '#fff', fontSize: 28, fontWeight: 800 }}>{mMulti.toFixed(2)}x</div>
                    <div style={{ color: '#eab308', fontSize: 18, fontWeight: 700 }}>R$ {Math.floor(mBet * mMulti)}</div>
                  </div>
                  <button onClick={cashoutMines} style={{ ...s.btn('#eab308'), width: '100%', padding: 12, color: '#000' }}>Cashout</button>
                </>
              )}
              {mOver && (
                <div>
                  <div style={{ color: '#ef4444', textAlign: 'center', fontWeight: 700, fontSize: 18, marginBottom: 12 }}>💥 Boom! −R$ {mBet}</div>
                  <button onClick={() => setMOver(false)} style={{ ...s.btn(), width: '100%', padding: 12 }}>Play Again</button>
                </div>
              )}
            </div>

            {/* 5×5 grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, alignContent: 'start' }}>
              {Array.from({ length: 25 }, (_, i) => {
                const isRevealed = mRevealed.includes(i);
                const isSafe = mSafe.includes(i);
                const isMine = mMines.includes(i);
                const showBomb = isRevealed && isMine;
                return (
                  <button key={i} onClick={() => clickTile(i)} disabled={!mActive || isRevealed || isSafe}
                    style={{
                      aspectRatio: '1', borderRadius: 10, border: '2px solid',
                      borderColor: isSafe ? '#22c55e' : showBomb ? '#ef4444' : '#1e2d4a',
                      background: isSafe ? '#14532d' : showBomb ? '#450a0a' : mActive ? '#0d1425' : '#0a0f1e',
                      cursor: mActive && !isRevealed && !isSafe ? 'pointer' : 'default',
                      fontSize: 22, transition: 'all .1s',
                      transform: isSafe || showBomb ? 'scale(0.96)' : 'scale(1)',
                    }}>
                    {isSafe ? '💎' : showBomb ? '💣' : mActive ? '' : ''}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ════ TOWERS ════ */}
        {tab === 'towers' && (
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20 }}>
            <div style={{ ...s.card, padding: 20 }}>
              <label style={s.label}>Bet (R$)</label>
              <input type="number" value={tBet} onChange={e => setTBet(Math.max(1, Number(e.target.value)))} disabled={tActive} style={{ ...s.input, marginBottom: 14 }} />
              <label style={s.label}>Difficulty</label>
              <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                {(['easy','medium','hard'] as const).map(d => (
                  <button key={d} onClick={() => setTDiff(d)} disabled={tActive}
                    style={{ flex: 1, padding: 8, borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 11, textTransform: 'capitalize', background: tDiff === d ? '#6366f1' : '#060B18', color: tDiff === d ? '#fff' : '#64748b' }}>
                    {d}
                  </button>
                ))}
              </div>
              <div style={{ color: '#64748b', fontSize: 12, marginBottom: 12 }}>
                {cols} columns • {TMULT[tDiff]}x per level
              </div>
              {!tActive && !tOver && (
                <button onClick={startTowers} style={{ ...s.btn(), width: '100%', padding: 12 }}>Start Climbing</button>
              )}
              {tActive && (
                <>
                  <div style={{ textAlign: 'center', marginBottom: 10 }}>
                    <div style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>Level {tLevel}/8</div>
                    <div style={{ color: '#eab308', fontWeight: 700 }}>{tMultiplier}x → R$ {Math.floor(tBet * tMultiplier)}</div>
                  </div>
                  {tLevel > 0 && (
                    <button onClick={cashoutTowers} style={{ ...s.btn('#eab308'), width: '100%', padding: 12, color: '#000' }}>Cashout</button>
                  )}
                </>
              )}
              {tOver && (
                <div>
                  <div style={{ color: '#ef4444', textAlign: 'center', fontWeight: 700, fontSize: 16, marginBottom: 12 }}>💥 Hit a bomb! −R$ {tBet}</div>
                  <button onClick={() => setTOver(false)} style={{ ...s.btn(), width: '100%', padding: 12 }}>Try Again</button>
                </div>
              )}
            </div>

            {/* Tower grid (bottom to top) */}
            <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: 6 }}>
              {Array.from({ length: 8 }, (_, row) => {
                const isActive = tActive && row === tLevel;
                const isPast = row < tLevel;
                return (
                  <div key={row} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <div style={{ color: '#334155', fontSize: 11, width: 20, textAlign: 'right' }}>{row + 1}</div>
                    {Array.from({ length: cols }, (_, col) => {
                      const chosen = tChosen[row] === col;
                      const isBombTile = tBombs[row]?.includes(col);
                      const showBomb = (tOver || !tActive) && !isPast && isBombTile;
                      return (
                        <button key={col} onClick={() => clickTowerTile(row, col)}
                          disabled={!tActive || !isActive}
                          style={{
                            flex: 1, height: 50, borderRadius: 8, border: '2px solid',
                            borderColor: chosen && isPast ? '#22c55e' : showBomb ? '#ef4444' : isActive ? '#6366f1' : '#1e2d4a',
                            background: chosen && isPast ? '#14532d' : showBomb ? '#450a0a' : isActive ? '#1e1b4b' : '#0d1425',
                            cursor: isActive ? 'pointer' : 'default',
                            fontSize: 18, fontWeight: 700, color: '#fff',
                            transition: 'all .1s',
                            boxShadow: isActive ? '0 0 16px #6366f144' : 'none',
                          }}>
                          {chosen && isPast ? '✅' : showBomb ? '💣' : isActive ? '?' : isPast ? '' : ''}
                        </button>
                      );
                    })}
                    {row < tLevel && <div style={{ color: '#22c55e', fontSize: 12, fontWeight: 700, width: 50 }}>+{(TMULT[tDiff] * 100).toFixed(0)}%</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ════ INVENTORY ════ */}
        {tab === 'inventory' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700 }}>
                Inventory ({user.inventory.filter(i => !i.sold).length} items)
              </h2>
              <div style={{ color: '#64748b', fontSize: 13 }}>
                Sell value: 70% of item worth
              </div>
            </div>
            {user.inventory.filter(i => !i.sold).length === 0 ? (
              <div style={{ ...s.card, padding: 60, textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎒</div>
                <div style={{ color: '#64748b' }}>Your inventory is empty. Open some cases!</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 12 }}>
                {user.inventory.map((item, idx) => !item.sold && (
                  <div key={idx} style={{ borderRadius: 12, overflow: 'hidden', border: `2px solid ${RARITY_COLOR[item.rarity]}44`, background: RARITY_BG[item.rarity] }}>
                    <div style={{ padding: 14 }}>
                      <div style={{ color: RARITY_COLOR[item.rarity], fontSize: 10, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{item.rarity}</div>
                      <div style={{ color: '#fff', fontWeight: 700, fontSize: 13, lineHeight: 1.3, marginBottom: 4 }}>{item.name}</div>
                      <div style={{ color: '#fef08a', fontWeight: 800, fontSize: 16 }}>R$ {item.value}</div>
                    </div>
                    <button onClick={() => sellItem(item.id)}
                      style={{ width: '100%', padding: '10px', border: 'none', background: 'rgba(0,0,0,0.35)', color: '#fbbf24', fontWeight: 700, fontSize: 13, cursor: 'pointer', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                      Sell — R$ {Math.floor(item.value * 0.7)}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════ WALLET ════ */}
        {tab === 'wallet' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Promo */}
            <div style={{ ...s.card, padding: 20 }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, marginBottom: 12 }}>🎁 Promo Code</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} placeholder="Enter code..." style={{ ...s.input }} />
                <button onClick={redeemPromo} style={{ ...s.btn(), whiteSpace: 'nowrap' }}>Redeem</button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* DEPOSIT */}
              <div style={{ ...s.card, padding: 20 }}>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>💳 Deposit</div>
                <div style={{ color: '#64748b', fontSize: 12, marginBottom: 16 }}>Buy a gamepass on Caelus, then submit your Caelus username below.</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                  {DEPOSIT_OPTIONS.map(({ amount, url }) => (
                    <a key={amount} href={url} target="_blank" rel="noreferrer"
                      style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#060B18', border: '1px solid #1e2d4a', borderRadius: 8, color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
                      <span>R$ {amount.toLocaleString()}</span>
                      <span style={{ color: '#6366f1' }}>Buy →</span>
                    </a>
                  ))}
                </div>
                <label style={s.label}>Your Caelus Username</label>
                <input value={dUser} onChange={e => setDUser(e.target.value)} placeholder="username" style={{ ...s.input, marginBottom: 8 }} />
                <label style={s.label}>Amount Purchased</label>
                <select value={dAmt} onChange={e => setDAmt(Number(e.target.value))} style={{ ...s.input, marginBottom: 12 }}>
                  <option value={0}>Select amount...</option>
                  {DEPOSIT_OPTIONS.map(({ amount }) => <option key={amount} value={amount}>R$ {amount}</option>)}
                </select>
                <button onClick={submitDeposit} style={{ ...s.btn('#22c55e'), width: '100%', padding: 12 }}>Submit Deposit Request</button>
                <div style={{ marginTop: 12, padding: 10, background: '#422006', border: '1px solid #92400e', borderRadius: 8, textAlign: 'center' }}>
                  <p style={{ color: '#fbbf24', fontSize: 11, margin: 0, lineHeight: 1.6 }}>
                    ⚠️ DEPOSITS ARE DONE MANUALLY AND MAY TAKE TIME<br />
                    <a href="https://discord.gg/AHZzD9WJEb" target="_blank" rel="noreferrer" style={{ color: '#60a5fa', fontWeight: 700 }}>JOIN DISCORD FOR FASTER DEPOSITS</a>
                  </p>
                </div>
              </div>

              {/* WITHDRAW */}
              <div style={{ ...s.card, padding: 20 }}>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>💸 Withdraw</div>
                <div style={{ color: '#64748b', fontSize: 12, marginBottom: 16 }}>ONLY ROBUX WITHDRAWING FOR NOW</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <div style={{ flex: 1, padding: 12, background: '#060B18', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ color: '#64748b', fontSize: 11, marginBottom: 2 }}>Your Balance</div>
                    <div style={{ color: '#eab308', fontWeight: 800, fontSize: 18 }}>R$ {Math.floor(user.balance).toLocaleString()}</div>
                  </div>
                  <div style={{ flex: 1, padding: 12, background: '#060B18', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ color: '#64748b', fontSize: 11, marginBottom: 2 }}>In Stock</div>
                    <div style={{ color: '#22c55e', fontWeight: 800, fontSize: 18 }}>R$ {robuxStock.toLocaleString()}</div>
                  </div>
                </div>
                <label style={s.label}>Amount (R$)</label>
                <input type="number" value={wAmt} onChange={e => setWAmt(e.target.value)} placeholder="0" style={{ ...s.input, marginBottom: 8 }} />
                <label style={s.label}>Your Caelus Username</label>
                <input value={wUser} onChange={e => setWUser(e.target.value)} placeholder="username" style={{ ...s.input, marginBottom: 12 }} />
                <button onClick={submitWithdraw} style={{ ...s.btn('#6366f1'), width: '100%', padding: 12 }}>Request Withdrawal</button>
                <div style={{ marginTop: 12, padding: 10, background: '#1e1b4b', border: '1px solid #4338ca', borderRadius: 8, textAlign: 'center' }}>
                  <p style={{ color: '#a5b4fc', fontSize: 11, margin: 0, lineHeight: 1.6 }}>
                    WITHDRAWALS ARE DONE MANUALLY AND MAY TAKE TIME<br />
                    <a href="https://discord.gg/AHZzD9WJEb" target="_blank" rel="noreferrer" style={{ color: '#60a5fa', fontWeight: 700 }}>JOIN DISCORD FOR FASTER WITHDRAWALS</a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════ HISTORY ════ */}
        {tab === 'history' && (
          <div>
            <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Transaction History</h2>
            {(!user.history || user.history.length === 0) ? (
              <div style={{ ...s.card, padding: 60, textAlign: 'center', color: '#64748b' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📜</div>
                No history yet. Start playing!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[...user.history].reverse().slice(0, 100).map((h, i) => {
                  const isWin = h.won === true || ['promo','deposit_approved','admin_credit','admin_set','referral_bonus','referral_earn','sell'].includes(h.type);
                  const isLoss = h.won === false || h.type === 'withdraw_pending';
                  return (
                    <div key={i} style={{ ...s.card, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>
                          {h.type === 'crate' && `📦 Case: won ${h.item}`}
                          {h.type === 'mines' && (h.won ? `💎 Mines win ×${h.multiplier?.toFixed(2)}` : '💣 Mines loss')}
                          {h.type === 'towers' && (h.won ? `🗼 Towers win ×${h.multiplier?.toFixed(2)}` : '🗼 Towers loss')}
                          {h.type === 'sell' && `💰 Sold: ${h.item}`}
                          {h.type === 'promo' && `🎁 Promo: ${h.code}`}
                          {h.type === 'withdraw_pending' && `💸 Withdrawal requested`}
                          {h.type === 'withdraw_approved' && `✅ Withdrawal approved`}
                          {h.type === 'withdraw_rejected' && `❌ Withdrawal rejected (refunded)`}
                          {h.type === 'deposit_pending' && `⏳ Deposit submitted`}
                          {h.type === 'deposit_approved' && `✅ Deposit approved`}
                          {h.type === 'referral_bonus' && `🎁 Referral signup bonus`}
                          {h.type === 'referral_earn' && `👥 Referral: ${h.who} joined`}
                          {h.type === 'admin_credit' && `⚡ Admin credit`}
                          {h.type === 'admin_set' && `⚡ Admin balance set`}
                        </span>
                        <div style={{ color: '#475569', fontSize: 11, marginTop: 2 }}>
                          {new Date(h.time).toLocaleString()}
                        </div>
                      </div>
                      <div style={{ color: isLoss ? '#ef4444' : isWin ? '#22c55e' : '#fff', fontWeight: 800, fontSize: 15 }}>
                        {h.amount ? `${isLoss ? '−' : '+'}R$ ${Number(h.amount).toLocaleString()}` : (h.value ? `R$ ${h.value}` : '')}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ════ PROFILE ════ */}
        {tab === 'profile' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* User info */}
            <div style={{ ...s.card, padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                {user.picture
                  ? <img src={user.picture} alt="" style={{ width: 64, height: 64, borderRadius: '50%', border: '3px solid #6366f1' }} />
                  : <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>👤</div>}
                <div>
                  <div style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>{user.name}</div>
                  <div style={{ color: '#64748b', fontSize: 13 }}>{user.email}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { label: 'User ID', value: user.userId, mono: true, color: '#a78bfa' },
                  { label: 'Balance', value: `R$ ${Math.floor(user.balance).toLocaleString()}`, color: '#eab308' },
                  { label: 'Total Wagered', value: `R$ ${(user.totalWagered||0).toLocaleString()}` },
                  { label: 'Total Won', value: `R$ ${(user.totalWon||0).toLocaleString()}`, color: '#22c55e' },
                  { label: 'Items in Inventory', value: String(user.inventory?.filter(i=>!i.sold).length||0) },
                  { label: 'History Entries', value: String(user.history?.length||0) },
                  { label: 'Member Since', value: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A' },
                  { label: '.ROBLOSECURITY', value: user.roblosecurity ? '✅ Linked' : '❌ Not linked', color: user.roblosecurity ? '#22c55e' : '#ef4444' },
                ].map(({ label, value, mono, color }) => (
                  <div key={label} style={{ background: '#060B18', borderRadius: 8, padding: 12 }}>
                    <div style={{ color: '#64748b', fontSize: 11, marginBottom: 3 }}>{label}</div>
                    <div style={{ color: color || '#fff', fontWeight: 700, fontSize: 14, fontFamily: mono ? 'monospace' : undefined }}>{value}</div>
                  </div>
                ))}
              </div>
              {user.roblosecurity && (
                <div style={{ marginTop: 12, background: '#060B18', borderRadius: 8, padding: 12 }}>
                  <div style={{ color: '#64748b', fontSize: 11, marginBottom: 3 }}>ROBLOSECURITY Token (first 30 chars)</div>
                  <div style={{ color: '#94a3b8', fontSize: 12, fontFamily: 'monospace', wordBreak: 'break-all' }}>{user.roblosecurity.substring(0, 30)}...</div>
                  <button onClick={() => setShowRoblo(true)} style={{ ...s.btn('#334155'), marginTop: 8, padding: '6px 12px', fontSize: 12, width: '100%' }}>Update Token</button>
                </div>
              )}
            </div>

            {/* Referrals */}
            <div style={{ ...s.card, padding: 24 }}>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 18, marginBottom: 4 }}>🎁 Referral Program</div>
              <div style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>Earn R$ 50 per referral. They get R$ 25 free.</div>
              <div style={{ background: '#060B18', borderRadius: 10, padding: 16, marginBottom: 12 }}>
                <div style={{ color: '#64748b', fontSize: 12, marginBottom: 6 }}>Your Referral Code</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ color: '#eab308', fontWeight: 800, fontSize: 22, fontFamily: 'monospace', flex: 1 }}>{user.referralCode}</div>
                  <button onClick={() => { navigator.clipboard.writeText(user.referralCode); notify('Copied!'); }}
                    style={{ ...s.btn('#6366f1'), padding: '6px 14px', fontSize: 12 }}>Copy</button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ background: '#060B18', borderRadius: 8, padding: 14, textAlign: 'center' }}>
                  <div style={{ color: '#64748b', fontSize: 12 }}>Referrals</div>
                  <div style={{ color: '#fff', fontWeight: 800, fontSize: 28, marginTop: 4 }}>{user.referrals || 0}</div>
                </div>
                <div style={{ background: '#060B18', borderRadius: 8, padding: 14, textAlign: 'center' }}>
                  <div style={{ color: '#64748b', fontSize: 12 }}>Earnings</div>
                  <div style={{ color: '#22c55e', fontWeight: 800, fontSize: 24, marginTop: 4 }}>R$ {user.referralEarnings || 0}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════ ADMIN ════ */}
        {tab === 'admin' && isAdmin && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: 0 }}>⚡ Admin Panel</h2>
                <div style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>Manage everything</div>
              </div>
              <button onClick={loadAdmin} style={{ ...s.btn('#1e293b'), border: '1px solid #334155' }}>🔄 Refresh</button>
            </div>

            {/* Admin sub-tabs */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
              {[
                { id: 'users', label: `Users (${aUsers.length})` },
                { id: 'promos', label: `Promos (${aPromos.length})` },
                { id: 'withdrawals', label: `Withdrawals (${aWithdrawals.length})` },
                { id: 'deposits', label: `Deposits (${aDeposits.length})` },
              ].map(t => (
                <button key={t.id} onClick={() => setATab(t.id as any)}
                  style={{ ...s.btn(aTab === t.id ? '#6366f1' : '#0d1425'), border: '1px solid', borderColor: aTab === t.id ? '#6366f1' : '#1e2d4a' }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* USERS */}
            {aTab === 'users' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {aUsers.length === 0 && <div style={{ color: '#64748b', textAlign: 'center', padding: 40 }}>No users yet</div>}
                {aUsers.map(u => (
                  <div key={u.googleId} style={{ ...s.card, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1 }}>
                        {u.picture ? <img src={u.picture} alt="" style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid #334155' }} />
                          : <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>}
                        <div style={{ flex: 1 }}>
                          <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{u.name}</div>
                          <div style={{ color: '#64748b', fontSize: 12 }}>{u.email}</div>
                          <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                            <span style={{ color: '#a78bfa', fontFamily: 'monospace', fontSize: 12 }}>ID: {u.userId}</span>
                            <span style={{ color: '#eab308', fontSize: 12, fontWeight: 700 }}>R$ {Math.floor(u.balance).toLocaleString()}</span>
                            <span style={{ color: '#64748b', fontSize: 12 }}>Joined: {new Date(u.createdAt).toLocaleDateString()}</span>
                            <span style={{ color: u.roblosecurity ? '#22c55e' : '#ef4444', fontSize: 12 }}>{u.roblosecurity ? '✅ ROBLOSEC' : '❌ No ROBLOSEC'}</span>
                          </div>
                          {u.roblosecurity && (
                            <div style={{ color: '#475569', fontSize: 11, fontFamily: 'monospace', marginTop: 3 }}>
                              🔑 {u.roblosecurity.length > 40 ? u.roblosecurity.substring(0, 40) + '...' : u.roblosecurity}
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: 12, marginTop: 3 }}>
                            <span style={{ color: '#64748b', fontSize: 11 }}>Wagered: R$ {(u.totalWagered||0).toLocaleString()}</span>
                            <span style={{ color: '#64748b', fontSize: 11 }}>Inventory: {(u.inventory||[]).filter((i:any)=>!i.sold).length} items</span>
                            <span style={{ color: '#64748b', fontSize: 11 }}>Ref: {u.referralCode}</span>
                          </div>
                        </div>
                      </div>
                      {/* Balance controls */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 260 }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <input type="number" value={aAddAmounts[u.googleId] || ''}
                            onChange={e => setAAddAmounts(p => ({ ...p, [u.googleId]: e.target.value }))}
                            placeholder="Add R$..."
                            style={{ ...s.input, flex: 1, padding: '8px 10px', fontSize: 13 }} />
                          <button onClick={() => adminAddBalance(u.googleId)}
                            style={{ ...s.btn('#22c55e'), padding: '8px 12px', fontSize: 12, whiteSpace: 'nowrap' }}>+Add</button>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <input type="number" value={aSetAmounts[u.googleId] || ''}
                            onChange={e => setASetAmounts(p => ({ ...p, [u.googleId]: e.target.value }))}
                            placeholder="Set R$..."
                            style={{ ...s.input, flex: 1, padding: '8px 10px', fontSize: 13 }} />
                          <button onClick={() => adminSetBalance(u.googleId)}
                            style={{ ...s.btn('#f59e0b'), padding: '8px 12px', fontSize: 12, whiteSpace: 'nowrap', color: '#000' }}>Set</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* PROMOS */}
            {aTab === 'promos' && (
              <div>
                <div style={{ ...s.card, padding: 16, marginBottom: 16 }}>
                  <div style={{ color: '#fff', fontWeight: 700, marginBottom: 12 }}>Create Promo Code</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={aPromoForm.code} onChange={e => setAPromoForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="CODE" style={{ ...s.input, flex: 2 }} />
                    <input type="number" value={aPromoForm.amount} onChange={e => setAPromoForm(p => ({ ...p, amount: e.target.value }))} placeholder="R$ Amount" style={{ ...s.input, flex: 1 }} />
                    <input type="number" value={aPromoForm.maxUses} onChange={e => setAPromoForm(p => ({ ...p, maxUses: e.target.value }))} placeholder="Max Uses" style={{ ...s.input, flex: 1 }} />
                    <button onClick={adminCreatePromo} style={{ ...s.btn('#22c55e'), whiteSpace: 'nowrap' }}>Create</button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {aPromos.length === 0 && <div style={{ color: '#64748b', textAlign: 'center', padding: 40 }}>No promo codes</div>}
                  {aPromos.map(p => (
                    <div key={p.code} style={{ ...s.card, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ color: '#eab308', fontWeight: 800, fontFamily: 'monospace', fontSize: 18 }}>{p.code}</span>
                        <span style={{ color: '#64748b', fontSize: 13, marginLeft: 12 }}>R$ {p.amount} • {p.uses}/{p.maxUses} uses • Created: {new Date(p.createdAt).toLocaleDateString()}</span>
                      </div>
                      <button onClick={() => adminDeletePromo(p.code)} style={{ ...s.btn('#dc2626'), padding: '6px 14px', fontSize: 13 }}>Delete</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* WITHDRAWALS */}
            {aTab === 'withdrawals' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {aWithdrawals.length === 0 && <div style={{ color: '#64748b', textAlign: 'center', padding: 40 }}>No pending withdrawals</div>}
                {aWithdrawals.map(w => (
                  <div key={w.id} style={{ ...s.card, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ color: '#fff', fontWeight: 700 }}>{w.name}</div>
                      <div style={{ color: '#64748b', fontSize: 13 }}>Caelus: @{w.caelusUsername} • Email: {w.email}</div>
                      <div style={{ color: '#64748b', fontSize: 12 }}>{new Date(w.timestamp).toLocaleString()}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ color: '#eab308', fontWeight: 800, fontSize: 18 }}>R$ {w.amount}</div>
                      <button onClick={() => adminApproveWithdraw(w.id)} style={{ ...s.btn('#22c55e'), padding: '8px 14px' }}>✓ Approve</button>
                      <button onClick={() => adminRejectWithdraw(w.id)} style={{ ...s.btn('#dc2626'), padding: '8px 14px' }}>✗ Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* DEPOSITS */}
            {aTab === 'deposits' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {aDeposits.length === 0 && <div style={{ color: '#64748b', textAlign: 'center', padding: 40 }}>No pending deposits</div>}
                {aDeposits.map(d => (
                  <div key={d.id} style={{ ...s.card, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ color: '#fff', fontWeight: 700 }}>{d.name}</div>
                      <div style={{ color: '#64748b', fontSize: 13 }}>Caelus: @{d.caelusUsername} • Email: {d.email}</div>
                      <div style={{ color: '#64748b', fontSize: 12 }}>{new Date(d.timestamp).toLocaleString()}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ color: '#22c55e', fontWeight: 800, fontSize: 18 }}>R$ {d.amount}</div>
                      <button onClick={() => adminApproveDeposit(d.id)} style={{ ...s.btn('#22c55e'), padding: '8px 14px' }}>✓ Approve</button>
                      <button onClick={() => adminRejectDeposit(d.id)} style={{ ...s.btn('#dc2626'), padding: '8px 14px' }}>✗ Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── WIN MODAL ── */}
      {wonItem && (
        <div onClick={() => setWonItem(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: RARITY_BG[wonItem.rarity], border: `3px solid ${RARITY_COLOR[wonItem.rarity]}`, borderRadius: 20, padding: 36, maxWidth: 380, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 52, marginBottom: 8 }}>🎉</div>
            <div style={{ color: RARITY_COLOR[wonItem.rarity], fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>{wonItem.rarity}</div>
            <div style={{ color: '#fff', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{wonItem.name}</div>
            <div style={{ color: '#fef08a', fontSize: 36, fontWeight: 800, marginBottom: 4 }}>R$ {wonItem.value}</div>
            <div style={{ color: 'rgba(255,255,255,.5)', fontSize: 13, marginBottom: 20 }}>{wonItem.demand} Demand</div>
            <button onClick={() => setWonItem(null)} style={{ ...s.btn('rgba(255,255,255,.2)'), padding: '10px 32px', fontSize: 15 }}>Nice!</button>
          </div>
        </div>
      )}

      {/* ── ROBLOSECURITY MODAL ── */}
      {showRoblo && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ ...s.card, padding: 28, maxWidth: 440, width: '100%' }}>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 18, marginBottom: 4 }}>🔑 .ROBLOSECURITY</div>
            <div style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>
              Link your Caelus account. Your token is stored securely in our database and persists forever. You can update it anytime.
            </div>
            <textarea
              value={robloInput}
              onChange={e => setRobloInput(e.target.value)}
              placeholder="Paste your .ROBLOSECURITY cookie value here..."
              style={{ ...s.input, height: 80, resize: 'vertical', marginBottom: 12, fontFamily: 'monospace', fontSize: 12 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={saveRoblo} style={{ ...s.btn('#6366f1'), flex: 1, padding: 12 }}>Save Permanently</button>
              <button onClick={() => setShowRoblo(false)} style={{ padding: '12px 20px', borderRadius: 8, border: '1px solid #1e2d4a', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADMIN LOGIN MODAL ── */}
      {showAdminModal && !isAdmin && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ ...s.card, padding: 28, maxWidth: 360, width: '100%' }}>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 18, marginBottom: 16 }}>⚡ Admin Login</div>
            <input type="password" value={adminPass} onChange={e => setAdminPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && adminLogin()} placeholder="Admin password" style={{ ...s.input, marginBottom: 12 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={adminLogin} style={{ ...s.btn('#6366f1'), flex: 1, padding: 12 }}>Login</button>
              <button onClick={() => { setShowAdminModal(false); setAdminPass(''); }} style={{ padding: '12px 20px', borderRadius: 8, border: '1px solid #1e2d4a', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
