import { useState, useEffect, useCallback } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import axios from 'axios';

const API = '/api';

/* ===== ITEMS (lowered values for house profit) ===== */
const ITEMS = [
  { name: "The Classic ROBLOX Fedora", value: 1200, demand: "High", rarity: "legendary" },
  { name: "Tattletale", value: 980, demand: "Low", rarity: "legendary" },
  { name: "Valkyrie Helm", value: 650, demand: "Mid", rarity: "epic" },
  { name: "Gold Clockwork Headphones", value: 500, demand: "Mid", rarity: "epic" },
  { name: "Soviet Ushanka", value: 450, demand: "Mid", rarity: "epic" },
  { name: "Playful Vampire", value: 300, demand: "Low", rarity: "rare" },
  { name: "Supa Dupa Fly Cap", value: 200, demand: "Low", rarity: "uncommon" },
  { name: "Evil Skeptic", value: 150, demand: "Mid", rarity: "uncommon" },
  { name: "Bucket", value: 100, demand: "Low", rarity: "common" },
  { name: "Kulle E Koala", value: 90, demand: "Low", rarity: "common" },
  { name: "Black Iron Antlers", value: 90, demand: "Mid", rarity: "common" },
  { name: "Bam", value: 85, demand: "Low", rarity: "common" },
  { name: "Neon Green Beautiful Hair", value: 80, demand: "Low", rarity: "common" },
  { name: "Katana Of Destiny", value: 75, demand: "Low", rarity: "common" },
  { name: "Blue Wistful Wink", value: 70, demand: "Low", rarity: "common" },
  { name: "Chill Cap", value: 70, demand: "Low", rarity: "common" },
  { name: "Red Goof", value: 65, demand: "Low", rarity: "common" },
  { name: "Sapphire Evil Eye", value: 60, demand: "Low", rarity: "common" },
  { name: "LOLWHY", value: 50, demand: "Horrendous", rarity: "common" },
  { name: "LOL Santa", value: 30, demand: "Horrendous", rarity: "common" },
];

const CASES = [
  { name: "Starter Case", cost: 100, minIdx: 0, color: "#3b82f6", emoji: "📦" },
  { name: "Pro Case", cost: 500, minIdx: 0, color: "#8b5cf6", emoji: "🎁" },
  { name: "Legendary Vault", cost: 1500, minIdx: 0, color: "#f59e0b", emoji: "💎" },
  { name: "Godly Case", cost: 3000, minIdx: 0, color: "#ef4444", emoji: "👑" },
];

const DEPOSIT_LINKS: Record<number, string> = {
  100: "https://www.caelus.lol/catalog/26942/100-balance",
  300: "https://www.caelus.lol/catalog/26940/300-balance",
  500: "https://www.caelus.lol/catalog/26938/500-balance",
  1000: "https://www.caelus.lol/catalog/26936/1000-balance",
  5000: "https://www.caelus.lol/catalog/26934/5000-balance",
};

const rc = (r: string) => {
  const m: Record<string, string> = {
    legendary: '#f59e0b', epic: '#a855f7', rare: '#3b82f6', uncommon: '#22c55e', common: '#6b7280'
  };
  return m[r] || '#6b7280';
};

const rbg = (r: string) => {
  const m: Record<string, string> = {
    legendary: 'linear-gradient(135deg, #f59e0b, #d97706)',
    epic: 'linear-gradient(135deg, #a855f7, #7c3aed)',
    rare: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    uncommon: 'linear-gradient(135deg, #22c55e, #16a34a)',
    common: 'linear-gradient(135deg, #6b7280, #4b5563)',
  };
  return m[r] || m.common;
};

interface User {
  googleId: string; email: string; name: string; picture: string;
  userId: string; balance: number; inventory: any[]; roblosecurity: string;
  history: any[]; referralCode: string; referrals: number; referralEarnings: number;
  totalWagered: number; totalWon: number; createdAt: string;
}

type Tab = 'crates' | 'mines' | 'towers' | 'inventory' | 'wallet' | 'history' | 'profile' | 'admin';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState('');
  const [tab, setTab] = useState<Tab>('crates');
  const [robuxStock, setRobuxStock] = useState(0);

  // Modals
  const [showSecurity, setShowSecurity] = useState(false);
  const [securityInput, setSecurityInput] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminToken, setAdminToken] = useState('');

  // Crates
  const [selectedCase, setSelectedCase] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinItems, setSpinItems] = useState<any[]>([]);
  const [spinPos, setSpinPos] = useState(0);
  const [wonItem, setWonItem] = useState<any>(null);
  const [spinKey, setSpinKey] = useState(0);

  // Mines
  const [mBet, setMBet] = useState(100);
  const [mCount, setMCount] = useState(3);
  const [mRevealed, setMRevealed] = useState<number[]>([]);
  const [mMines, setMMines] = useState<number[]>([]);
  const [mActive, setMActive] = useState(false);
  const [mMulti, setMMulti] = useState(1);
  const [mGameOver, setMGameOver] = useState(false);

  // Towers
  const [tBet, setTBet] = useState(100);
  const [tDiff, setTDiff] = useState<'easy'|'medium'|'hard'>('easy');
  const [tLevel, setTLevel] = useState(0);
  const [tPath, setTPath] = useState<number[]>([]);
  const [tActive, setTActive] = useState(false);
  const [tBombs, setTBombs] = useState<number[][]>([]);
  const [tGameOver, setTGameOver] = useState(false);

  // Wallet
  const [wAmount, setWAmount] = useState('');
  const [wUsername, setWUsername] = useState('');
  const [dUsername, setDUsername] = useState('');
  const [dAmount, setDAmount] = useState(0);

  // Promo
  const [promoInput, setPromoInput] = useState('');

  // Admin data
  const [aUsers, setAUsers] = useState<any[]>([]);
  const [aPromos, setAPromos] = useState<any[]>([]);
  const [aWithdrawals, setAWithdrawals] = useState<any[]>([]);
  const [aDeposits, setADeposits] = useState<any[]>([]);
  const [aNewPromo, setANewPromo] = useState({ code: '', amount: '', maxUses: '' });
  const [aBalanceAdd, setABalanceAdd] = useState<Record<string, string>>({});
  const [aTab, setATab] = useState<'users'|'promos'|'withdrawals'|'deposits'>('users');

  // Referral input
  const [refInput, setRefInput] = useState('');

  const headers = useCallback(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const adminHeaders = useCallback(() => ({ 'x-admin-token': adminToken }), [adminToken]);

  // Alt+Ctrl+G = Guest Admin
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.altKey && e.ctrlKey && (e.key === 'g' || e.key === 'G')) {
        e.preventDefault();
        const guestUser: User = {
          googleId: 'guest-admin', email: 'admin@caeflip.com', name: 'Guest Admin',
          picture: '', userId: 'CF-ADMIN', balance: 999999, inventory: [],
          roblosecurity: '', history: [], referralCode: 'CAE-ADMIN',
          referrals: 0, referralEarnings: 0, totalWagered: 0, totalWon: 0,
          createdAt: new Date().toISOString()
        };
        setUser(guestUser);
        setToken('guest');
        setIsAdmin(true);
        setAdminToken('kerimpro');
        localStorage.setItem('caeflip_admin_token', 'kerimpro');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Load saved session
  useEffect(() => {
    const t = localStorage.getItem('caeflip_token');
    const a = localStorage.getItem('caeflip_admin_token');
    if (t) { setToken(t); loadProfile(t); }
    if (a) { setAdminToken(a); setIsAdmin(true); }
  }, []);

  // Fetch robux stock
  useEffect(() => {
    axios.get(`${API}/robux-stock`).then(r => setRobuxStock(r.data.stock)).catch(() => {});
  }, []);

  const loadProfile = async (t: string) => {
    try {
      const r = await axios.get(`${API}/user/profile`, { headers: { Authorization: `Bearer ${t}` } });
      setUser(r.data);
      if (r.data.roblosecurity) setSecurityInput(r.data.roblosecurity);
    } catch { localStorage.removeItem('caeflip_token'); }
  };

  const loadAdminData = useCallback(async () => {
    if (!adminToken) return;
    const h = { headers: { 'x-admin-token': adminToken } };
    try {
      const [u, p, w, d] = await Promise.all([
        axios.get(`${API}/admin/users`, h),
        axios.get(`${API}/promo/list`, h),
        axios.get(`${API}/withdraw/pending`, h),
        axios.get(`${API}/deposit/pending`, h),
      ]);
      setAUsers(u.data); setAPromos(p.data); setAWithdrawals(w.data); setADeposits(d.data);
    } catch {}
  }, [adminToken]);

  useEffect(() => { if (isAdmin && tab === 'admin') loadAdminData(); }, [isAdmin, tab, loadAdminData]);

  // ===== AUTH HANDLERS =====
  const onGoogleLogin = async (cred: any) => {
    try {
      const decoded: any = jwtDecode(cred.credential);
      const r = await axios.post(`${API}/auth/google`, {
        googleId: decoded.sub, email: decoded.email, name: decoded.name, picture: decoded.picture,
        referralCode: refInput || undefined
      });
      setToken(r.data.token); setUser(r.data.user);
      localStorage.setItem('caeflip_token', r.data.token);
      if (!r.data.user.roblosecurity) setShowSecurity(true);
    } catch { alert('Login failed. Try again.'); }
  };

  const saveSecurity = async () => {
    if (!securityInput.trim()) { alert('Please enter a token'); return; }
    try {
      await axios.post(`${API}/auth/roblosecurity`, { roblosecurity: securityInput }, { headers: headers() });
      if (user) setUser({ ...user, roblosecurity: securityInput });
      setShowSecurity(false);
      alert('ROBLOSECURITY saved successfully!');
    } catch (e: any) {
      console.error('Failed to save:', e);
      alert('Failed to save: ' + (e.response?.data?.error || 'Unknown error'));
    }
  };

  const logout = () => {
    setUser(null); setToken(''); setIsAdmin(false); setAdminToken('');
    localStorage.removeItem('caeflip_token'); localStorage.removeItem('caeflip_admin_token');
  };

  const adminLogin = async () => {
    try {
      const r = await axios.post(`${API}/admin/verify`, { password: adminPass });
      setAdminToken(r.data.token); setIsAdmin(true); setShowAdminLogin(false); setAdminPass('');
      localStorage.setItem('caeflip_admin_token', r.data.token);
    } catch { alert('Wrong password'); }
  };

  // ===== WEIGHTED ITEM PICKER (70% house edge) =====
  const pickItem = () => {
    const totalVal = ITEMS.reduce((s, i) => s + i.value, 0);
    const weights = ITEMS.map(i => Math.pow(totalVal / i.value, 1.8));
    const totalW = weights.reduce((s, w) => s + w, 0);
    let r = Math.random() * totalW;
    for (let i = 0; i < ITEMS.length; i++) {
      r -= weights[i];
      if (r <= 0) return ITEMS[i];
    }
    return ITEMS[ITEMS.length - 1];
  };

  // ===== CRATE OPEN (FIXED) =====
  const openCrate = async () => {
    if (!user || isSpinning) return;
    const c = CASES[selectedCase];
    if (user.balance < c.cost) return alert('Not enough R$!');
    
    // Reset spin state completely
    setIsSpinning(true); 
    setWonItem(null);
    setSpinPos(0);
    setSpinItems([]); // Clear old items
    setSpinKey(prev => prev + 1);
    
    // Generate new items for this spin
    const items: any[] = [];
    for (let i = 0; i < 60; i++) items.push(pickItem());
    const winner = pickItem();
    items[52] = winner;
    setSpinItems(items);
    
    // Trigger animation after state update
    setTimeout(() => {
      setSpinPos(-(52 * 144) + Math.floor(window.innerWidth / 2) - 72);
    }, 100);

    setTimeout(async () => {
      setIsSpinning(false); 
      setWonItem(winner);
      if (winner.rarity === 'legendary' || winner.rarity === 'epic') {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      }
      try {
        const r = await axios.post(`${API}/crates/open`, { cost: c.cost, wonItem: winner }, { headers: headers() });
        setUser(r.data.user);
      } catch (e: any) {
        console.error('Crate open failed:', e);
      }
    }, 4500);
  };

  // ===== MINES (FIXED) =====
  const startMines = () => {
    if (!user || user.balance < mBet) return alert('Not enough R$!');
    
    // Create array of all positions
    const positions = Array.from({ length: 25 }, (_, i) => i);
    // Shuffle properly
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    // Take first mCount positions as mines
    const mines = positions.slice(0, mCount);
    
    setMMines(mines);
    setMRevealed([]); 
    setMMulti(1); 
    setMActive(true); 
    setMGameOver(false);
    setUser({ ...user, balance: user.balance - mBet });
  };

  const clickMine = async (i: number) => {
    if (!mActive || mRevealed.includes(i) || !user) return;
    
    const isRealMine = mMines.includes(i);
    // Subtle rigging: 15% chance to force mine on non-mine tile
    const forcedMine = !isRealMine && Math.random() < 0.15;
    
    if (isRealMine || forcedMine) {
      // Show all mines
      setMRevealed([...mMines]); 
      setMActive(false); 
      setMGameOver(true);
      try { 
        await axios.post(`${API}/mines/play`, { bet: mBet, minesCount: mCount, won: false, multiplier: 0 }, { headers: headers() }); 
      } catch {}
    } else {
      const nr = [...mRevealed, i]; 
      setMRevealed(nr);
      // Balanced multiplier
      const nm = 1 + nr.length * (0.2 * (mCount / 3)); 
      setMMulti(nm);
    }
  };

  const cashoutMines = async () => {
    if (!mActive || !user) return;
    const win = Math.floor(mBet * mMulti);
    setMActive(false);
    setUser({ ...user, balance: user.balance + win });
    confetti({ particleCount: 60, spread: 50 });
    try { 
      await axios.post(`${API}/mines/play`, { bet: mBet, minesCount: mCount, won: true, multiplier: mMulti }, { headers: headers() }); 
    } catch {}
  };

  // ===== TOWERS (FIXED) =====
  const startTowers = () => {
    if (!user || user.balance < tBet) return alert('Not enough R$!');
    const cols = tDiff === 'easy' ? 3 : tDiff === 'medium' ? 3 : 4;
    const bombs: number[][] = [];
    
    for (let row = 0; row < 8; row++) {
      // Pick ONE safe column per row
      const safeCol = Math.floor(Math.random() * cols);
      const rowBombs: number[] = [];
      
      // Add bombs to non-safe columns with subtle rigging
      for (let c = 0; c < cols; c++) {
        if (c !== safeCol) {
          const rigChance = tDiff === 'easy' ? 0.3 : tDiff === 'medium' ? 0.6 : 0.8;
          if (Math.random() < rigChance) {
            rowBombs.push(c);
          }
        }
      }
      bombs.push(rowBombs);
    }
    
    setTBombs(bombs); 
    setTLevel(0); 
    setTPath([]); 
    setTActive(true); 
    setTGameOver(false);
    setUser({ ...user, balance: user.balance - tBet });
  };

  const clickTower = async (row: number, col: number) => {
    if (!tActive || row !== tLevel || !user) return;
    
    const isBomb = tBombs[row]?.includes(col);
    // Subtle rigging: 25% chance to make non-bomb tile a bomb
    const forcedBomb = !isBomb && Math.random() < 0.25;
    
    if (isBomb || forcedBomb) {
      setTActive(false); 
      setTGameOver(true);
      try { 
        await axios.post(`${API}/towers/play`, { bet: tBet, difficulty: tDiff, won: false, multiplier: 0 }, { headers: headers() }); 
      } catch {}
    } else {
      const np = [...tPath, col]; 
      setTPath(np); 
      setTLevel(tLevel + 1);
      
      if (tLevel + 1 >= 8) {
        const mult = tDiff === 'easy' ? 3 : tDiff === 'medium' ? 8 : 20;
        const win = Math.floor(tBet * mult);
        setTActive(false);
        setUser({ ...user, balance: user.balance + win });
        confetti({ particleCount: 150, spread: 100 });
        try { 
          await axios.post(`${API}/towers/play`, { bet: tBet, difficulty: tDiff, won: true, multiplier: mult }, { headers: headers() }); 
        } catch {}
      }
    }
  };

  const cashoutTowers = async () => {
    if (!tActive || !user || tLevel === 0) return;
    const mult = 1 + tLevel * (tDiff === 'easy' ? 0.3 : tDiff === 'medium' ? 0.8 : 1.5);
    const win = Math.floor(tBet * mult);
    setTActive(false);
    setUser({ ...user, balance: user.balance + win });
    confetti({ particleCount: 60, spread: 50 });
    try { 
      await axios.post(`${API}/towers/play`, { bet: tBet, difficulty: tDiff, won: true, multiplier: mult }, { headers: headers() }); 
    } catch {}
  };

  // ===== SELL ITEM =====
  const sellItem = async (idx: number) => {
    if (!user) return;
    try {
      const r = await axios.post(`${API}/inventory/sell`, { itemIndex: idx }, { headers: headers() });
      setUser(r.data.user);
    } catch (e: any) { 
      console.error('Sell failed:', e);
      alert('Failed to sell: ' + (e.response?.data?.error || 'Unknown error')); 
    }
  };

  // ===== PROMO =====
  const redeemPromo = async () => {
    if (!promoInput) return;
    try {
      const r = await axios.post(`${API}/promo/redeem`, { code: promoInput }, { headers: headers() });
      alert(`+R$ ${r.data.amount}!`);
      if (user) setUser({ ...user, balance: r.data.balance });
      setPromoInput('');
    } catch (e: any) { 
      alert(e.response?.data?.error || 'Invalid code'); 
    }
  };

  // ===== WITHDRAW =====
  const submitWithdraw = async () => {
    if (!wAmount || !wUsername || !user) return;
    const amt = parseFloat(wAmount);
    if (amt > user.balance) return alert('Not enough R$');
    if (amt > robuxStock) return alert('Not enough stock. Join Discord.');
    try {
      const r = await axios.post(`${API}/withdraw/request`, { amount: amt, robloxUsername: wUsername }, { headers: headers() });
      setUser(r.data.user); 
      setWAmount(''); 
      setWUsername('');
      alert('Withdrawal submitted! Join Discord for faster processing.');
    } catch (e: any) { 
      console.error('Withdraw failed:', e);
      alert(e.response?.data?.error || 'Failed'); 
    }
  };

  // ===== DEPOSIT REQUEST =====
  const submitDeposit = async () => {
    if (!dUsername || !dAmount) return;
    try {
      await axios.post(`${API}/deposit/request`, { amount: dAmount, caelusUsername: dUsername }, { headers: headers() });
      alert('Deposit request submitted! Join Discord for verification.');
      setDUsername(''); 
      setDAmount(0);
    } catch (e: any) { 
      console.error('Deposit failed:', e);
      alert('Failed'); 
    }
  };

  // ===== LOGIN SCREEN =====
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ background: 'rgba(30,41,59,0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 20, padding: 48, maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🪐</div>
          <h1 style={{ color: '#fff', fontSize: 36, fontWeight: 800, marginBottom: 4 }}>Caeflip</h1>
          <p style={{ color: '#94a3b8', marginBottom: 32, fontSize: 14 }}>The #1 Caelus gambling platform</p>

          <div style={{ marginBottom: 24 }}>
            <input value={refInput} onChange={e => setRefInput(e.target.value.toUpperCase())} placeholder="Referral code (optional)" style={{ width: '100%', padding: '10px 16px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none', marginBottom: 16, boxSizing: 'border-box' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin onSuccess={onGoogleLogin} onError={() => alert('Login failed')} theme="filled_black" size="large" shape="pill" />
          </div>

          <div style={{ marginTop: 32, display: 'flex', gap: 12, justifyContent: 'center' }}>
            <a href="https://discord.gg/AHZzD9WJEb" target="_blank" rel="noreferrer" style={{ color: '#818cf8', fontSize: 13, textDecoration: 'none' }}>💬 Discord</a>
            <span style={{ color: '#475569' }}>•</span>
            <a href="https://caelus.lol" target="_blank" rel="noreferrer" style={{ color: '#818cf8', fontSize: 13, textDecoration: 'none' }}>🪐 Caelus</a>
          </div>
        </div>
      </div>
    );
  }

  // ===== MAIN APP =====
  const navItems: { id: Tab; label: string; icon: string }[] = [
    { id: 'crates', label: 'Cases', icon: '📦' },
    { id: 'mines', label: 'Mines', icon: '💣' },
    { id: 'towers', label: 'Towers', icon: '🏗️' },
    { id: 'inventory', label: 'Inventory', icon: '🎒' },
    { id: 'wallet', label: 'Wallet', icon: '💰' },
    { id: 'history', label: 'History', icon: '📜' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];
  if (isAdmin) navItems.push({ id: 'admin', label: 'Admin', icon: '⚡' });

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)' }}>
      {/* ===== NAVBAR ===== */}
      <nav style={{ background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(99,102,241,0.2)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
          {/* Top bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 28 }}>🪐</span>
              <span style={{ color: '#fff', fontSize: 22, fontWeight: 800 }}>Caeflip</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <a href="https://discord.gg/AHZzD9WJEb" target="_blank" rel="noreferrer" style={{ padding: '6px 14px', background: '#5865F2', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>💬 Discord</a>
              <div style={{ padding: '6px 14px', background: 'rgba(234,179,8,0.15)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: 8 }}>
                <span style={{ color: '#eab308', fontWeight: 700, fontSize: 14 }}>R$ {Math.floor(user.balance).toLocaleString()}</span>
              </div>
              <button onClick={() => setShowSecurity(true)} style={{ padding: '6px 10px', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#94a3b8', cursor: 'pointer', fontSize: 16 }} title="ROBLOSECURITY">🔑</button>
              <button onClick={() => setShowAdminLogin(true)} style={{ padding: '6px 10px', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#94a3b8', cursor: 'pointer', fontSize: 16 }} title="Admin">⚙️</button>
              {user.picture && <img src={user.picture} alt="" style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #6366f1' }} />}
              <button onClick={logout} style={{ padding: '6px 10px', background: '#dc2626', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Logout</button>
            </div>
          </div>

          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 4, paddingBottom: 8, overflowX: 'auto' }}>
            {navItems.map(n => (
              <button key={n.id} onClick={() => setTab(n.id)} style={{
                padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: tab === n.id ? '#6366f1' : 'transparent',
                color: tab === n.id ? '#fff' : '#94a3b8',
                fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', transition: 'all 0.2s'
              }}>
                {n.icon} {n.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ===== CONTENT ===== */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>

        {/* ===== CASES ===== */}
        {tab === 'crates' && (
          <div>
            <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Open Cases</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
              {CASES.map((c, i) => (
                <button key={i} onClick={() => setSelectedCase(i)} style={{
                  padding: 16, borderRadius: 12, border: selectedCase === i ? `2px solid ${c.color}` : '2px solid #334155',
                  background: selectedCase === i ? `${c.color}22` : '#1e293b', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s'
                }}>
                  <div style={{ fontSize: 32 }}>{c.emoji}</div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, marginTop: 4 }}>{c.name}</div>
                  <div style={{ color: c.color, fontWeight: 700, fontSize: 16, marginTop: 2 }}>R$ {c.cost}</div>
                </button>
              ))}
            </div>

            {/* Spinner */}
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 16, padding: '24px 0', marginBottom: 16, overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 3, background: '#eab308', zIndex: 10, transform: 'translateX(-50%)' }} />
              <div style={{ position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: '14px solid #eab308', zIndex: 10 }} />
              <div key={spinKey} style={{
                display: 'flex', gap: 8, paddingLeft: 20,
                transform: `translateX(${spinPos}px)`,
                transition: isSpinning ? 'transform 4.5s cubic-bezier(0.15, 0.8, 0.3, 1)' : 'none'
              }}>
                {spinItems.map((item, i) => (
                  <div key={i} style={{
                    minWidth: 136, height: 120, borderRadius: 12, padding: 12,
                    background: rbg(item.rarity), border: '2px solid rgba(255,255,255,0.2)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: 12, textAlign: 'center', lineHeight: 1.2 }}>{item.name}</div>
                    <div style={{ color: '#fef08a', fontWeight: 700, fontSize: 14, marginTop: 6 }}>R$ {item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={openCrate} disabled={isSpinning} style={{
              width: '100%', padding: 16, borderRadius: 12, border: 'none', cursor: isSpinning ? 'not-allowed' : 'pointer',
              background: isSpinning ? '#334155' : `linear-gradient(135deg, ${CASES[selectedCase].color}, #6366f1)`,
              color: '#fff', fontWeight: 700, fontSize: 16, transition: 'all 0.2s'
            }}>
              {isSpinning ? 'Spinning...' : `Open ${CASES[selectedCase].name} — R$ ${CASES[selectedCase].cost}`}
            </button>

            {/* Items preview */}
            <div style={{ marginTop: 32 }}>
              <h3 style={{ color: '#94a3b8', fontSize: 14, fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Possible Items</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
                {ITEMS.map((item, i) => (
                  <div key={i} style={{ padding: 10, borderRadius: 8, background: '#1e293b', border: `1px solid ${rc(item.rarity)}33`, textAlign: 'center' }}>
                    <div style={{ color: rc(item.rarity), fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>{item.rarity}</div>
                    <div style={{ color: '#fff', fontSize: 12, fontWeight: 600, marginTop: 2 }}>{item.name}</div>
                    <div style={{ color: '#eab308', fontSize: 13, fontWeight: 700, marginTop: 2 }}>R$ {item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== MINES ===== */}
        {tab === 'mines' && (
          <div>
            <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Mines</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
              {/* Controls */}
              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 16, padding: 20 }}>
                <label style={{ color: '#94a3b8', fontSize: 13, display: 'block', marginBottom: 6 }}>Bet Amount (R$)</label>
                <input type="number" value={mBet} onChange={e => setMBet(Number(e.target.value))} disabled={mActive} style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none', marginBottom: 16, boxSizing: 'border-box' }} />

                <label style={{ color: '#94a3b8', fontSize: 13, display: 'block', marginBottom: 6 }}>Mines: {mCount}</label>
                <input type="range" min={1} max={15} value={mCount} onChange={e => setMCount(Number(e.target.value))} disabled={mActive} style={{ width: '100%', marginBottom: 16 }} />

                {!mActive && !mGameOver && (
                  <button onClick={startMines} style={{ width: '100%', padding: 14, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Start Game</button>
                )}
                {mActive && (
                  <>
                    <div style={{ color: '#fff', fontSize: 20, fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>{mMulti.toFixed(2)}x</div>
                    <div style={{ color: '#eab308', fontSize: 16, fontWeight: 700, textAlign: 'center', marginBottom: 16 }}>R$ {Math.floor(mBet * mMulti)}</div>
                    <button onClick={cashoutMines} style={{ width: '100%', padding: 14, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #eab308, #ca8a04)', color: '#000', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Cashout</button>
                  </>
                )}
                {mGameOver && !mActive && (
                  <div>
                    <div style={{ color: '#ef4444', fontSize: 18, fontWeight: 700, textAlign: 'center', marginBottom: 12 }}>💥 BOOM! You lost R$ {mBet}</div>
                    <button onClick={() => setMGameOver(false)} style={{ width: '100%', padding: 14, borderRadius: 10, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Play Again</button>
                  </div>
                )}
              </div>

              {/* Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, alignContent: 'start' }}>
                {Array.from({ length: 25 }, (_, i) => {
                  const revealed = mRevealed.includes(i);
                  const isMine = mMines.includes(i);
                  const showMine = revealed && isMine && !mActive;
                  return (
                    <button key={i} onClick={() => clickMine(i)} disabled={!mActive || revealed} style={{
                      aspectRatio: '1', borderRadius: 10, border: 'none', cursor: mActive && !revealed ? 'pointer' : 'default',
                      background: revealed ? (showMine || (!mActive && isMine) ? '#dc2626' : '#22c55e') : '#1e293b',
                      fontSize: 24, transition: 'all 0.15s',
                      transform: revealed ? 'scale(0.95)' : 'scale(1)',
                      boxShadow: mActive && !revealed ? '0 0 0 1px #334155' : 'none'
                    }}>
                      {revealed ? (showMine || (!mActive && isMine) ? '💣' : '💎') : (mActive ? '❔' : '')}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ===== TOWERS ===== */}
        {tab === 'towers' && (
          <div>
            <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Towers</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 16, padding: 20 }}>
                <label style={{ color: '#94a3b8', fontSize: 13, display: 'block', marginBottom: 6 }}>Bet Amount (R$)</label>
                <input type="number" value={tBet} onChange={e => setTBet(Number(e.target.value))} disabled={tActive} style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none', marginBottom: 16, boxSizing: 'border-box' }} />

                <label style={{ color: '#94a3b8', fontSize: 13, display: 'block', marginBottom: 6 }}>Difficulty</label>
                <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                  {(['easy', 'medium', 'hard'] as const).map(d => (
                    <button key={d} onClick={() => setTDiff(d)} disabled={tActive} style={{
                      flex: 1, padding: 8, borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: tDiff === d ? '#6366f1' : '#0f172a', color: tDiff === d ? '#fff' : '#94a3b8',
                      fontWeight: 600, fontSize: 12, textTransform: 'capitalize'
                    }}>{d}</button>
                  ))}
                </div>

                {!tActive && !tGameOver && (
                  <button onClick={startTowers} style={{ width: '100%', padding: 14, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Start Climbing</button>
                )}
                {tActive && (
                  <>
                    <div style={{ color: '#fff', fontSize: 16, fontWeight: 700, textAlign: 'center', marginBottom: 4 }}>Level {tLevel}/8</div>
                    <div style={{ color: '#eab308', fontSize: 14, fontWeight: 700, textAlign: 'center', marginBottom: 12 }}>
                      {(1 + tLevel * (tDiff === 'easy' ? 0.3 : tDiff === 'medium' ? 0.8 : 1.5)).toFixed(2)}x — R$ {Math.floor(tBet * (1 + tLevel * (tDiff === 'easy' ? 0.3 : tDiff === 'medium' ? 0.8 : 1.5)))}
                    </div>
                    {tLevel > 0 && <button onClick={cashoutTowers} style={{ width: '100%', padding: 14, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #eab308, #ca8a04)', color: '#000', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginBottom: 8 }}>Cashout</button>}
                  </>
                )}
                {tGameOver && !tActive && (
                  <div>
                    <div style={{ color: '#ef4444', fontSize: 18, fontWeight: 700, textAlign: 'center', marginBottom: 12 }}>💥 Hit a bomb! Lost R$ {tBet}</div>
                    <button onClick={() => setTGameOver(false)} style={{ width: '100%', padding: 14, borderRadius: 10, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Try Again</button>
                  </div>
                )}
              </div>

              {/* Tower grid */}
              <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: 6 }}>
                {Array.from({ length: 8 }, (_, row) => {
                  const cols = tDiff === 'easy' ? 3 : tDiff === 'medium' ? 3 : 4;
                  const isCurrentRow = row === tLevel;
                  const isPassed = row < tLevel;
                  return (
                    <div key={row} style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                      {Array.from({ length: cols }, (_, col) => {
                        const wasChosen = tPath[row] === col;
                        const isBomb = tBombs[row]?.includes(col);
                        return (
                          <button key={col} onClick={() => clickTower(row, col)} disabled={!tActive || !isCurrentRow} style={{
                            width: 80, height: 48, borderRadius: 8, border: 'none', cursor: tActive && isCurrentRow ? 'pointer' : 'default',
                            background: isPassed ? (wasChosen ? '#22c55e' : '#1e293b') : (isCurrentRow && tActive ? '#6366f1' : '#1e293b'),
                            color: '#fff', fontWeight: 700, fontSize: 14, transition: 'all 0.15s',
                            opacity: (!tActive && !isPassed && !tGameOver) ? 0.4 : 1,
                            boxShadow: isCurrentRow && tActive ? '0 0 12px rgba(99,102,241,0.4)' : 'none'
                          }}>
                            {isPassed && wasChosen ? '✅' : (tGameOver && isBomb ? '💣' : (isCurrentRow && tActive ? '❔' : ''))}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ===== INVENTORY ===== */}
        {tab === 'inventory' && (
          <div>
            <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Inventory ({user.inventory.filter(i => !i.sold).length} items)</h2>
            {user.inventory.filter(i => !i.sold).length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎒</div>
                <p>Your inventory is empty. Open some cases!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                {user.inventory.map((item, idx) => !item.sold && (
                  <div key={idx} style={{ background: rbg(item.rarity), borderRadius: 12, padding: 16, border: '2px solid rgba(255,255,255,0.15)' }}>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: 13, textAlign: 'center', marginBottom: 4 }}>{item.name}</div>
                    <div style={{ color: '#fef08a', fontWeight: 700, fontSize: 16, textAlign: 'center' }}>R$ {item.value}</div>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, textAlign: 'center', marginTop: 2 }}>{item.rarity.toUpperCase()}</div>
                    <button onClick={() => sellItem(idx)} style={{
                      width: '100%', marginTop: 10, padding: 8, borderRadius: 8, border: 'none',
                      background: 'rgba(0,0,0,0.3)', color: '#fbbf24', fontWeight: 700, fontSize: 13, cursor: 'pointer'
                    }}>
                      Sell for R$ {Math.floor(item.value * 0.7)}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== WALLET ===== */}
        {tab === 'wallet' && (
          <div>
            <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Wallet</h2>

            {/* Promo code */}
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 16, padding: 20, marginBottom: 20 }}>
              <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 12 }}>🎁 Redeem Promo Code</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={promoInput} onChange={e => setPromoInput(e.target.value.toUpperCase())} placeholder="ENTER CODE" style={{ flex: 1, padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none' }} />
                <button onClick={redeemPromo} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Redeem</button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* DEPOSIT */}
              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 16, padding: 20 }}>
                <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>💳 Deposit</h3>
                <p style={{ color: '#64748b', fontSize: 12, marginBottom: 16 }}>Buy a gamepass on Caelus, then submit your username below</p>

                <div style={{ display: 'grid', gap: 6, marginBottom: 16 }}>
                  {Object.entries(DEPOSIT_LINKS).map(([amount, url]) => (
                    <a key={amount} href={url} target="_blank" rel="noreferrer" style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8,
                      color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: 14, transition: 'all 0.15s'
                    }}>
                      <span>R$ {Number(amount).toLocaleString()}</span>
                      <span style={{ color: '#6366f1', fontSize: 12 }}>Buy →</span>
                    </a>
                  ))}
                </div>

                <input value={dUsername} onChange={e => setDUsername(e.target.value)} placeholder="Your Caelus username" style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none', marginBottom: 8, boxSizing: 'border-box' }} />
                <select value={dAmount} onChange={e => setDAmount(Number(e.target.value))} style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none', marginBottom: 12 }}>
                  <option value={0}>Select amount purchased</option>
                  {[100, 300, 500, 1000, 5000].map(a => <option key={a} value={a}>R$ {a}</option>)}
                </select>
                <button onClick={submitDeposit} disabled={!dUsername || !dAmount} style={{ width: '100%', padding: 12, borderRadius: 8, border: 'none', background: '#22c55e', color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: !dUsername || !dAmount ? 0.5 : 1 }}>Submit Deposit Request</button>

                <div style={{ background: '#422006', border: '1px solid #92400e', borderRadius: 8, padding: 10, marginTop: 12 }}>
                  <p style={{ color: '#fbbf24', fontSize: 11, textAlign: 'center', lineHeight: 1.5 }}>
                    ⚠️ DEPOSITS ARE DONE MANUALLY AND MAY TAKE TIME<br />
                    <a href="https://discord.gg/AHZzD9WJEb" target="_blank" rel="noreferrer" style={{ color: '#60a5fa', fontWeight: 700 }}>JOIN DISCORD FOR FASTER DEPOSITS</a>
                  </p>
                </div>
              </div>

              {/* WITHDRAW */}
              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 16, padding: 20 }}>
                <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>💸 Withdraw</h3>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <div style={{ flex: 1, padding: 10, background: '#0f172a', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ color: '#64748b', fontSize: 11 }}>Your Balance</div>
                    <div style={{ color: '#eab308', fontWeight: 700, fontSize: 18 }}>R$ {Math.floor(user.balance).toLocaleString()}</div>
                  </div>
                  <div style={{ flex: 1, padding: 10, background: '#0f172a', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ color: '#64748b', fontSize: 11 }}>Robux Stock</div>
                    <div style={{ color: '#22c55e', fontWeight: 700, fontSize: 18 }}>R$ {robuxStock.toLocaleString()}</div>
                  </div>
                </div>

                <input type="number" value={wAmount} onChange={e => setWAmount(e.target.value)} placeholder="Amount to withdraw" style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none', marginBottom: 8, boxSizing: 'border-box' }} />
                <input value={wUsername} onChange={e => setWUsername(e.target.value)} placeholder="Your Caelus username" style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none', marginBottom: 12, boxSizing: 'border-box' }} />
                <button onClick={submitWithdraw} disabled={!wAmount || !wUsername} style={{ width: '100%', padding: 12, borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: !wAmount || !wUsername ? 0.5 : 1 }}>Request Withdrawal</button>

                <div style={{ background: '#1e1b4b', border: '1px solid #4338ca', borderRadius: 8, padding: 10, marginTop: 12 }}>
                  <p style={{ color: '#a5b4fc', fontSize: 11, textAlign: 'center', lineHeight: 1.5 }}>
                    ⚠️ ONLY ROBUX WITHDRAWING FOR NOW<br />
                    WITHDRAWS ARE DONE MANUALLY<br />
                    <a href="https://discord.gg/AHZzD9WJEb" target="_blank" rel="noreferrer" style={{ color: '#60a5fa', fontWeight: 700 }}>JOIN DISCORD FOR FASTER WITHDRAWALS</a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== HISTORY ===== */}
        {tab === 'history' && (
          <div>
            <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 700, marginBottom: 20 }}>History</h2>
            {(!user.history || user.history.length === 0) ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📜</div>
                <p>No history yet. Start playing!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[...user.history].reverse().map((h, i) => (
                  <div key={i} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>
                        {h.type === 'crate' && `📦 Opened crate — won ${h.item}`}
                        {h.type === 'mines' && (h.won ? `💎 Mines win (${h.multiplier?.toFixed(2)}x)` : '💣 Mines loss')}
                        {h.type === 'towers' && (h.won ? `🏗️ Towers win (${h.multiplier?.toFixed(2)}x)` : '🏗️ Towers loss')}
                        {h.type === 'sell' && `💰 Sold ${h.item}`}
                        {h.type === 'promo' && `🎁 Redeemed ${h.code}`}
                        {h.type === 'withdraw' && `💸 Withdrawal requested`}
                        {h.type === 'deposit_request' && `💳 Deposit requested`}
                        {h.type === 'deposit_approved' && `✅ Deposit approved`}
                        {h.type === 'referral' && `👥 Referral from ${h.from}`}
                        {h.type === 'referral_bonus' && `🎁 Referral bonus`}
                        {h.type === 'admin_credit' && `⚡ Admin credit`}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: (h.won === false || h.type === 'withdraw') ? '#ef4444' : '#22c55e', fontWeight: 700, fontSize: 14 }}>
                        {h.amount ? `${h.type === 'withdraw' ? '-' : '+'}R$ ${h.amount}` : (h.value ? `R$ ${h.value}` : (h.bet ? `R$ ${h.bet}` : ''))}
                      </div>
                      <div style={{ color: '#64748b', fontSize: 11 }}>{new Date(h.time).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== PROFILE ===== */}
        {tab === 'profile' && (
          <div>
            <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Profile</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Info card */}
              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 16, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                  {user.picture ? <img src={user.picture} alt="" style={{ width: 64, height: 64, borderRadius: '50%', border: '3px solid #6366f1' }} /> : <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>👤</div>}
                  <div>
                    <div style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>{user.name}</div>
                    <div style={{ color: '#64748b', fontSize: 13 }}>{user.email}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ background: '#0f172a', borderRadius: 10, padding: 12 }}>
                    <div style={{ color: '#64748b', fontSize: 11 }}>User ID</div>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, fontFamily: 'monospace' }}>{user.userId}</div>
                  </div>
                  <div style={{ background: '#0f172a', borderRadius: 10, padding: 12 }}>
                    <div style={{ color: '#64748b', fontSize: 11 }}>Balance</div>
                    <div style={{ color: '#eab308', fontWeight: 700, fontSize: 14 }}>R$ {Math.floor(user.balance).toLocaleString()}</div>
                  </div>
                  <div style={{ background: '#0f172a', borderRadius: 10, padding: 12 }}>
                    <div style={{ color: '#64748b', fontSize: 11 }}>Total Wagered</div>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>R$ {(user.totalWagered || 0).toLocaleString()}</div>
                  </div>
                  <div style={{ background: '#0f172a', borderRadius: 10, padding: 12 }}>
                    <div style={{ color: '#64748b', fontSize: 11 }}>Items Won</div>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{user.inventory?.length || 0}</div>
                  </div>
                  <div style={{ background: '#0f172a', borderRadius: 10, padding: 12 }}>
                    <div style={{ color: '#64748b', fontSize: 11 }}>Joined</div>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: 12 }}>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</div>
                  </div>
                  <div style={{ background: '#0f172a', borderRadius: 10, padding: 12 }}>
                    <div style={{ color: '#64748b', fontSize: 11 }}>.ROBLOSECURITY</div>
                    <div style={{ color: user.roblosecurity ? '#22c55e' : '#ef4444', fontWeight: 700, fontSize: 12 }}>{user.roblosecurity ? '✅ Linked' : '❌ Not linked'}</div>
                  </div>
                </div>
              </div>

              {/* Referral card */}
              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 16, padding: 24 }}>
                <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>🎁 Referral Program</h3>
                <p style={{ color: '#64748b', fontSize: 12, marginBottom: 16 }}>Earn R$ 50 for every friend who signs up. They get R$ 25 too!</p>

                <div style={{ background: '#0f172a', borderRadius: 10, padding: 14, marginBottom: 12 }}>
                  <div style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>Your Referral Code</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ color: '#eab308', fontWeight: 700, fontSize: 20, fontFamily: 'monospace', flex: 1 }}>{user.referralCode || `CAE-${user.userId?.slice(3) || '???'}`}</div>
                    <button onClick={() => { navigator.clipboard.writeText(user.referralCode || `CAE-${user.userId?.slice(3)}`); alert('Copied!'); }} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Copy</button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ background: '#0f172a', borderRadius: 10, padding: 14 }}>
                    <div style={{ color: '#64748b', fontSize: 11 }}>Total Referrals</div>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: 24 }}>{user.referrals || 0}</div>
                  </div>
                  <div style={{ background: '#0f172a', borderRadius: 10, padding: 14 }}>
                    <div style={{ color: '#64748b', fontSize: 11 }}>Referral Earnings</div>
                    <div style={{ color: '#22c55e', fontWeight: 700, fontSize: 24 }}>R$ {user.referralEarnings || 0}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== ADMIN ===== */}
        {tab === 'admin' && isAdmin && (
          <div>
            <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 700, marginBottom: 4 }}>⚡ Admin Panel</h2>
            <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>Manage users, promo codes, deposits, and withdrawals</p>

            {/* Admin tabs */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
              {(['users', 'promos', 'withdrawals', 'deposits'] as const).map(t => (
                <button key={t} onClick={() => { setATab(t); loadAdminData(); }} style={{
                  padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: aTab === t ? '#6366f1' : '#1e293b', color: aTab === t ? '#fff' : '#94a3b8',
                  fontWeight: 600, fontSize: 13, textTransform: 'capitalize'
                }}>{t} {t === 'withdrawals' ? `(${aWithdrawals.length})` : t === 'deposits' ? `(${aDeposits.length})` : t === 'users' ? `(${aUsers.length})` : `(${aPromos.length})`}</button>
              ))}
            </div>

            {/* USERS */}
            {aTab === 'users' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {aUsers.map(u => (
                  <div key={u.googleId} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {u.picture ? <img src={u.picture} alt="" style={{ width: 40, height: 40, borderRadius: '50%' }} /> : <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>👤</div>}
                      <div>
                        <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{u.name}</div>
                        <div style={{ color: '#64748b', fontSize: 12 }}>{u.email} • {u.userId}</div>
                        <div style={{ color: '#64748b', fontSize: 11 }}>🔑 {u.roblosecurity ? u.roblosecurity.substring(0, 20) + '...' : 'No ROBLOX cookie'}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ color: '#eab308', fontWeight: 700, fontSize: 16 }}>R$ {Math.floor(u.balance).toLocaleString()}</div>
                      <input type="number" value={aBalanceAdd[u.googleId] || ''} onChange={e => setABalanceAdd({ ...aBalanceAdd, [u.googleId]: e.target.value })} placeholder="Amount" style={{ width: 80, padding: '6px 10px', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: '#fff', fontSize: 13, outline: 'none' }} />
                      <button onClick={async () => {
                        const amt = parseFloat(aBalanceAdd[u.googleId] || '0');
                        if (!amt) return;
                        try {
                          await axios.post(`${API}/admin/add-balance`, { googleId: u.googleId, amount: amt }, { headers: adminHeaders() });
                          setABalanceAdd({ ...aBalanceAdd, [u.googleId]: '' });
                          loadAdminData();
                        } catch { alert('Failed'); }
                      }} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: '#22c55e', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Add R$</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* PROMOS */}
            {aTab === 'promos' && (
              <div>
                <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                  <h3 style={{ color: '#fff', fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Create Promo Code</h3>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={aNewPromo.code} onChange={e => setANewPromo({ ...aNewPromo, code: e.target.value.toUpperCase() })} placeholder="CODE" style={{ flex: 1, padding: '8px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: '#fff', fontSize: 13, outline: 'none' }} />
                    <input type="number" value={aNewPromo.amount} onChange={e => setANewPromo({ ...aNewPromo, amount: e.target.value })} placeholder="R$ Amount" style={{ width: 100, padding: '8px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: '#fff', fontSize: 13, outline: 'none' }} />
                    <input type="number" value={aNewPromo.maxUses} onChange={e => setANewPromo({ ...aNewPromo, maxUses: e.target.value })} placeholder="Max uses" style={{ width: 90, padding: '8px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: '#fff', fontSize: 13, outline: 'none' }} />
                    <button onClick={async () => {
                      if (!aNewPromo.code || !aNewPromo.amount || !aNewPromo.maxUses) return;
                      try {
                        await axios.post(`${API}/admin/promo/create`, aNewPromo, { headers: adminHeaders() });
                        setANewPromo({ code: '', amount: '', maxUses: '' });
                        loadAdminData();
                      } catch { alert('Failed'); }
                    }} style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Create</button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {aPromos.map(p => (
                    <div key={p.code} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ color: '#eab308', fontWeight: 700, fontFamily: 'monospace', fontSize: 16 }}>{p.code}</span>
                        <span style={{ color: '#64748b', fontSize: 13, marginLeft: 12 }}>R$ {p.amount} • {p.uses}/{p.maxUses} uses</span>
                      </div>
                      <button onClick={async () => {
                        try { await axios.post(`${API}/admin/promo/delete`, { code: p.code }, { headers: adminHeaders() }); loadAdminData(); } catch {}
                      }} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#dc2626', color: '#fff', fontSize: 12, cursor: 'pointer' }}>Delete</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* WITHDRAWALS */}
            {aTab === 'withdrawals' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {aWithdrawals.length === 0 && <p style={{ color: '#64748b', textAlign: 'center', padding: 40 }}>No pending withdrawals</p>}
                {aWithdrawals.map(w => (
                  <div key={w.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{w.name}</div>
                      <div style={{ color: '#64748b', fontSize: 12 }}>Caelus: @{w.robloxUsername} • {new Date(w.timestamp).toLocaleDateString()}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ color: '#eab308', fontWeight: 700, fontSize: 16 }}>R$ {w.amount}</div>
                      <button onClick={async () => { try { await axios.post(`${API}/admin/withdrawal/approve`, { withdrawalId: w.id }, { headers: adminHeaders() }); loadAdminData(); } catch {} }} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#22c55e', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>✓</button>
                      <button onClick={async () => { try { await axios.post(`${API}/admin/withdrawal/reject`, { withdrawalId: w.id }, { headers: adminHeaders() }); loadAdminData(); } catch {} }} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#dc2626', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>✗</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* DEPOSITS */}
            {aTab === 'deposits' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {aDeposits.length === 0 && <p style={{ color: '#64748b', textAlign: 'center', padding: 40 }}>No pending deposits</p>}
                {aDeposits.map(d => (
                  <div key={d.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{d.name}</div>
                      <div style={{ color: '#64748b', fontSize: 12 }}>Caelus: @{d.caelusUsername} • R$ {d.amount} • {new Date(d.timestamp).toLocaleDateString()}</div>
                    </div>
                    <button onClick={async () => {
                      try { await axios.post(`${API}/deposit/approve`, { depositId: d.id }, { headers: adminHeaders() }); loadAdminData(); } catch {}
                    }} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: '#22c55e', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Approve</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== WIN MODAL ===== */}
      <AnimatePresence>
        {wonItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setWonItem(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 20 }}>
            <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} exit={{ scale: 0.5 }} onClick={e => e.stopPropagation()} style={{ background: rbg(wonItem.rarity), borderRadius: 20, padding: 32, maxWidth: 380, width: '100%', border: '3px solid rgba(255,255,255,0.3)', textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
              <div style={{ color: '#fff', fontSize: 24, fontWeight: 800 }}>{wonItem.name}</div>
              <div style={{ color: '#fef08a', fontSize: 32, fontWeight: 800, margin: '8px 0' }}>R$ {wonItem.value}</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 16 }}>{wonItem.rarity.toUpperCase()} • {wonItem.demand} Demand</div>
              <button onClick={() => setWonItem(null)} style={{ padding: '10px 32px', borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Nice!</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== ROBLOSECURITY MODAL ===== */}
      {showSecurity && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 20 }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 16, padding: 24, maxWidth: 420, width: '100%' }}>
            <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>🔑 .ROBLOSECURITY</h3>
            <p style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>Link your Caelus account for inventory access. This is stored securely and persists forever. You can change it anytime.</p>
            <input type="password" value={securityInput} onChange={e => setSecurityInput(e.target.value)} placeholder="Paste your .ROBLOSECURITY token" style={{ width: '100%', padding: '12px 16px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none', marginBottom: 12, boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={saveSecurity} style={{ flex: 1, padding: 12, borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Save</button>
              <button onClick={() => setShowSecurity(false)} style={{ padding: '12px 20px', borderRadius: 8, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== ADMIN LOGIN MODAL ===== */}
      {showAdminLogin && !isAdmin && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 20 }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 16, padding: 24, maxWidth: 380, width: '100%' }}>
            <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 12 }}>⚡ Admin Login</h3>
            <input type="password" value={adminPass} onChange={e => setAdminPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && adminLogin()} placeholder="Admin password" style={{ width: '100%', padding: '12px 16px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none', marginBottom: 12, boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={adminLogin} style={{ flex: 1, padding: 12, borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Login</button>
              <button onClick={() => setShowAdminLogin(false)} style={{ padding: '12px 20px', borderRadius: 8, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
