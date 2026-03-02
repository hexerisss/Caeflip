import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

// Types
interface User {
  userId: string;
  username: string;
  email: string;
  avatar: string;
  balance: number;
  createdAt: string;
}

interface Item {
  name: string;
  value: number;
  rarity: string;
  demand: string;
}

interface Spin {
  id: string;
  crateType: string;
  crateCost: number;
  item: Item;
  profit: number;
  timestamp: string;
}

interface Deposit {
  id: string;
  userId: string;
  username: string;
  amount: number;
  gamepassId: string;
  transactionId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
}

// Rarity colors
const rarityColors: Record<string, string> = {
  legendary: 'from-yellow-500 to-amber-600',
  epic: 'from-purple-500 to-pink-600',
  rare: 'from-blue-500 to-cyan-600',
  uncommon: 'from-green-500 to-emerald-600',
  common: 'from-gray-500 to-slate-600',
};

const rarityLabels: Record<string, string> = {
  legendary: 'LEGENDARY',
  epic: 'EPIC',
  rare: 'RARE',
  uncommon: 'UNCOMMON',
  common: 'COMMON',
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAuth();
    checkAdmin();
  }, []);

  const checkAuth = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/auth/me`, { withCredentials: true });
      setUser(data);
    } catch (error) {
      setUser(null);
    }
  };

  const checkAdmin = async () => {
    try {
      await axios.get(`${API_URL}/admin/session`, { withCredentials: true });
      setIsAdmin(true);
    } catch (error) {
      setIsAdmin(false);
    }
  };

  const handleLogin = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true });
      setUser(null);
      setIsAdmin(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleAddCredits = () => {
    if (user) {
      setUser({ ...user, balance: user.balance + 5000 });
    }
  };

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        {/* Navigation */}
        <nav className="bg-gray-800/50 backdrop-blur-lg border-b border-purple-500/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <img 
                  src="https://www.caelus.lol/img/roblox_logo.svg" 
                  alt="Caelus" 
                  className="h-10 w-10"
                />
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Caelus.lol
                </span>
              </div>
              
              <div className="flex items-center space-x-6">
                <Link to="/" className="text-gray-300 hover:text-white transition">Crates</Link>
                <Link to="/items" className="text-gray-300 hover:text-white transition">Items</Link>
                <Link to="/history" className="text-gray-300 hover:text-white transition">History</Link>
                <Link to="/deposits" className="text-gray-300 hover:text-white transition">Deposits</Link>
                {isAdmin && (
                  <Link to="/admin" className="text-yellow-400 hover:text-yellow-300 transition">Admin</Link>
                )}
                {isAdmin && (
                  <Link to="/admin-login" className="text-blue-400 hover:text-blue-300 transition">Admin Login</Link>
                )}
                
                {user ? (
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 bg-gray-700/50 px-4 py-2 rounded-lg">
                      <span className="text-green-400 font-bold">${user.balance.toLocaleString()}</span>
                      <button 
                        onClick={handleAddCredits}
                        className="text-xs bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded"
                      >
                        +5K
                      </button>
                    </div>
                    <img 
                      src={user.avatar} 
                      alt={user.username}
                      className="h-8 w-8 rounded-full"
                    />
                    <span className="text-gray-300">{user.username}</span>
                    <button 
                      onClick={handleLogout}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={handleLogin}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-6 py-2 rounded-lg font-semibold transition transform hover:scale-105"
                  >
                    Login with Google
                  </button>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Discord Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-center">
          <p className="text-white text-sm">
            📢 DEPOSITS ARE DONE MANUALLY - MIGHT TAKE LONG BUT JOIN DISCORD FOR FASTER DEPOSITS
            {' '}
            <a href="https://discord.gg/AHZzD9WJEb" target="_blank" rel="noopener noreferrer" className="underline font-bold">
              Join Discord
            </a>
          </p>
        </div>

        {/* Main Content */}
        <Routes>
          <Route path="/" element={<CratesPage user={user} setUser={setUser} />} />
          <Route path="/items" element={<ItemsPage />} />
          <Route path="/history" element={<HistoryPage user={user} />} />
          <Route path="/deposits" element={<DepositsPage user={user} />} />
          <Route path="/admin" element={<AdminPage isAdmin={isAdmin} setIsAdmin={setIsAdmin} />} />
          <Route path="/admin-login" element={<AdminLoginPage setIsAdmin={setIsAdmin} />} />
        </Routes>

        {/* Footer */}
        <footer className="bg-gray-800/50 backdrop-blur-lg border-t border-purple-500/20 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <img 
                  src="https://www.caelus.lol/img/roblox_logo.svg" 
                  alt="Caelus" 
                  className="h-8 w-8"
                />
                <span className="text-lg font-bold text-gray-300">Caelus.lol</span>
              </div>
              <div className="flex items-center space-x-6">
                <a href="https://discord.gg/AHZzD9WJEb" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">
                  Discord
                </a>
                <span className="text-gray-500 text-sm">© 2024 Caelus.lol - Old Roblox Revival</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

// Crates Page
function CratesPage({ user, setUser }: { user: User | null; setUser: React.Dispatch<React.SetStateAction<User | null>> }) {
  const [selectedCrate, setSelectedCrate] = useState('classic');
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinItems, setSpinItems] = useState<Item[]>([]);
  const [winningItem, setWinningItem] = useState<Item | null>(null);
  const [showWinModal, setShowWinModal] = useState(false);

  const crates = {
    classic: { name: 'Classic Crate', cost: 100, color: 'from-gray-600 to-gray-700' },
    premium: { name: 'Premium Case', cost: 250, color: 'from-green-600 to-emerald-700' },
    legendary: { name: 'Legendary Vault', cost: 500, color: 'from-purple-600 to-pink-700' },
    elite: { name: 'Elite Collection', cost: 1000, color: 'from-yellow-600 to-amber-700' },
  };

  const handleSpin = async () => {
    if (!user || isSpinning) return;

    const crate = crates[selectedCrate as keyof typeof crates];
    if (user.balance < crate.cost) {
      alert('Insufficient balance!');
      return;
    }

    setIsSpinning(true);
    setWinningItem(null);
    setShowWinModal(false);

    try {
      const res = await axios.post(`${API_URL}/spin`, {
        crateType: selectedCrate,
      }, { withCredentials: true });

      const { item, balance, spinItems: serverSpinItems } = res.data;
      
      setUser({ ...user, balance });
      setSpinItems(serverSpinItems);
      setWinningItem(item);

      // Animate the spinner
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      setShowWinModal(true);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Spin failed!');
    } finally {
      setIsSpinning(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Crate Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {(Object.keys(crates) as Array<keyof typeof crates>).map((crateKey) => {
          const crate = crates[crateKey];
          return (
            <button
              key={crateKey}
              onClick={() => !isSpinning && setSelectedCrate(crateKey)}
              disabled={isSpinning}
              className={`relative p-6 rounded-2xl bg-gradient-to-br ${crate.color} ${
                selectedCrate === crateKey 
                  ? 'ring-4 ring-yellow-400 scale-105' 
                  : 'hover:scale-105'
              } transition transform cursor-pointer`}
            >
              <div className="text-center">
                <div className="text-4xl mb-2">📦</div>
                <h3 className="text-xl font-bold text-white mb-2">{crate.name}</h3>
                <p className="text-white/80 font-semibold">${crate.cost}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Spinner */}
      <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 mb-8">
        <div className="relative overflow-hidden rounded-xl bg-gray-900 border-2 border-purple-500/30">
          {/* Center indicator */}
          <div className="absolute left-1/2 top-0 bottom-0 w-2 bg-gradient-to-b from-transparent via-yellow-400 to-transparent transform -translate-x-1/2 z-10"></div>
          
          {/* Spin items */}
          <div 
            className={`flex items-center h-32 ${isSpinning ? 'animate-spin-roulette' : ''}`}
            style={{ 
              transform: isSpinning ? 'translateX(-4800px)' : 'translateX(0)',
              transition: isSpinning ? 'transform 4s cubic-bezier(0.1, 0.7, 0.1, 1)' : 'none'
            }}
          >
            {(spinItems.length > 0 ? spinItems : Array(50).fill(null).map((_) => ({
              name: '???',
              value: 0,
              rarity: 'common',
              demand: 'Low'
            }))).map((item, index) => (
              <div 
                key={index}
                className={`flex-shrink-0 w-48 h-32 flex items-center justify-center border-r border-gray-700 bg-gradient-to-r ${rarityColors[item.rarity]} px-4`}
              >
                <div className="text-center text-white">
                  <p className="font-bold text-sm truncate">{item.name}</p>
                  <p className="text-xs opacity-80">${item.value.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Spin Button */}
        <div className="mt-8 text-center">
          <button
            onClick={handleSpin}
            disabled={!user || isSpinning}
            className={`px-12 py-4 rounded-xl font-bold text-xl transition transform ${
              !user || isSpinning
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 hover:scale-105'
            } text-white`}
          >
            {isSpinning ? 'Spinning...' : `Spin for $${crates[selectedCrate as keyof typeof crates].cost}`}
          </button>
          {!user && (
            <p className="text-gray-400 mt-4">Please login to spin!</p>
          )}
        </div>
      </div>

      {/* Win Modal */}
      {showWinModal && winningItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 max-w-md w-full mx-4 text-center border-2 border-yellow-400">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent mb-4">
              YOU WON!
            </h2>
            <div className={`bg-gradient-to-r ${rarityColors[winningItem.rarity]} rounded-xl p-6 mb-6`}>
              <p className="text-white font-bold text-xl mb-2">{winningItem.name}</p>
              <p className="text-white/80 text-sm">{rarityLabels[winningItem.rarity]}</p>
              <p className="text-white text-2xl font-bold mt-2">${winningItem.value.toLocaleString()}</p>
            </div>
            <p className="text-green-400 font-bold text-lg mb-6">
              Profit: +${winningItem.value - crates[selectedCrate as keyof typeof crates].cost}
            </p>
            <button
              onClick={() => setShowWinModal(false)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8 py-3 rounded-lg font-semibold transition"
            >
              Collect & Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Items Page
function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await axios.get(`${API_URL}/items`);
      setItems(res.data.sort((a: Item, b: Item) => b.value - a.value));
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-8 text-center text-gray-400">Loading items...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-bold text-white mb-8 text-center">Item Catalog</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((item, index) => (
          <div 
            key={index}
            className={`bg-gradient-to-br ${rarityColors[item.rarity]} rounded-xl p-6 hover:scale-105 transition transform`}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-white font-bold text-lg truncate">{item.name}</h3>
              <span className="text-white/80 text-xs font-semibold px-2 py-1 bg-black/20 rounded">
                {rarityLabels[item.rarity]}
              </span>
            </div>
            <div className="space-y-2">
              <p className="text-white text-2xl font-bold">${item.value.toLocaleString()}</p>
              <p className="text-white/70 text-sm">Demand: {item.demand}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// History Page
function HistoryPage({ user }: { user: User | null }) {
  const [history, setHistory] = useState<Spin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_URL}/history`, { withCredentials: true });
      setHistory(res.data);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-400">Please login to view your history.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-8 text-center text-gray-400">Loading history...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-bold text-white mb-8 text-center">Spin History</h1>
      {history.length === 0 ? (
        <p className="text-gray-400 text-center">No spins yet. Start spinning!</p>
      ) : (
        <div className="space-y-4">
          {history.map((spin) => (
            <div 
              key={spin.id}
              className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className={`bg-gradient-to-r ${rarityColors[spin.item.rarity]} px-4 py-2 rounded-lg`}>
                    <p className="text-white font-bold">{spin.item.name}</p>
                    <p className="text-white/80 text-sm">${spin.item.value.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">
                      {spin.crateType.charAt(0).toUpperCase() + spin.crateType.slice(1)} Crate
                    </p>
                    <p className="text-gray-500 text-xs">
                      {new Date(spin.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-xl ${spin.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {spin.profit >= 0 ? '+' : ''}${spin.profit}
                  </p>
                  <p className="text-gray-500 text-sm">Profit</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Deposits Page
function DepositsPage({ user }: { user: User | null }) {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ amount: '', gamepassId: '', transactionId: '' });

  useEffect(() => {
    if (user) {
      fetchDeposits();
    }
  }, [user]);

  const fetchDeposits = async () => {
    try {
      const res = await axios.get(`${API_URL}/deposits`, { withCredentials: true });
      setDeposits(res.data);
    } catch (error) {
      console.error('Failed to fetch deposits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await axios.post(`${API_URL}/deposit`, {
        amount: parseInt(formData.amount),
        gamepassId: formData.gamepassId,
        transactionId: formData.transactionId,
      }, { withCredentials: true });

      setFormData({ amount: '', gamepassId: '', transactionId: '' });
      setShowForm(false);
      fetchDeposits();
      alert('Deposit request submitted!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to submit deposit');
    }
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-400">Please login to make deposits.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-white">Deposits</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-6 py-3 rounded-lg font-semibold transition"
        >
          {showForm ? 'Cancel' : 'Request Deposit'}
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 mb-8 border border-green-500/30">
          <h2 className="text-xl font-bold text-white mb-4">Request Deposit</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">Amount ($)</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter amount"
                required
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Game Pass ID</label>
              <input
                type="text"
                value={formData.gamepassId}
                onChange={(e) => setFormData({ ...formData, gamepassId: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter Game Pass ID from caelus.lol"
                required
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Transaction ID</label>
              <input
                type="text"
                value={formData.transactionId}
                onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter transaction ID"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-6 py-3 rounded-lg font-semibold transition"
            >
              Submit Request
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 text-center">Loading deposits...</p>
      ) : deposits.length === 0 ? (
        <p className="text-gray-400 text-center">No deposit requests yet.</p>
      ) : (
        <div className="space-y-4">
          {deposits.map((deposit) => (
            <div 
              key={deposit.id}
              className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white font-bold text-xl">${deposit.amount.toLocaleString()}</p>
                  <p className="text-gray-400 text-sm">Game Pass ID: {deposit.gamepassId}</p>
                  <p className="text-gray-500 text-xs">
                    {new Date(deposit.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className={`px-4 py-2 rounded-lg font-semibold ${
                    deposit.status === 'pending' ? 'bg-yellow-600 text-white' :
                    deposit.status === 'approved' ? 'bg-green-600 text-white' :
                    'bg-red-600 text-white'
                  }`}>
                    {deposit.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Admin Page
function AdminPage({ isAdmin, setIsAdmin }: { isAdmin: boolean; setIsAdmin: React.Dispatch<React.SetStateAction<boolean>> }) {
  const [users, setUsers] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    try {
      const [usersRes, depositsRes] = await Promise.all([
        axios.get(`${API_URL}/admin/users`, { withCredentials: true }),
        axios.get(`${API_URL}/admin/deposits`, { withCredentials: true }),
      ]);
      setUsers(usersRes.data);
      setDeposits(depositsRes.data);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (depositId: string) => {
    try {
      await axios.post(`${API_URL}/admin/deposit/${depositId}/approve`, {}, { withCredentials: true });
      fetchData();
    } catch (error) {
      alert('Failed to approve deposit');
    }
  };

  const handleReject = async (depositId: string) => {
    try {
      await axios.post(`${API_URL}/admin/deposit/${depositId}/reject`, {}, { withCredentials: true });
      fetchData();
    } catch (error) {
      alert('Failed to reject deposit');
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-400">Please login as admin.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-8 text-center text-gray-400">Loading admin panel...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-bold text-white mb-8 text-center">Admin Panel</h1>

      {/* Users Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Registered Users ({users.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => (
            <div key={user.userId} className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20">
              <div className="flex items-center space-x-4">
                <img src={user.avatar} alt={user.username} className="h-12 w-12 rounded-full" />
                <div className="flex-1">
                  <p className="text-white font-bold">{user.username}</p>
                  <p className="text-gray-400 text-sm">{user.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-bold">${user.balance.toLocaleString()}</p>
                  <p className="text-gray-500 text-xs">Balance</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Deposits Section */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Deposit Requests ({deposits.length})</h2>
        <div className="space-y-4">
          {deposits.map((deposit) => (
            <div 
              key={deposit.id}
              className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white font-bold text-xl">${deposit.amount.toLocaleString()}</p>
                  <p className="text-gray-400 text-sm">{deposit.username}</p>
                  <p className="text-gray-500 text-xs">Game Pass ID: {deposit.gamepassId}</p>
                  <p className="text-gray-500 text-xs">
                    {new Date(deposit.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-4 py-2 rounded-lg font-semibold ${
                    deposit.status === 'pending' ? 'bg-yellow-600 text-white' :
                    deposit.status === 'approved' ? 'bg-green-600 text-white' :
                    'bg-red-600 text-white'
                  }`}>
                    {deposit.status.toUpperCase()}
                  </span>
                  {deposit.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(deposit.id)}
                        className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-semibold transition"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(deposit.id)}
                        className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-semibold transition"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Admin Login Page
function AdminLoginPage({ setIsAdmin }: { setIsAdmin: React.Dispatch<React.SetStateAction<boolean>> }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/admin/login`, { password }, { withCredentials: true });
      if (res.data.success) {
        setIsAdmin(true);
        window.location.href = '/admin';
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Invalid password');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-8 border border-purple-500/20">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Admin Login</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter admin password"
              required
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-6 py-3 rounded-lg font-semibold transition"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
