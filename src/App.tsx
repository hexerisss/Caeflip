import { useState, useEffect } from 'react';
import {
  DollarSign, LogOut, Package,
  Gift, Globe, Trophy, Key, Crown
} from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import './index.css';

// --- Constants & Data ---
const ALL_ITEMS = [
  { name: "The Classic ROBLOX Fedora", value: 5100, rarity: "legendary", demand: "High" },
  { name: "Tattletale", value: 4500, rarity: "legendary", demand: "Low" },
  { name: "Valkyrie Helm", value: 3100, rarity: "epic", demand: "Mid" },
  { name: "Gold Clockwork Headphones", value: 2500, rarity: "epic", demand: "Mid" },
  { name: "Soviet Ushanka", value: 2180, rarity: "epic", demand: "Mid" },
  { name: "Playful Vampire", value: 1600, rarity: "rare", demand: "Low" },
  { name: "Supa Dupa Fly Cap", value: 870, rarity: "uncommon", demand: "Low" },
  { name: "Evil Skeptic", value: 670, rarity: "uncommon", demand: "Mid" },
  { name: "Bucket", value: 450, rarity: "common", demand: "Low" },
  { name: "Kulle E Koala", value: 440, rarity: "common", demand: "Low" },
  { name: "Black Iron Antlers", value: 440, rarity: "common", demand: "Mid" },
  { name: "Bam", value: 420, rarity: "common", demand: "Low" },
  { name: "Neon Green Beautiful Hair", value: 390, rarity: "common", demand: "Low" },
  { name: "Katana Of Destiny", value: 360, rarity: "common", demand: "Low" },
  { name: "Blue Wistful Wink", value: 330, rarity: "common", demand: "Low" },
  { name: "Chill Cap", value: 330, rarity: "common", demand: "Low" },
  { name: "Red Goof", value: 300, rarity: "common", demand: "Low" },
  { name: "Sapphire Evil Eye", value: 250, rarity: "common", demand: "Low" },
  { name: "LOLWHY", value: 200, rarity: "common", demand: "Horrendous" },
  { name: "LOL Santa", value: 111, rarity: "common", demand: "Horrendous" }
];

const CASES = [
  { id: 1, name: "Starter Case", price: 100, items: ALL_ITEMS },
  { id: 2, name: "Pro Case", price: 500, items: ALL_ITEMS.filter(item => item.value >= 200) },
  { id: 3, name: "Legendary Pack", price: 1500, items: ALL_ITEMS.filter(item => item.value >= 500) },
  { id: 4, name: "Godly Vault", price: 3000, items: ALL_ITEMS.filter(item => item.value >= 1000) }
];

// --- Utility Functions ---
const canPlayerWin = () => Math.random() < 0.3; // 30% player win chance

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'legendary': return 'text-yellow-400';
    case 'epic': return 'text-purple-400';
    case 'rare': return 'text-blue-400';
    case 'uncommon': return 'text-green-400';
    default: return 'text-gray-400';
  }
};

const getRarityBg = (rarity: string) => {
  switch (rarity) {
    case 'legendary': return 'bg-yellow-500/10 border-yellow-500/30';
    case 'epic': return 'bg-purple-500/10 border-purple-500/30';
    case 'rare': return 'bg-blue-500/10 border-blue-500/30';
    case 'uncommon': return 'bg-green-500/10 border-green-500/30';
    default: return 'bg-gray-500/10 border-gray-500/30';
  }
};

// --- Main App Component ---
export default function App() {
  // User State
  const [user, setUser] = useState<any>(null);
  const [roblosecurity, setRoblosecurity] = useState('');
  const [balance, setBalance] = useState(0);
  const [inventory, setInventory] = useState<any[]>([]);
  const [withdrawRequests, setWithdrawRequests] = useState<any[]>([]);
  
  // UI State
  const [page, setPage] = useState('crates');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [showAdminModal, setShowAdminModal] = useState(false);
  
  // Game State
  const [spinning, setSpinning] = useState(false);
  const [wonItem, setWonItem] = useState<any>(null);
  const [showWinModal, setShowWinModal] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoCodes, setPromoCodes] = useState<any[]>([
    { code: 'WELCOME100', amount: 100, uses: 100, usedBy: [] },
    { code: 'CAELUS50', amount: 50, uses: 50, usedBy: [] }
  ]);
  
  // Admin State
  const [allUsers, setAllUsers] = useState<any[]>([
    { id: 1, username: 'Admin', balance: 10000, roblosecurity: 'admin_token' }
  ]);
  const [newPromoCode, setNewPromoCode] = useState({ code: '', amount: 100, uses: 10 });

  // Initialize from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('caeflip_user');
    const storedBalance = localStorage.getItem('caeflip_balance');
    const storedInventory = localStorage.getItem('caeflip_inventory');
    const storedRoblosecurity = localStorage.getItem('caeflip_roblosecurity');
    
    if (storedUser) setUser(JSON.parse(storedUser));
    if (storedBalance) setBalance(parseFloat(storedBalance));
    if (storedInventory) setInventory(JSON.parse(storedInventory));
    if (storedRoblosecurity) setRoblosecurity(storedRoblosecurity);
  }, []);

  // Persist changes
  useEffect(() => {
    if (user) localStorage.setItem('caeflip_user', JSON.stringify(user));
    localStorage.setItem('caeflip_balance', balance.toString());
    localStorage.setItem('caeflip_inventory', JSON.stringify(inventory));
    localStorage.setItem('caeflip_roblosecurity', roblosecurity);
    
    // Add user to allUsers if not already there
    if (user && !allUsers.find(u => u.id === user.id)) {
      setAllUsers(prev => [...prev, { ...user, balance, roblosecurity }]);
    }
  }, [user, balance, inventory, roblosecurity]);

  // --- Authentication ---
  const finishLogin = (profile: { name?: string; email?: string; picture?: string }) => {
    const newUser = {
      id: Date.now(),
      username: profile.name || `Player${Math.floor(Math.random() * 1000)}`,
      avatar:
        profile.picture ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'Player')}&background=6366f1&color=fff`,
      email: profile.email || ''
    };
    setUser(newUser);
  };

  const handleLogout = () => {
    setUser(null);
    setBalance(0);
    setInventory([]);
    localStorage.removeItem('caeflip_user');
    localStorage.removeItem('caeflip_balance');
    localStorage.removeItem('caeflip_inventory');
  };

  const handleAdminLogin = () => {
    if (adminPass === 'kerimpro') {
      setIsAdmin(true);
      setShowAdminModal(false);
      setAdminPass('');
    }
  };

  // --- Game Functions ---
  const openCase = (caseItem: any) => {
    if (balance < caseItem.price) return;
    if (spinning) return;
    
    setSpinning(true);
    setBalance(prev => prev - caseItem.price);
    
    // 70% house edge logic
    const win = canPlayerWin();
    
    setTimeout(() => {
      setSpinning(false);
      
      if (win) {
        // Player wins - give random item from case
        const availableItems = caseItem.items;
        const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];
        
        setWonItem(randomItem);
        setShowWinModal(true);
        setInventory(prev => [...prev, { ...randomItem, id: Date.now() }]);
        setBalance(prev => prev + randomItem.value);
      } else {
        // House wins - nothing
        setWonItem(null);
      }
    }, 2000);
  };

  const redeemPromoCode = () => {
    if (!user || !promoCode.trim()) return;
    
    const promo = promoCodes.find(p => p.code.toUpperCase() === promoCode.toUpperCase());
    if (!promo) {
      alert('Invalid promo code!');
      return;
    }
    
    if (promo.usedBy.includes(user.id)) {
      alert('You already used this code!');
      return;
    }
    
    if (promo.uses <= 0) {
      alert('This code has no uses left!');
      return;
    }
    
    setBalance(prev => prev + promo.amount);
    setPromoCodes(prev => prev.map(p => 
      p.code === promo.code 
        ? { ...p, uses: p.uses - 1, usedBy: [...p.usedBy, user.id] }
        : p
    ));
    setPromoCode('');
    alert(`Successfully redeemed ${promo.amount} R$!`);
  };

  const submitWithdrawRequest = (amount: number) => {
    if (!user || amount <= 0 || amount > balance) return;
    
    const request = {
      id: Date.now(),
      userId: user.id,
      username: user.username,
      amount,
      status: 'pending',
      date: new Date().toLocaleString()
    };
    
    setWithdrawRequests(prev => [...prev, request]);
    setBalance(prev => prev - amount);
    alert('Withdrawal request submitted!');
  };

  // --- Admin Functions ---
  const addUserBalance = (userId: number, amount: number) => {
    if (userId === user?.id) {
      setBalance(prev => prev + amount);
    }
    setAllUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, balance: u.balance + amount } : u
    ));
  };

  const createPromoCode = () => {
    if (!newPromoCode.code.trim() || newPromoCode.amount <= 0 || newPromoCode.uses <= 0) return;
    
    setPromoCodes(prev => [...prev, {
      code: newPromoCode.code.toUpperCase(),
      amount: newPromoCode.amount,
      uses: newPromoCode.uses,
      usedBy: []
    }]);
    
    setNewPromoCode({ code: '', amount: 100, uses: 10 });
  };

  const approveWithdrawRequest = (requestId: number) => {
    setWithdrawRequests(prev => prev.map(req => 
      req.id === requestId ? { ...req, status: 'approved' } : req
    ));
  };

  const rejectWithdrawRequest = (requestId: number) => {
    const request = withdrawRequests.find(req => req.id === requestId);
    if (request) {
      setBalance(prev => prev + request.amount);
      setWithdrawRequests(prev => prev.filter(req => req.id !== requestId));
    }
  };

  // --- Render Components ---
  const renderCrates = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">Crate Opening</h2>
        <div className="flex items-center gap-4">
          <div className={`px-4 py-2 rounded-xl ${spinning ? 'bg-yellow-500/20 text-yellow-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
            {spinning ? 'Spinning...' : 'Ready to Spin'}
          </div>
        </div>
      </div>
      
      {wonItem && showWinModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#111114] p-8 rounded-2xl border border-[#222] w-96 text-center">
            <div className={`${getRarityBg(wonItem.rarity)} p-6 rounded-xl mb-6`}>
              <Crown size={48} className={`${getRarityColor(wonItem.rarity)} mx-auto mb-4`} />
              <h3 className="text-2xl font-bold text-white">YOU WON!</h3>
              <p className={`text-xl font-bold mt-2 ${getRarityColor(wonItem.rarity)}`}>{wonItem.name}</p>
              <p className="text-emerald-400 text-lg mt-2">+{wonItem.value} R$</p>
            </div>
            <button onClick={() => setShowWinModal(false)} className="w-full bg-indigo-600 py-3 rounded-xl font-bold hover:bg-indigo-500">
              Continue
            </button>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {CASES.map(caseItem => (
          <div key={caseItem.id} className="bg-[#111114] p-6 rounded-2xl border border-[#222] hover:border-indigo-500 transition-all group">
            <div className="aspect-square rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-4">
              <Package size={48} className="text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{caseItem.name}</h3>
            <div className="flex items-center justify-between mb-6">
              <span className="text-gray-400">Price:</span>
              <span className="text-emerald-400 font-bold text-lg">{caseItem.price} R$</span>
            </div>
            <button 
              onClick={() => openCase(caseItem)}
              disabled={balance < caseItem.price || spinning}
              className={`w-full py-3 rounded-xl font-bold transition-all ${
                balance < caseItem.price 
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              {balance < caseItem.price ? 'Insufficient Balance' : 'Open Case'}
            </button>
          </div>
        ))}
      </div>
      
      <div className="bg-[#111114] p-6 rounded-2xl border border-[#222]">
        <h3 className="text-xl font-bold text-white mb-4">All Items ({ALL_ITEMS.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {ALL_ITEMS.map((item, index) => (
            <div key={index} className={`p-4 rounded-xl ${getRarityBg(item.rarity)}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`font-bold ${getRarityColor(item.rarity)}`}>{item.name}</span>
                <span className="text-emerald-400 font-bold">{item.value} R$</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400 capitalize">{item.rarity}</span>
                <span className={`${
                  item.demand === 'High' ? 'text-emerald-400' :
                  item.demand === 'Mid' ? 'text-yellow-400' :
                  item.demand === 'Low' ? 'text-orange-400' : 'text-red-400'
                }`}>
                  {item.demand}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTowers = () => (
    <div className="bg-[#111114] p-8 rounded-2xl border border-[#222]">
      <h2 className="text-3xl font-bold text-white mb-6">Towers Game</h2>
      <div className="text-center py-12">
        <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center">
          <Trophy size={64} className="text-purple-400" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-4">Coming Soon!</h3>
        <p className="text-gray-400 mb-8">Towers game mode is under development. Check back soon!</p>
        <div className="flex justify-center gap-4">
          <div className="p-4 rounded-xl bg-gray-800/50 text-center">
            <div className="text-lg font-bold text-white">Easy</div>
            <div className="text-sm text-gray-400">3 Tiles, 2 Safe</div>
          </div>
          <div className="p-4 rounded-xl bg-gray-800/50 text-center">
            <div className="text-lg font-bold text-white">Medium</div>
            <div className="text-sm text-gray-400">4 Tiles, 1 Safe</div>
          </div>
          <div className="p-4 rounded-xl bg-gray-800/50 text-center">
            <div className="text-lg font-bold text-white">Hard</div>
            <div className="text-sm text-gray-400">5 Tiles, 1 Safe</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMines = () => (
    <div className="bg-[#111114] p-8 rounded-2xl border border-[#222]">
      <h2 className="text-3xl font-bold text-white mb-6">Mines</h2>
      <div className="grid grid-cols-5 gap-3 max-w-md mx-auto mb-8">
        {Array(25).fill(null).map((_, i) => (
          <button
            key={i}
            className="aspect-square rounded-xl bg-[#16161a] border border-[#1f1f23] hover:border-indigo-500/50 flex items-center justify-center text-2xl transition-all"
            onClick={() => {
              // 70% chance of bomb
              const isBomb = Math.random() < 0.7;
              if (isBomb) {
                alert('💣 You hit a bomb! Game over.');
              } else {
                alert('💎 You found a gem! Continue...');
              }
            }}
          >
            ?
          </button>
        ))}
      </div>
      <div className="text-center">
        <button className="bg-indigo-600 px-8 py-3 rounded-xl font-bold text-lg hover:bg-indigo-500">
          Start Game
        </button>
      </div>
    </div>
  );

  const renderWithdraw = () => (
    <div className="space-y-8">
      <div className="bg-[#111114] p-8 rounded-2xl border border-[#222]">
        <h2 className="text-3xl font-bold text-white mb-6">Withdraw Robux</h2>
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
          <p className="text-yellow-400 font-bold">⚠️ IMPORTANT NOTICE</p>
          <p className="text-gray-300 mt-2">
            ONLY ROBUX WITHDRAWING FOR NOW. WITHDRAWS AND DEPOSITS ARE DONE MANUALLY AND MAY TAKE A LOT OF TIME.
            JOIN DISCORD FOR FASTER PROCESSING: https://discord.gg/AHZzD9WJEb
          </p>
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-400 mb-2">Amount to Withdraw (R$)</label>
          <input 
            type="number" 
            min="100"
            max={balance}
            placeholder="Minimum 100 R$"
            className="w-full bg-[#0a0a0c] border border-[#222] p-4 rounded-xl text-white"
            onChange={(e) => {
              const amount = parseInt(e.target.value);
              if (amount > 0 && amount <= balance) {
                // You can store this in state
              }
            }}
          />
        </div>
        
        <button 
          onClick={() => {
            const amount = 500; // Example amount
            if (balance >= amount) {
              submitWithdrawRequest(amount);
            }
          }}
          className="w-full bg-indigo-600 py-4 rounded-xl font-bold text-lg hover:bg-indigo-500"
        >
          Submit Withdrawal Request
        </button>
      </div>
      
      <div className="bg-[#111114] p-6 rounded-2xl border border-[#222]">
        <h3 className="text-xl font-bold text-white mb-4">Your Withdrawal History</h3>
        {withdrawRequests.filter(req => req.userId === user?.id).length === 0 ? (
          <p className="text-gray-400 text-center py-8">No withdrawal requests yet</p>
        ) : (
          <div className="space-y-3">
            {withdrawRequests.filter(req => req.userId === user?.id).map(req => (
              <div key={req.id} className="p-4 rounded-xl bg-gray-800/50 flex items-center justify-between">
                <div>
                  <p className="text-white font-bold">{req.amount} R$</p>
                  <p className="text-gray-400 text-sm">{req.date}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${
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
    <div className="bg-[#111114] p-8 rounded-2xl border border-[#222]">
      <h2 className="text-3xl font-bold text-white mb-6">Your Inventory</h2>
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-400">Total Items: {inventory.length}</p>
        <p className="text-emerald-400 font-bold">Total Value: {inventory.reduce((sum, item) => sum + item.value, 0)} R$</p>
      </div>
      
      {inventory.length === 0 ? (
        <div className="text-center py-12">
          <Package size={64} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Your inventory is empty</p>
          <p className="text-gray-500">Open some crates to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {inventory.map((item, index) => (
            <div key={index} className={`p-4 rounded-xl ${getRarityBg(item.rarity)}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`font-bold ${getRarityColor(item.rarity)}`}>{item.name}</span>
                <span className="text-emerald-400 font-bold">{item.value} R$</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400 capitalize">{item.rarity}</span>
                <span className={`${
                  item.demand === 'High' ? 'text-emerald-400' :
                  item.demand === 'Mid' ? 'text-yellow-400' :
                  item.demand === 'Low' ? 'text-orange-400' : 'text-red-400'
                }`}>
                  {item.demand}
                </span>
              </div>
              <button className="w-full mt-4 py-2 rounded-lg bg-gray-800/50 text-gray-300 hover:text-white">
                Withdraw Item
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderProfile = () => (
    <div className="bg-[#111114] p-8 rounded-2xl border border-[#222]">
      <h2 className="text-3xl font-bold text-white mb-6">Your Profile</h2>
      
      {user ? (
        <div className="space-y-6">
          <div className="flex items-center gap-6">
            <img src={user.avatar} className="w-24 h-24 rounded-2xl border-4 border-indigo-500/30" alt="Avatar" />
            <div>
              <h3 className="text-2xl font-bold text-white">{user.username}</h3>
              <p className="text-gray-400">{user.email}</p>
              <div className="flex items-center gap-4 mt-2">
                <div className="px-3 py-1 bg-indigo-500/20 rounded-full text-indigo-400 text-sm">
                  User ID: {user.id}
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-gray-800/50">
              <div className="text-3xl font-bold text-emerald-400 mb-2">{balance.toFixed(2)} R$</div>
              <div className="text-gray-400">Balance</div>
            </div>
            <div className="p-6 rounded-xl bg-gray-800/50">
              <div className="text-3xl font-bold text-white mb-2">{inventory.length}</div>
              <div className="text-gray-400">Items Owned</div>
            </div>
            <div className="p-6 rounded-xl bg-gray-800/50">
              <div className="text-3xl font-bold text-yellow-400 mb-2">{withdrawRequests.filter(req => req.userId === user.id).length}</div>
              <div className="text-gray-400">Withdrawals</div>
            </div>
          </div>
          
          <div className="p-6 rounded-xl bg-gray-800/50">
            <h4 className="text-lg font-bold text-white mb-4">.ROBLOSECURITY Token</h4>
            <div className="flex gap-3">
              <input
                type="text"
                value={roblosecurity}
                onChange={(e) => setRoblosecurity(e.target.value)}
                placeholder="Enter your .ROBLOSECURITY token"
                className="flex-1 bg-[#0a0a0c] border border-[#222] p-3 rounded-xl text-white"
              />
              <button 
                onClick={() => {
                  localStorage.setItem('caeflip_roblosecurity', roblosecurity);
                  alert('Token saved successfully!');
                }}
                className="px-6 py-3 bg-indigo-600 rounded-xl font-bold hover:bg-indigo-500"
              >
                Save Token
              </button>
            </div>
            <p className="text-gray-500 text-sm mt-2">This token will be saved permanently and can be changed anytime.</p>
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
        <h2 className="text-3xl font-bold text-white">Admin Panel</h2>
        <button 
          onClick={() => setIsAdmin(false)}
          className="px-4 py-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30"
        >
          Exit Admin Mode
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Management */}
        <div className="bg-[#111114] p-6 rounded-2xl border border-[#222]">
          <h3 className="text-xl font-bold text-white mb-4">User Management ({allUsers.length} users)</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {allUsers.map(u => (
              <div key={u.id} className="p-4 rounded-xl bg-gray-800/50 flex items-center justify-between">
                <div>
                  <p className="text-white font-bold">{u.username}</p>
                  <p className="text-gray-400 text-sm">Balance: {u.balance} R$</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => addUserBalance(u.id, 1000)}
                    className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30"
                  >
                    +1K
                  </button>
                  <button 
                    onClick={() => addUserBalance(u.id, 5000)}
                    className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30"
                  >
                    +5K
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Promo Code Management */}
        <div className="bg-[#111114] p-6 rounded-2xl border border-[#222]">
          <h3 className="text-xl font-bold text-white mb-4">Promo Code Management</h3>
          <div className="mb-6">
            <div className="grid grid-cols-1 gap-4 mb-4">
              <input
                type="text"
                value={newPromoCode.code}
                onChange={(e) => setNewPromoCode({...newPromoCode, code: e.target.value})}
                placeholder="Promo Code (e.g., WELCOME100)"
                className="w-full bg-[#0a0a0c] border border-[#222] p-3 rounded-xl text-white"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  value={newPromoCode.amount}
                  onChange={(e) => setNewPromoCode({...newPromoCode, amount: parseInt(e.target.value) || 0})}
                  placeholder="Amount"
                  className="w-full bg-[#0a0a0c] border border-[#222] p-3 rounded-xl text-white"
                />
                <input
                  type="number"
                  value={newPromoCode.uses}
                  onChange={(e) => setNewPromoCode({...newPromoCode, uses: parseInt(e.target.value) || 0})}
                  placeholder="Uses"
                  className="w-full bg-[#0a0a0c] border border-[#222] p-3 rounded-xl text-white"
                />
              </div>
            </div>
            <button 
              onClick={createPromoCode}
              className="w-full bg-indigo-600 py-3 rounded-xl font-bold hover:bg-indigo-500"
            >
              Create Promo Code
            </button>
          </div>
          
          <div className="space-y-3">
            {promoCodes.map(promo => (
              <div key={promo.code} className="p-4 rounded-xl bg-gray-800/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-bold">{promo.code}</span>
                  <span className="text-emerald-400 font-bold">{promo.amount} R$</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Uses left: {promo.uses}</span>
                  <span className="text-gray-400">Used by: {promo.usedBy.length} users</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Withdrawal Requests */}
        <div className="bg-[#111114] p-6 rounded-2xl border border-[#222] lg:col-span-2">
          <h3 className="text-xl font-bold text-white mb-4">Withdrawal Requests ({withdrawRequests.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {withdrawRequests.map(req => (
              <div key={req.id} className="p-4 rounded-xl bg-gray-800/50">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-white font-bold">{req.username}</p>
                    <p className="text-gray-400 text-sm">{req.date}</p>
                  </div>
                  <span className="text-emerald-400 font-bold text-lg">{req.amount} R$</span>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => approveWithdrawRequest(req.id)}
                    className="flex-1 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => rejectWithdrawRequest(req.id)}
                    className="flex-1 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
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
      {/* Navigation */}
      <nav className="bg-[#0f0f12] border-b border-[#1f1f23] py-4 px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Globe className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-white">CAEFLIP</h1>
            <p className="text-xs text-gray-400">Caelus Gambling Platform</p>
          </div>
        </div>
        
        <div className="flex gap-1 text-sm font-semibold text-gray-400 bg-[#16161a] p-1.5 rounded-xl border border-[#1f1f23]">
          {['crates', 'towers', 'mines', 'withdraw', 'inventory', 'profile'].map(tab => (
            <button 
              key={tab}
              onClick={() => setPage(tab)}
              className={`px-4 py-2 rounded-lg transition-all capitalize ${
                page === tab ? 'bg-[#202026] text-white shadow-sm' : 'hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
          {isAdmin && (
            <button 
              onClick={() => setPage('admin')}
              className={`px-4 py-2 rounded-lg transition-all ${
                page === 'admin' ? 'bg-purple-500/20 text-purple-400 shadow-sm' : 'text-purple-400 hover:text-purple-300'
              }`}
            >
              Admin
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <div className="flex items-center gap-3 bg-[#16161a] border border-[#1f1f23] px-4 py-2 rounded-xl">
                <DollarSign size={18} className="text-emerald-400" />
                <span className="font-mono text-emerald-400 font-bold">{balance.toFixed(2)} R$</span>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowAdminModal(true)}
                  className="p-2.5 hover:bg-[#1f1f23] rounded-xl text-gray-400 hover:text-white transition-colors"
                  title="Admin Login"
                >
                  <Key size={20} />
                </button>
                
                <button
                  onClick={handleLogout}
                  className="p-2.5 hover:bg-[#1f1f23] rounded-xl text-gray-400 hover:text-white transition-colors"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
                
                <div className="flex items-center gap-3">
                  <img src={user.avatar} className="w-10 h-10 rounded-xl border border-[#1f1f23]" alt="Avatar" />
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-xl overflow-hidden">
              <GoogleLogin
                onSuccess={async (cred) => {
                  try {
                    // Decode basic profile info from the JWT (no backend).
                    // This is NOT secure authentication for production, but it makes the button actually work in this Vite-only build.
                    const token = cred.credential;
                    if (!token) return;
                    const payloadPart = token.split('.')[1];
                    const json = JSON.parse(atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/')));
                    finishLogin({ name: json.name, email: json.email, picture: json.picture });
                  } catch {
                    // Fallback if decoding fails
                    finishLogin({});
                  }
                }}
                onError={() => {
                  alert('Google login failed. Please try again.');
                }}
                useOneTap={false}
              />
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-8 max-w-7xl mx-auto">
        {/* Promo Code Section */}
        {user && page !== 'admin' && (
          <div className="mb-8 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-6 rounded-2xl border border-indigo-500/30">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Redeem Promo Code</h3>
                <p className="text-gray-300">Enter a promo code to get free Robux!</p>
              </div>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Enter promo code"
                  className="bg-[#0a0a0c] border border-[#222] px-4 py-3 rounded-xl text-white w-64"
                />
                <button
                  onClick={redeemPromoCode}
                  className="bg-emerald-600 px-6 py-3 rounded-xl font-bold hover:bg-emerald-500 flex items-center gap-2"
                >
                  <Gift size={18} />
                  Redeem
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Page Content */}
        {!user ? (
          <div className="text-center py-20">
            <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center">
              <Globe size={64} className="text-indigo-400" />
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">Welcome to Caeflip</h2>
            <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
              The ultimate Caelus gambling platform. Open crates, play games, and win valuable items.
              Start with 0 balance and work your way up!
            </p>
            <div className="mx-auto w-fit rounded-xl overflow-hidden">
              <GoogleLogin
                onSuccess={async (cred) => {
                  try {
                    const token = cred.credential;
                    if (!token) return;
                    const payloadPart = token.split('.')[1];
                    const json = JSON.parse(atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/')));
                    finishLogin({ name: json.name, email: json.email, picture: json.picture });
                  } catch {
                    finishLogin({});
                  }
                }}
                onError={() => {
                  alert('Google login failed. Please try again.');
                }}
                useOneTap={false}
              />
            </div>
            <p className="text-gray-500 mt-6">After signing in, you'll need to provide your .ROBLOSECURITY token</p>
          </div>
        ) : page === 'crates' ? renderCrates() :
          page === 'towers' ? renderTowers() :
          page === 'mines' ? renderMines() :
          page === 'withdraw' ? renderWithdraw() :
          page === 'inventory' ? renderInventory() :
          page === 'profile' ? renderProfile() :
          page === 'admin' && isAdmin ? renderAdminPanel() :
          renderCrates()}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1f1f23] py-6 px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Globe size={18} className="text-indigo-400" />
              <span className="text-gray-400">Caeflip © 2024</span>
            </div>
            <a 
              href="https://discord.gg/AHZzD9WJEb" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Discord Support
            </a>
          </div>
          <div className="text-gray-500 text-sm">
            Balance: {balance.toFixed(2)} R$ • Items: {inventory.length} • 70% House Edge
          </div>
        </div>
      </footer>

      {/* Admin Login Modal */}
      {showAdminModal && !isAdmin && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#111114] p-8 rounded-2xl border border-[#222] w-96">
            <h2 className="text-2xl font-bold text-white mb-6">Admin Access</h2>
            <input 
              type="password"
              value={adminPass}
              onChange={(e) => setAdminPass(e.target.value)}
              placeholder="Enter admin password"
              className="w-full bg-[#0a0a0c] border border-[#222] p-4 rounded-xl text-white mb-6"
            />
            <button 
              onClick={handleAdminLogin}
              className="w-full bg-indigo-600 py-4 rounded-xl font-bold text-lg hover:bg-indigo-500"
            >
              Authenticate
            </button>
            <p className="text-gray-500 text-sm mt-4 text-center">Password: kerimpro</p>
          </div>
        </div>
      )}
    </div>
  );
}