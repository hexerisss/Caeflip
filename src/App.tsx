import { useState, useEffect } from 'react';
import {
  DollarSign, LogOut, Package, Gift, Globe, Trophy, Key, Crown,
  History, Shield, Zap, X
} from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { GoogleOAuthProvider } from '@react-oauth/google';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import './index.css';

const API_URL = 'http://localhost:3001/api';

// Constants & Data
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

const CASES = [
  { id: 'starter', name: 'Starter Crate', price: 100, items: ITEMS, description: 'All items available' },
  { id: 'pro', name: 'Pro Case', price: 500, items: ITEMS.filter(i => i.value >= 300), description: 'Items worth $300+' },
  { id: 'legendary', name: 'Legendary Pack', price: 1500, items: ITEMS.filter(i => i.value >= 1000), description: 'Items worth $1000+' },
  { id: 'godly', name: 'Godly Box', price: 3000, items: ITEMS.filter(i => i.value >= 2500), description: 'Items worth $2500+' }
];

// Utility Functions
const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'legendary': return 'from-yellow-400 to-orange-400';
    case 'epic': return 'from-purple-400 to-pink-400';
    case 'rare': return 'from-blue-400 to-cyan-400';
    case 'uncommon': return 'from-green-400 to-emerald-400';
    default: return 'from-gray-400 to-gray-500';
  }
};

const getRarityBorder = (rarity: string) => {
  switch (rarity) {
    case 'legendary': return 'border-yellow-500/50 shadow-yellow-500/20';
    case 'epic': return 'border-purple-500/50 shadow-purple-500/20';
    case 'rare': return 'border-blue-500/50 shadow-blue-500/20';
    case 'uncommon': return 'border-green-500/50 shadow-green-500/20';
    default: return 'border-gray-500/50 shadow-gray-500/20';
  }
};

const getDemandColor = (demand: string) => {
  switch (demand) {
    case 'High': return 'text-emerald-400';
    case 'Mid': return 'text-yellow-400';
    case 'Low': return 'text-orange-400';
    case 'Horrendous': return 'text-red-400';
    default: return 'text-gray-400';
  }
};

// API Functions
const api = {
  auth: {
    google: async (credential: string) => {
      const res = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential })
      });
      return res.json();
    }
  },
  user: {
    get: async (userId: string) => {
      const res = await fetch(`${API_URL}/user/${userId}`);
      return res.json();
    },
    updateCookie: async (userId: string, cookie: string) => {
      const res = await fetch(`${API_URL}/user/${userId}/cookie`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cookie })
      });
      return res.json();
    }
  },
  crate: {
    open: async (userId: string, caseId: string) => {
      const res = await fetch(`${API_URL}/crate/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, caseId })
      });
      return res.json();
    }
  },
  promo: {
    redeem: async (userId: string, code: string) => {
      const res = await fetch(`${API_URL}/promo/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code })
      });
      return res.json();
    },
    getAll: async () => {
      const res = await fetch(`${API_URL}/promo/all`);
      return res.json();
    },
    create: async (code: string, amount: number, uses: number) => {
      const res = await fetch(`${API_URL}/promo/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, amount, uses })
      });
      return res.json();
    },
    delete: async (code: string) => {
      const res = await fetch(`${API_URL}/promo/${code}`, { method: 'DELETE' });
      return res.json();
    }
  },
  withdraw: {
    submit: async (userId: string, robuxAmount: number, username: string) => {
      const res = await fetch(`${API_URL}/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, robuxAmount, username })
      });
      return res.json();
    },
    getAll: async () => {
      const res = await fetch(`${API_URL}/withdrawals`);
      return res.json();
    },
    update: async (id: string, action: 'approve' | 'reject') => {
      const res = await fetch(`${API_URL}/withdraw/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      return res.json();
    }
  },
  admin: {
    getUsers: async () => {
      const res = await fetch(`${API_URL}/admin/users`);
      return res.json();
    },
    addBalance: async (userId: string, amount: number) => {
      const res = await fetch(`${API_URL}/admin/user/${userId}/balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
      return res.json();
    }
  }
};

// Main App Component
function CaeflipApp() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [roblosecurity, setRoblosecurity] = useState('');
  const [balance, setBalance] = useState(0);
  const [inventory, setInventory] = useState<any[]>([]);
  const [page, setPage] = useState('crates');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showCookieModal, setShowCookieModal] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [wonItem, setWonItem] = useState<any>(null);
  const [showWinModal, setShowWinModal] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allPromos, setAllPromos] = useState<any[]>([]);
  const [allWithdrawals, setAllWithdrawals] = useState<any[]>([]);
  const [newPromoCode, setNewPromoCode] = useState({ code: '', amount: 100, uses: 10 });
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawUsername, setWithdrawUsername] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Load user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('caeflip_user');
    const storedToken = localStorage.getItem('caeflip_token');
    const storedRoblosecurity = localStorage.getItem('caeflip_roblosecurity');
    
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
      if (storedRoblosecurity) {
        setRoblosecurity(storedRoblosecurity);
      } else {
        setShowCookieModal(true);
      }
    }
  }, []);

  // Save user to localStorage
  useEffect(() => {
    if (user && token) {
      localStorage.setItem('caeflip_user', JSON.stringify(user));
      localStorage.setItem('caeflip_token', token);
    }
    if (roblosecurity) {
      localStorage.setItem('caeflip_roblosecurity', roblosecurity);
    }
  }, [user, token, roblosecurity]);

  // Show notification
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Handle Google Login
  const handleGoogleLogin = async (credential: any) => {
    try {
      const result = await api.auth.google(credential.credential);
      if (result.success) {
        setUser(result.user);
        setToken(result.token);
        setBalance(result.user.balance);
        setInventory(result.user.inventory || []);
        
        if (!result.user.robloxCookie) {
          setShowCookieModal(true);
        }
        
        localStorage.setItem('caeflip_user', JSON.stringify(result.user));
        localStorage.setItem('caeflip_token', result.token);
        showNotification('Login successful!', 'success');
      } else {
        showNotification('Authentication failed', 'error');
      }
    } catch (error) {
      showNotification('Login failed. Please try again.', 'error');
    }
  };

  // Update Roblox Cookie
  const handleUpdateCookie = async () => {
    if (!user || !roblosecurity.trim()) return;
    
    try {
      const result = await api.user.updateCookie(user.id, roblosecurity);
      if (result.success) {
        setUser(result.user);
        setShowCookieModal(false);
        showNotification('Cookie saved successfully!', 'success');
      }
    } catch (error) {
      showNotification('Failed to save cookie', 'error');
    }
  };

  // Open Crate
  const openCase = async (caseItem: any) => {
    if (!user || balance < caseItem.price || spinning) return;
    
    setSpinning(true);
    
    try {
      const result = await api.crate.open(user.id, caseItem.id);
      if (result.success) {
        setBalance(result.newBalance);
        setInventory(result.inventory);
        
        if (result.item) {
          setWonItem(result.item);
          setShowWinModal(true);
          
          // Trigger confetti
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
        
        showNotification(result.item ? `Won ${result.item.name}!` : 'Better luck next time!', result.item ? 'success' : 'error');
      } else {
        showNotification(result.error || 'Failed to open crate', 'error');
      }
    } catch (error) {
      showNotification('Failed to open crate', 'error');
    }
    
    setSpinning(false);
  };

  // Redeem Promo Code
  const redeemPromoCode = async () => {
    if (!user || !promoCode.trim()) return;
    
    try {
      const result = await api.promo.redeem(user.id, promoCode);
      if (result.success) {
        setBalance(result.balance);
        setPromoCode('');
        showNotification(`Redeemed ${result.amount} R$!`, 'success');
      } else {
        showNotification(result.error || 'Invalid code', 'error');
      }
    } catch (error) {
      showNotification('Failed to redeem code', 'error');
    }
  };

  // Submit Withdrawal
  const submitWithdrawal = async () => {
    if (!user || !withdrawAmount || !withdrawUsername) return;
    
    const amount = parseInt(withdrawAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    try {
      const result = await api.withdraw.submit(user.id, amount, withdrawUsername);
      if (result.success) {
        setBalance(result.newBalance || balance - amount);
        setWithdrawAmount('');
        setWithdrawUsername('');
        showNotification('Withdrawal request submitted!', 'success');
      } else {
        showNotification(result.error || 'Failed to submit withdrawal', 'error');
      }
    } catch (error) {
      showNotification('Failed to submit withdrawal', 'error');
    }
  };

  // Admin Functions
  const handleAdminLogin = async () => {
    if (adminPass === 'kerimpro') {
      setIsAdmin(true);
      setShowAdminModal(false);
      setAdminPass('');
      loadAdminData();
    } else {
      showNotification('Invalid admin password', 'error');
    }
  };

  const loadAdminData = async () => {
    try {
      const [users, promos, withdrawals] = await Promise.all([
        api.admin.getUsers(),
        api.promo.getAll(),
        api.withdraw.getAll()
      ]);
      
      if (users.success) setAllUsers(users.users);
      if (promos.success) setAllPromos(promos.promos);
      if (withdrawals.success) setAllWithdrawals(withdrawals.withdrawals);
    } catch (error) {
      console.error('Failed to load admin data');
    }
  };

  const handleAddBalance = async (userId: string, amount: number) => {
    try {
      const result = await api.admin.addBalance(userId, amount);
      if (result.success) {
        loadAdminData();
        showNotification(`Added ${amount} R$ to user`, 'success');
      }
    } catch (error) {
      showNotification('Failed to add balance', 'error');
    }
  };

  const handleCreatePromo = async () => {
    if (!newPromoCode.code || !newPromoCode.amount || !newPromoCode.uses) return;
    
    try {
      const result = await api.promo.create(newPromoCode.code, newPromoCode.amount, newPromoCode.uses);
      if (result.success) {
        setAllPromos(prev => [...prev, result.promo]);
        setNewPromoCode({ code: '', amount: 100, uses: 10 });
        showNotification('Promo code created!', 'success');
      }
    } catch (error) {
      showNotification('Failed to create promo code', 'error');
    }
  };

  const handleDeletePromo = async (code: string) => {
    try {
      await api.promo.delete(code);
      setAllPromos(prev => prev.filter(p => p.code !== code));
      showNotification('Promo code deleted', 'success');
    } catch (error) {
      showNotification('Failed to delete promo code', 'error');
    }
  };

  const handleWithdrawalAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      const result = await api.withdraw.update(id, action);
      if (result.success) {
        loadAdminData();
        showNotification(`Withdrawal ${action}d`, 'success');
      }
    } catch (error) {
      showNotification('Failed to update withdrawal', 'error');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setBalance(0);
    setInventory([]);
    localStorage.removeItem('caeflip_user');
    localStorage.removeItem('caeflip_token');
    setPage('crates');
  };

  // Render Functions
  const renderCrates = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black text-white mb-2">CRATE OPENING</h2>
          <p className="text-gray-400">Open crates and win valuable items!</p>
        </div>
        {spinning && (
          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-xl animate-pulse">
            <Zap size={20} />
            <span className="font-bold">Spinning...</span>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showWinModal && wonItem && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          >
            <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-8 rounded-3xl border-2 border-yellow-500/50 w-[500px] text-center shadow-2xl shadow-yellow-500/30">
              <motion.div
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                className={`bg-gradient-to-br ${getRarityColor(wonItem.rarity)} p-8 rounded-2xl mb-6`}
              >
                <Crown size={80} className="text-white mx-auto mb-4" />
                <h3 className="text-3xl font-black text-white mb-2">YOU WON!</h3>
                <p className="text-2xl font-bold text-white">{wonItem.name}</p>
                <p className="text-xl text-white/80 mt-2">+{wonItem.value} R$</p>
              </motion.div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-gray-800/50 rounded-xl">
                  <p className="text-gray-400 text-sm">Rarity</p>
                  <p className={`font-bold capitalize ${wonItem.rarity === 'legendary' ? 'text-yellow-400' : wonItem.rarity === 'epic' ? 'text-purple-400' : 'text-blue-400'}`}>
                    {wonItem.rarity}
                  </p>
                </div>
                <div className="p-4 bg-gray-800/50 rounded-xl">
                  <p className="text-gray-400 text-sm">Demand</p>
                  <p className={`font-bold ${getDemandColor(wonItem.demand)}`}>{wonItem.demand}</p>
                </div>
              </div>
              <button
                onClick={() => setShowWinModal(false)}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 py-4 rounded-xl font-bold text-lg hover:from-indigo-500 hover:to-purple-500 transition-all"
              >
                Awesome!
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {CASES.map((caseItem) => (
          <motion.div
            key={caseItem.id}
            whileHover={{ y: -5 }}
            className={`bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-6 rounded-2xl border border-[#2a2a3e] hover:border-indigo-500/50 transition-all group`}
          >
            <div className="aspect-square rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-4 group-hover:from-indigo-500/30 group-hover:to-purple-500/30 transition-all">
              <Package size={56} className="text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{caseItem.name}</h3>
            <p className="text-gray-400 text-sm mb-4">{caseItem.description}</p>
            <div className="flex items-center justify-between mb-6">
              <span className="text-gray-400">Price:</span>
              <span className="text-emerald-400 font-bold text-2xl">{caseItem.price} R$</span>
            </div>
            <button
              onClick={() => openCase(caseItem)}
              disabled={balance < caseItem.price || spinning}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                balance < caseItem.price
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white'
              }`}
            >
              {balance < caseItem.price ? 'Insufficient Balance' : spinning ? 'Opening...' : 'Open Crate'}
            </button>
          </motion.div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-8 rounded-2xl border border-[#2a2a3e]">
        <h3 className="text-2xl font-bold text-white mb-6">All Items ({ITEMS.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {ITEMS.map((item, index) => (
            <div key={index} className={`p-4 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border ${getRarityBorder(item.rarity)}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`font-bold bg-gradient-to-r ${getRarityColor(item.rarity)} bg-clip-text text-transparent`}>
                  {item.name}
                </span>
                <span className="text-emerald-400 font-bold">{item.value} R$</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className={`capitalize font-medium ${
                  item.rarity === 'legendary' ? 'text-yellow-400' :
                  item.rarity === 'epic' ? 'text-purple-400' :
                  item.rarity === 'rare' ? 'text-blue-400' :
                  'text-gray-400'
                }`}>
                  {item.rarity}
                </span>
                <span className={getDemandColor(item.demand)}>{item.demand}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMines = () => (
    <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-8 rounded-2xl border border-[#2a2a3e]">
      <h2 className="text-4xl font-black text-white mb-6">MINES</h2>
      <div className="text-center py-12">
        <div className="w-40 h-40 mx-auto mb-8 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-3xl flex items-center justify-center">
          <Zap size={80} className="text-red-400" />
        </div>
        <h3 className="text-3xl font-bold text-white mb-4">Coming Soon!</h3>
        <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
          Mines game mode is under development. Avoid the bombs and multiply your winnings!
        </p>
        <div className="flex justify-center gap-6">
          <div className="p-6 rounded-2xl bg-gray-800/50 text-center">
            <div className="text-2xl font-bold text-emerald-400">Easy</div>
            <div className="text-sm text-gray-400 mt-1">3 Bombs</div>
          </div>
          <div className="p-6 rounded-2xl bg-gray-800/50 text-center">
            <div className="text-2xl font-bold text-yellow-400">Medium</div>
            <div className="text-sm text-gray-400 mt-1">5 Bombs</div>
          </div>
          <div className="p-6 rounded-2xl bg-gray-800/50 text-center">
            <div className="text-2xl font-bold text-red-400">Hard</div>
            <div className="text-sm text-gray-400 mt-1">10 Bombs</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTowers = () => (
    <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-8 rounded-2xl border border-[#2a2a3e]">
      <h2 className="text-4xl font-black text-white mb-6">TOWERS</h2>
      <div className="text-center py-12">
        <div className="w-40 h-40 mx-auto mb-8 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl flex items-center justify-center">
          <Trophy size={80} className="text-purple-400" />
        </div>
        <h3 className="text-3xl font-bold text-white mb-4">Coming Soon!</h3>
        <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
          Climb the tower and avoid the bombs to multiply your winnings!
        </p>
        <div className="flex justify-center gap-6">
          <div className="p-6 rounded-2xl bg-gray-800/50 text-center">
            <div className="text-2xl font-bold text-emerald-400">Easy</div>
            <div className="text-sm text-gray-400 mt-1">3 Tiles, 2 Safe</div>
          </div>
          <div className="p-6 rounded-2xl bg-gray-800/50 text-center">
            <div className="text-2xl font-bold text-yellow-400">Medium</div>
            <div className="text-sm text-gray-400 mt-1">4 Tiles, 1 Safe</div>
          </div>
          <div className="p-6 rounded-2xl bg-gray-800/50 text-center">
            <div className="text-2xl font-bold text-red-400">Hard</div>
            <div className="text-sm text-gray-400 mt-1">5 Tiles, 1 Safe</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderWithdraw = () => (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-8 rounded-2xl border border-[#2a2a3e]">
        <h2 className="text-4xl font-black text-white mb-6">WITHDRAW ROBUX</h2>
        
        <div className="mb-8 p-6 bg-yellow-500/10 border-2 border-yellow-500/30 rounded-2xl">
          <p className="text-yellow-400 font-bold text-lg mb-2">⚠️ IMPORTANT NOTICE</p>
          <p className="text-gray-300 mb-4">
            <strong>ONLY ROBUX WITHDRAWING FOR NOW.</strong>
          </p>
          <p className="text-gray-300 mb-4">
            WITHDRAWS AND DEPOSITS ARE DONE <span className="text-yellow-400 font-bold">MANUALLY</span> AND MAY TAKE A LOT OF TIME.
          </p>
          <p className="text-gray-300">
            JOIN OUR DISCORD FOR FASTER PROCESSING:{" "}
            <a href="https://discord.gg/AHZzD9WJEb" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline">
              https://discord.gg/AHZzD9WJEb
            </a>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-gray-400 mb-2 font-medium">Roblox Username</label>
            <input
              type="text"
              value={withdrawUsername}
              onChange={(e) => setWithdrawUsername(e.target.value)}
              placeholder="Enter your Roblox username"
              className="w-full bg-[#0a0a0c] border border-[#2a2a3e] p-4 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-2 font-medium">Amount to Withdraw (R$)</label>
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="Minimum 100 R$"
              className="w-full bg-[#0a0a0c] border border-[#2a2a3e] p-4 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <button
          onClick={submitWithdrawal}
          disabled={!withdrawAmount || !withdrawUsername || balance < parseInt(withdrawAmount)}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
            !withdrawAmount || !withdrawUsername || balance < parseInt(withdrawAmount)
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white'
          }`}
        >
          Submit Withdrawal Request
        </button>
      </div>

      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-8 rounded-2xl border border-[#2a2a3e]">
        <h3 className="text-2xl font-bold text-white mb-6">Withdrawal History</h3>
        {allWithdrawals.filter(w => w.userId === user?.id).length === 0 ? (
          <div className="text-center py-12">
            <History size={64} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No withdrawal requests yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {allWithdrawals.filter(w => w.userId === user?.id).map((req) => (
              <div key={req.id} className="p-6 rounded-xl bg-gray-800/50 flex items-center justify-between">
                <div>
                  <p className="text-white font-bold text-lg">{req.robuxAmount} R$</p>
                  <p className="text-gray-400 text-sm">To: {req.username}</p>
                  <p className="text-gray-500 text-sm">{new Date(req.createdAt).toLocaleString()}</p>
                </div>
                <span className={`px-4 py-2 rounded-full font-bold ${
                  req.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                  req.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderInventory = () => (
    <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-8 rounded-2xl border border-[#2a2a3e]">
      <h2 className="text-4xl font-black text-white mb-6">YOUR INVENTORY</h2>
      <div className="flex items-center justify-between mb-8">
        <p className="text-gray-400">Total Items: <span className="text-white font-bold">{inventory.length}</span></p>
        <p className="text-emerald-400 font-bold text-xl">Total Value: {inventory.reduce((sum, item) => sum + item.value, 0)} R$</p>
      </div>

      {inventory.length === 0 ? (
        <div className="text-center py-12">
          <Package size={80} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-2">Your inventory is empty</p>
          <p className="text-gray-500">Open some crates to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inventory.map((item, index) => (
            <motion.div
              key={item.id || index}
              whileHover={{ y: -3 }}
              className={`p-6 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border ${getRarityBorder(item.rarity)}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`font-bold bg-gradient-to-r ${getRarityColor(item.rarity)} bg-clip-text text-transparent`}>
                  {item.name}
                </span>
                <span className="text-emerald-400 font-bold">{item.value} R$</span>
              </div>
              <div className="flex items-center justify-between text-sm mb-4">
                <span className={`capitalize font-medium ${
                  item.rarity === 'legendary' ? 'text-yellow-400' :
                  item.rarity === 'epic' ? 'text-purple-400' :
                  'text-blue-400'
                }`}>
                  {item.rarity}
                </span>
                <span className={getDemandColor(item.demand)}>{item.demand}</span>
              </div>
              <button className="w-full py-3 rounded-lg bg-gray-700/50 text-gray-300 hover:text-white hover:bg-gray-700 transition-all">
                Withdraw Item
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

  const renderProfile = () => (
    <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-8 rounded-2xl border border-[#2a2a3e]">
      <h2 className="text-4xl font-black text-white mb-8">YOUR PROFILE</h2>

      {user ? (
        <div className="space-y-8">
          <div className="flex items-center gap-8">
            <img
              src={user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'Player')}&background=6366f1&color=fff&size=128`}
              className="w-32 h-32 rounded-2xl border-4 border-indigo-500/30"
              alt="Avatar"
            />
            <div>
              <h3 className="text-3xl font-bold text-white mb-2">{user.name}</h3>
              <p className="text-gray-400 text-lg mb-4">{user.email}</p>
              <div className="flex items-center gap-4">
                <div className="px-4 py-2 bg-indigo-500/20 rounded-full text-indigo-400 font-bold">
                  ID: {user.id}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 rounded-2xl bg-gray-800/50 text-center">
              <div className="text-4xl font-black text-emerald-400 mb-2">{balance.toFixed(2)} R$</div>
              <div className="text-gray-400 font-medium">Balance</div>
            </div>
            <div className="p-8 rounded-2xl bg-gray-800/50 text-center">
              <div className="text-4xl font-black text-white mb-2">{inventory.length}</div>
              <div className="text-gray-400 font-medium">Items Owned</div>
            </div>
            <div className="p-8 rounded-2xl bg-gray-800/50 text-center">
              <div className="text-4xl font-black text-yellow-400 mb-2">{allWithdrawals.filter(w => w.userId === user.id).length}</div>
              <div className="text-gray-400 font-medium">Withdrawals</div>
            </div>
          </div>

          <div className="p-8 rounded-2xl bg-gray-800/50">
            <h4 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <Shield size={28} className="text-indigo-400" />
              .ROBLOSECURITY Token
            </h4>
            <div className="flex gap-4">
              <input
                type="text"
                value={roblosecurity}
                onChange={(e) => setRoblosecurity(e.target.value)}
                placeholder="Enter your .ROBLOSECURITY token"
                className="flex-1 bg-[#0a0a0c] border border-[#2a2a3e] p-4 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
              />
              <button
                onClick={handleUpdateCookie}
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-bold hover:from-indigo-500 hover:to-purple-500 transition-all"
              >
                Save Token
              </button>
            </div>
            <p className="text-gray-500 text-sm mt-4">
              This token will be saved permanently and can be changed anytime. Required for account verification.
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">Please login to view your profile</p>
        </div>
      )}
    </div>
  );

  const renderAdminPanel = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-4xl font-black text-white">ADMIN PANEL</h2>
        <button
          onClick={() => setIsAdmin(false)}
          className="px-6 py-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 font-bold transition-all"
        >
          Exit Admin Mode
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Management */}
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-8 rounded-2xl border border-[#2a2a3e]">
          <h3 className="text-2xl font-bold text-white mb-6">User Management ({allUsers.length} users)</h3>
          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            {allUsers.map(u => (
              <div key={u.id} className="p-6 rounded-xl bg-gray-800/50 flex items-center justify-between">
                <div>
                  <p className="text-white font-bold text-lg">{u.name}</p>
                  <p className="text-gray-400 text-sm">Balance: <span className="text-emerald-400 font-bold">{u.balance} R$</span></p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAddBalance(u.id, 1000)}
                    className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 font-bold transition-all"
                  >
                    +1K
                  </button>
                  <button
                    onClick={() => handleAddBalance(u.id, 5000)}
                    className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 font-bold transition-all"
                  >
                    +5K
                  </button>
                  <button
                    onClick={() => handleAddBalance(u.id, 10000)}
                    className="px-4 py-2 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 font-bold transition-all"
                  >
                    +10K
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Promo Code Management */}
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-8 rounded-2xl border border-[#2a2a3e]">
          <h3 className="text-2xl font-bold text-white mb-6">Promo Code Management</h3>
          <div className="mb-8">
            <div className="grid grid-cols-1 gap-4 mb-4">
              <input
                type="text"
                value={newPromoCode.code}
                onChange={(e) => setNewPromoCode({ ...newPromoCode, code: e.target.value })}
                placeholder="Promo Code (e.g., WELCOME100)"
                className="w-full bg-[#0a0a0c] border border-[#2a2a3e] p-4 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  value={newPromoCode.amount}
                  onChange={(e) => setNewPromoCode({ ...newPromoCode, amount: parseInt(e.target.value) || 0 })}
                  placeholder="Amount (R$)"
                  className="w-full bg-[#0a0a0c] border border-[#2a2a3e] p-4 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                />
                <input
                  type="number"
                  value={newPromoCode.uses}
                  onChange={(e) => setNewPromoCode({ ...newPromoCode, uses: parseInt(e.target.value) || 0 })}
                  placeholder="Total Uses"
                  className="w-full bg-[#0a0a0c] border border-[#2a2a3e] p-4 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
            <button
              onClick={handleCreatePromo}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 py-4 rounded-xl font-bold text-lg hover:from-indigo-500 hover:to-purple-500 transition-all"
            >
              Create Promo Code
            </button>
          </div>

          <div className="space-y-4">
            {allPromos.map(promo => (
              <div key={promo.code} className="p-6 rounded-xl bg-gray-800/50 flex items-center justify-between">
                <div>
                  <p className="text-white font-bold text-lg">{promo.code}</p>
                  <p className="text-gray-400 text-sm">
                    Uses left: <span className="text-emerald-400 font-bold">{promo.usesLeft}</span> / {promo.totalUses}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-emerald-400 font-bold text-xl">{promo.amount} R$</span>
                  <button
                    onClick={() => handleDeletePromo(promo.code)}
                    className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Withdrawal Requests */}
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-8 rounded-2xl border border-[#2a2a3e] lg:col-span-2">
          <h3 className="text-2xl font-bold text-white mb-6">Withdrawal Requests ({allWithdrawals.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {allWithdrawals.map(req => (
              <div key={req.id} className="p-6 rounded-xl bg-gray-800/50">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-white font-bold text-lg">{req.username}</p>
                    <p className="text-gray-400 text-sm">{new Date(req.createdAt).toLocaleString()}</p>
                  </div>
                  <span className="text-emerald-400 font-bold text-2xl">{req.robuxAmount} R$</span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleWithdrawalAction(req.id, 'approve')}
                    className="flex-1 py-3 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 font-bold transition-all"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleWithdrawalAction(req.id, 'reject')}
                    className="flex-1 py-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 font-bold transition-all"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white font-sans antialiased">
      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl font-bold shadow-2xl ${
              notification.type === 'success'
                ? 'bg-emerald-500/90 text-white'
                : 'bg-red-500/90 text-white'
            }`}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="bg-[#0f0f12] border-b border-[#1f1f23] py-4 px-8 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Globe className="text-white" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-white">CAEFLIP</h1>
            <p className="text-xs text-gray-400">Caelus Gambling Platform</p>
          </div>
        </div>

        <div className="flex gap-1 text-sm font-semibold text-gray-400 bg-[#16161a] p-2 rounded-2xl border border-[#1f1f23]">
          {['crates', 'mines', 'towers', 'withdraw', 'inventory', 'profile'].map(tab => (
            <button
              key={tab}
              onClick={() => setPage(tab)}
              className={`px-5 py-2.5 rounded-xl transition-all capitalize ${
                page === tab
                  ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/30 text-white shadow-lg'
                  : 'hover:text-white hover:bg-gray-800/50'
              }`}
            >
              {tab}
            </button>
          ))}
          {isAdmin && (
            <button
              onClick={() => setPage('admin')}
              className={`px-5 py-2.5 rounded-xl transition-all ${
                page === 'admin'
                  ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 text-purple-400 shadow-lg'
                  : 'text-purple-400 hover:text-purple-300 hover:bg-purple-900/20'
              }`}
            >
              Admin
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-500/10 to-emerald-500/20 border border-emerald-500/30 px-5 py-3 rounded-xl">
                <DollarSign size={20} className="text-emerald-400" />
                <span className="font-mono text-emerald-400 font-black text-lg">{balance.toFixed(2)} R$</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowAdminModal(true)}
                  className="p-3 hover:bg-[#1f1f23] rounded-xl text-gray-400 hover:text-white transition-colors"
                  title="Admin Login"
                >
                  <Key size={20} />
                </button>

                <button
                  onClick={handleLogout}
                  className="p-3 hover:bg-[#1f1f23] rounded-xl text-gray-400 hover:text-white transition-colors"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>

                <img
                  src={user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'Player')}&background=6366f1&color=fff&size=64`}
                  className="w-12 h-12 rounded-xl border-2 border-indigo-500/30"
                  alt="Avatar"
                />
              </div>
            </>
          ) : (
            <div className="rounded-xl overflow-hidden">
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={() => showNotification('Google login failed. Please try again.', 'error')}
                useOneTap={false}
                theme="filled_black"
                size="large"
                text="signin_with"
                shape="rectangular"
              />
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-8 max-w-7xl mx-auto">
        {/* Promo Code Section */}
        {user && page !== 'admin' && (
          <div className="mb-8 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 p-6 rounded-2xl border border-indigo-500/30">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                  <Gift className="text-indigo-400" />
                  Redeem Promo Code
                </h3>
                <p className="text-gray-300">Enter a promo code to get free Robux!</p>
              </div>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Enter promo code"
                  className="bg-[#0a0a0c] border border-[#2a2a3e] px-6 py-4 rounded-xl text-white focus:border-indigo-500 focus:outline-none w-72"
                />
                <button
                  onClick={redeemPromoCode}
                  className="bg-gradient-to-r from-emerald-600 to-green-600 px-8 py-4 rounded-xl font-bold hover:from-emerald-500 hover:to-green-500 flex items-center gap-2 transition-all"
                >
                  <Gift size={20} />
                  Redeem
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Page Content */}
        {!user ? (
          <div className="text-center py-20">
            <div className="w-40 h-40 mx-auto mb-12 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-3xl flex items-center justify-center">
              <Globe size={100} className="text-indigo-400" />
            </div>
            <h2 className="text-6xl font-black text-white mb-6">WELCOME TO CAEFLIP</h2>
            <p className="text-gray-400 text-xl mb-12 max-w-3xl mx-auto">
              The ultimate Caelus gambling platform. Open crates, win valuable items, and climb the ranks!
              Start with 0 balance and work your way up to the top.
            </p>
            <div className="mx-auto w-fit rounded-xl overflow-hidden">
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={() => showNotification('Google login failed. Please try again.', 'error')}
                useOneTap={false}
                theme="filled_black"
                size="large"
                text="signin_with"
                shape="rectangular"
              />
            </div>
            <p className="text-gray-500 mt-8">After signing in, you'll need to provide your .ROBLOSECURITY token</p>
          </div>
        ) : page === 'crates' ? renderCrates() :
          page === 'mines' ? renderMines() :
          page === 'towers' ? renderTowers() :
          page === 'withdraw' ? renderWithdraw() :
          page === 'inventory' ? renderInventory() :
          page === 'profile' ? renderProfile() :
          page === 'admin' && isAdmin ? renderAdminPanel() :
          renderCrates()}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1f1f23] py-8 px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Globe size={20} className="text-indigo-400" />
              <span className="text-gray-400 font-medium">Caeflip © 2024</span>
            </div>
            <a
              href="https://discord.gg/AHZzD9WJEb"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors font-medium"
            >
              Discord Support
            </a>
          </div>
          <div className="text-gray-500 text-sm font-medium">
            Balance: <span className="text-emerald-400">{balance.toFixed(2)} R$</span> •
            Items: <span className="text-white">{inventory.length}</span> •
            70% House Edge
          </div>
        </div>
      </footer>

      {/* Admin Login Modal */}
      <AnimatePresence>
        {showAdminModal && !isAdmin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-8 rounded-3xl border-2 border-indigo-500/50 w-[450px]"
            >
              <h2 className="text-3xl font-black text-white mb-6">ADMIN ACCESS</h2>
              <input
                type="password"
                value={adminPass}
                onChange={(e) => setAdminPass(e.target.value)}
                placeholder="Enter admin password"
                className="w-full bg-[#0a0a0c] border border-[#2a2a3e] p-5 rounded-xl text-white text-lg focus:border-indigo-500 focus:outline-none mb-6"
              />
              <button
                onClick={handleAdminLogin}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 py-5 rounded-xl font-bold text-xl hover:from-indigo-500 hover:to-purple-500 transition-all"
              >
                Authenticate
              </button>
              <p className="text-gray-500 text-sm mt-6 text-center">Password: <span className="text-indigo-400 font-bold">kerimpro</span></p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cookie Modal */}
      <AnimatePresence>
        {showCookieModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-8 rounded-3xl border-2 border-indigo-500/50 w-[550px]"
            >
              <h2 className="text-3xl font-black text-white mb-4">LINK ROBLOX ACCOUNT</h2>
              <p className="text-gray-400 mb-6">
                Please enter your .ROBLOSECURITY token to verify your Caelus.lol account and enable full functionality.
              </p>
              <input
                type="text"
                value={roblosecurity}
                onChange={(e) => setRoblosecurity(e.target.value)}
                placeholder=".ROBLOSECURITY token"
                className="w-full bg-[#0a0a0c] border border-[#2a2a3e] p-5 rounded-xl text-white text-lg focus:border-indigo-500 focus:outline-none mb-6 font-mono"
              />
              <button
                onClick={handleUpdateCookie}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 py-5 rounded-xl font-bold text-xl hover:from-indigo-500 hover:to-purple-500 transition-all"
              >
                Save & Continue
              </button>
              <p className="text-gray-500 text-sm mt-6 text-center">
                This token is stored securely and can be changed anytime in your profile.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Wrap with Google OAuth Provider
export default function App() {
  return (
    <GoogleOAuthProvider clientId="365561042683-ipbq59a5ip4k37fhie29is9625rmmipp.apps.googleusercontent.com">
      <CaeflipApp />
    </GoogleOAuthProvider>
  );
}
