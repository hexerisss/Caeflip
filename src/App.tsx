import React, { useState, useEffect } from 'react';
import { gapi } from 'gapi-script';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Loader,
  Globe
} from 'lucide-react';

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
  { id: 'classic', name: 'Classic Case', items: items.slice(0, 10), price: 100 },
  { id: 'premium', name: 'Premium Case', items: items.slice(5, 15), price: 200 },
  { id: 'legendary', name: 'Legendary Case', items: items.slice(10, 20), price: 500 },
];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [robloxSecurity, setRobloxSecurity] = useState<string>('');
  const [balance, setBalance] = useState<number>(0);
  const [inventory, setInventory] = useState<Item[]>([]);
  const [currentView, setCurrentView] = useState<'login' | 'roblox' | 'main' | 'admin'>('login');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminKey, setAdminKey] = useState<string>('');
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [spinning, setSpinning] = useState<boolean>(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [wonItem, setWonItem] = useState<Item | null>(null);
  const [minesGame, setMinesGame] = useState<boolean>(false);
  const [towersGame, setTowersGame] = useState<boolean>(false);

  useEffect(() => {
    const initGapi = () => {
      gapi.load('auth2', () => {
        gapi.auth2.init({
          client_id: '365561042683-ipbq59a5ip4k37fhie29is9625rmmipp.apps.googleusercontent.com',
        });
      });
    };
    initGapi();
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedRoblox = localStorage.getItem('robloxSecurity');
    const savedBalance = localStorage.getItem('balance');
    const savedInventory = localStorage.getItem('inventory');
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
  }, []);

  const handleGoogleLogin = async () => {
    const auth = gapi.auth2.getAuthInstance();
    try {
      const googleUser = await auth.signIn();
      const profile = googleUser.getBasicProfile();
      const userData: User = {
        id: profile.getId(),
        name: profile.getName(),
        email: profile.getEmail(),
        picture: profile.getImageUrl(),
      };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      setCurrentView('roblox');
    } catch (error) {
      console.error('Google login failed', error);
    }
  };

  const handleRobloxLogin = async () => {
    if (!robloxSecurity) return;
    try {
      // Simulate fetching profile, in real app fetch from caelus.lol
      await axios.get(`https://www.caelus.lol/users/3485/profile`, {
        headers: { Cookie: `.ROBLOSECURITY=${robloxSecurity}` }
      });
      // Parse response to get robloxId and name
      // For now, assume
      const robloxId = '3485'; // from url
      const robloxName = 'ExampleUser'; // parse from response
      setUser(prev => prev ? { ...prev, robloxId, robloxName } : null);
      localStorage.setItem('robloxSecurity', robloxSecurity);
      setCurrentView('main');
    } catch (error) {
      alert('Invalid .ROBLOSECURITY');
    }
  };

  const spinCase = (caseData: Case) => {
    if (balance < caseData.price) return;
    setSpinning(true);
    setBalance(prev => prev - caseData.price);
    localStorage.setItem('balance', (balance - caseData.price).toString());
    // Biased odds: 70% house, 30% player
    const rand = Math.random();
    let selectedItem;
    if (rand < 0.7) {
      // House wins, give low value
      selectedItem = caseData.items.find(i => i.value < 500) || caseData.items[0];
    } else {
      // Player wins, give high value
      selectedItem = caseData.items.find(i => i.value > 1000) || caseData.items[caseData.items.length - 1];
    }
    setTimeout(() => {
      setWonItem(selectedItem);
      setInventory(prev => [...prev, selectedItem]);
      localStorage.setItem('inventory', JSON.stringify([...inventory, selectedItem]));
      setSpinning(false);
    }, 3000);
  };

  const redeemPromo = (code: string) => {
    const promo = promoCodes.find(p => p.code === code && p.uses < p.maxUses);
    if (promo) {
      setBalance(prev => prev + promo.amount);
      localStorage.setItem('balance', (balance + promo.amount).toString());
      setPromoCodes(prev => prev.map(p => p.code === code ? { ...p, uses: p.uses + 1 } : p));
    }
  };

  const requestWithdraw = (amount: number) => {
    if (amount > balance) return;
    const request: WithdrawRequest = {
      id: Date.now().toString(),
      userId: user?.id || '',
      amount,
      status: 'pending'
    };
    setWithdrawRequests(prev => [...prev, request]);
    setBalance(prev => prev - amount);
    localStorage.setItem('balance', (balance - amount).toString());
  };

  const adminAddMoney = (userId: string, amount: number) => {
    // In real app, update DB
    // For now, if userId matches, add to balance
    if (userId === user?.id) {
      setBalance(prev => prev + amount);
      localStorage.setItem('balance', (balance + amount).toString());
    }
  };

  const adminCreatePromo = (code: string, amount: number, maxUses: number) => {
    setPromoCodes(prev => [...prev, { code, amount, uses: 0, maxUses }]);
  };

  if (currentView === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md"
        >
          <div className="text-center mb-8">
            <Globe className="h-16 w-16 text-white mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white">Caelus</h1>
            <p className="text-white/70">Roblox Gambling</p>
          </div>
          <button
            onClick={handleGoogleLogin}
            className="w-full bg-white text-gray-900 py-3 px-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-3"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>
        </motion.div>
      </div>
    );
  }

  if (currentView === 'roblox') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md"
        >
          <div className="text-center mb-8">
            <Globe className="h-16 w-16 text-white mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white">Connect Roblox</h1>
            <p className="text-white/70">Enter your .ROBLOSECURITY cookie</p>
          </div>
          <input
            type="password"
            value={robloxSecurity}
            onChange={(e) => setRobloxSecurity(e.target.value)}
            placeholder=".ROBLOSECURITY"
            className="w-full bg-white/20 text-white placeholder-white/50 rounded-lg p-3 mb-4"
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
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Users</h2>
              <div className="bg-gray-800 p-4 rounded-lg">
                <p>User: {user?.name}</p>
                <p>Balance: {balance}</p>
                <input type="number" placeholder="Add Amount" id="addAmount" className="bg-gray-700 p-2 rounded mt-2" />
                <button onClick={() => adminAddMoney(user?.id || '', parseInt((document.getElementById('addAmount') as HTMLInputElement).value))} className="bg-blue-600 px-4 py-2 rounded mt-2">Add Money</button>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-4">Promo Codes</h2>
              <div className="bg-gray-800 p-4 rounded-lg">
                <input type="text" placeholder="Code" id="promoCode" className="bg-gray-700 p-2 rounded mb-2 w-full" />
                <input type="number" placeholder="Amount" id="promoAmount" className="bg-gray-700 p-2 rounded mb-2 w-full" />
                <input type="number" placeholder="Max Uses" id="promoUses" className="bg-gray-700 p-2 rounded mb-2 w-full" />
                <button onClick={() => adminCreatePromo((document.getElementById('promoCode') as HTMLInputElement).value, parseInt((document.getElementById('promoAmount') as HTMLInputElement).value), parseInt((document.getElementById('promoUses') as HTMLInputElement).value))} className="bg-green-600 px-4 py-2 rounded">Create Promo</button>
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
      <header className="bg-gray-800 p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Globe className="h-8 w-8 text-blue-400" />
          <h1 className="text-xl font-bold">Caelus</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-semibold">{user?.robloxName || user?.name}</p>
            <p className="text-sm text-gray-400">{balance} Robux</p>
          </div>
          <img src={user?.picture} alt="Profile" className="h-10 w-10 rounded-full" />
          <button onClick={() => { localStorage.clear(); setCurrentView('login'); }} className="bg-red-600 px-3 py-1 rounded">Logout</button>
          <button onClick={() => setIsAdmin(!isAdmin)} className="bg-yellow-600 px-3 py-1 rounded">Admin</button>
          {isAdmin && (
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Admin Key"
              className="bg-gray-700 p-1 rounded"
            />
          )}
          {adminKey === 'kerimpro' && <button onClick={() => setCurrentView('admin')} className="bg-green-600 px-3 py-1 rounded">Enter Admin</button>}
        </div>
      </header>

      {/* Main Content */}
      <main className="p-8">
        <div className="max-w-6xl mx-auto">
          {/* Navigation */}
          <nav className="flex gap-4 mb-8">
            <button onClick={() => setSelectedCase(null)} className="bg-blue-600 px-4 py-2 rounded">Cases</button>
            <button onClick={() => setMinesGame(true)} className="bg-green-600 px-4 py-2 rounded">Mines</button>
            <button onClick={() => setTowersGame(true)} className="bg-purple-600 px-4 py-2 rounded">Towers</button>
            <button onClick={() => {}} className="bg-yellow-600 px-4 py-2 rounded">Inventory</button>
          </nav>

          {/* Deposit Notice */}
          <div className="bg-blue-600 p-4 rounded-lg mb-8">
            <p>DEPOSITS ARE DONE MANUALLY MIGHT TAKE LONG BUT JOIN DISCORD FOR FASTER DEPOSITS</p>
            <a href="https://discord.gg/AHZzD9WJEb" className="text-white underline">Join Discord</a>
          </div>

          {/* Cases */}
          {!selectedCase && !minesGame && !towersGame && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {cases.map(caseItem => (
                <motion.div 
                  key={caseItem.id}
                  whileHover={{ scale: 1.05 }}
                  className="bg-gray-800 p-6 rounded-lg cursor-pointer"
                  onClick={() => setSelectedCase(caseItem)}
                >
                  <h3 className="text-xl font-semibold mb-2">{caseItem.name}</h3>
                  <p className="text-gray-400 mb-4">{caseItem.price} Robux</p>
                  <button className="bg-blue-600 w-full py-2 rounded">Open Case</button>
                </motion.div>
              ))}
            </div>
          )}

          {/* Case Spin */}
          {selectedCase && !spinning && !wonItem && (
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">{selectedCase.name}</h2>
              <div className="bg-gray-800 p-8 rounded-lg mb-4">
                <div className="flex justify-center gap-4 overflow-hidden">
                  {selectedCase.items.map((item, index) => (
                    <div key={index} className="bg-gray-700 p-4 rounded min-w-[200px]">
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-gray-400">{item.value} Robux</p>
                    </div>
                  ))}
                </div>
              </div>
              <button 
                onClick={() => spinCase(selectedCase)}
                disabled={balance < selectedCase.price}
                className="bg-green-600 px-6 py-3 rounded text-lg font-semibold disabled:bg-gray-600"
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
                transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                className="inline-block"
              >
                <Loader className="h-16 w-16 text-blue-400" />
              </motion.div>
              <p className="mt-4 text-xl">Spinning...</p>
            </div>
          )}

          {/* Won Item */}
          {wonItem && (
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">You Won!</h2>
              <div className="bg-green-600 p-8 rounded-lg inline-block">
                <p className="text-xl font-semibold">{wonItem.name}</p>
                <p className="text-lg">{wonItem.value} Robux</p>
              </div>
              <button onClick={() => { setWonItem(null); setSelectedCase(null); }} className="block mt-4 bg-blue-600 px-4 py-2 rounded">Continue</button>
            </div>
          )}

          {/* Mines Game Placeholder */}
          {minesGame && (
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Mines Game</h2>
              <p>Coming Soon...</p>
              <button onClick={() => setMinesGame(false)} className="bg-red-600 px-4 py-2 rounded">Back</button>
            </div>
          )}

          {/* Towers Game Placeholder */}
          {towersGame && (
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Towers Game</h2>
              <p>Coming Soon...</p>
              <button onClick={() => setTowersGame(false)} className="bg-red-600 px-4 py-2 rounded">Back</button>
            </div>
          )}

          {/* Promo Code */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Redeem Promo Code</h3>
            <input type="text" placeholder="Enter Code" id="promoInput" className="bg-gray-800 p-2 rounded mr-2" />
            <button onClick={() => redeemPromo((document.getElementById('promoInput') as HTMLInputElement).value)} className="bg-blue-600 px-4 py-2 rounded">Redeem</button>
          </div>

          {/* Withdraw */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Withdraw Robux</h3>
            <p className="text-sm text-gray-400 mb-2">WITHDRAWS AND DEPOSITS ARE DONE MANUALLY AND MAY TAKE A LOT OF TIME</p>
            <input type="number" placeholder="Amount" id="withdrawAmount" className="bg-gray-800 p-2 rounded mr-2" />
            <button onClick={() => requestWithdraw(parseInt((document.getElementById('withdrawAmount') as HTMLInputElement).value))} className="bg-green-600 px-4 py-2 rounded">Request Withdraw</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;