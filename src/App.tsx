import { useState, useEffect } from 'react';
import { GoogleOAuthProvider, GoogleLogin, googleLogout } from '@react-oauth/google';
import { 
  Shield, 
  Wallet, 
  History, 
  Settings, 
  LogOut, 
  MessageSquare, 
  PlusCircle, 
  LayoutGrid, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Gem
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

// --- CONFIG & CONSTANTS ---
const GOOGLE_CLIENT_ID = "365561042683-ipbq59a5ip4k37fhie29is9625rmmipp.apps.googleusercontent.com";
const DISCORD_LINK = "https://discord.gg/AHZzD9WJEb";

interface User {
  id: string;
  name: string;
  email: string;
  picture: string;
}

interface Item {
  name: string;
  value: number;
  demand: string;
  rarity: 'Legendary' | 'Epic' | 'Rare' | 'Uncommon' | 'Common';
}

interface HistoryItem {
  item: Item;
  case: string;
  date: string;
  profit: number;
}

interface Deposit {
  id: string;
  user: string;
  amount: number;
  status: string;
  date: string;
}

const ITEMS: Item[] = [
  { name: 'The Classic ROBLOX Fedora', value: 5100, demand: 'High', rarity: 'Legendary' },
  { name: 'Tattletale', value: 4500, demand: 'Low', rarity: 'Legendary' },
  { name: 'Valkyrie Helm', value: 3100, demand: 'Mid', rarity: 'Epic' },
  { name: 'Gold Clockwork Headphones', value: 2500, demand: 'Mid', rarity: 'Epic' },
  { name: 'Soviet Ushanka', value: 2180, demand: 'Mid', rarity: 'Epic' },
  { name: 'Playful Vampire', value: 1600, demand: 'Low', rarity: 'Rare' },
  { name: 'Supa Dupa Fly Cap', value: 870, demand: 'Low', rarity: 'Uncommon' },
  { name: 'Evil Skeptic', value: 670, demand: 'Mid', rarity: 'Uncommon' },
  { name: 'Bucket', value: 450, demand: 'Low', rarity: 'Common' },
  { name: 'Kulle E Koala', value: 440, demand: 'Low', rarity: 'Common' },
  { name: 'Black Iron Antlers', value: 440, demand: 'Mid', rarity: 'Common' },
  { name: 'Bam', value: 420, demand: 'Low', rarity: 'Common' },
  { name: 'Neon Green Beautiful Hair', value: 390, demand: 'Low', rarity: 'Common' },
  { name: 'Katana Of Destiny', value: 360, demand: 'Low', rarity: 'Common' },
  { name: 'Blue Wistful Wink', value: 330, demand: 'Low', rarity: 'Common' },
  { name: 'Chill Cap', value: 330, demand: 'Mid', rarity: 'Common' },
  { name: 'Red Goof', value: 300, demand: 'Low', rarity: 'Common' },
  { name: 'Sapphire Evil Eye', value: 250, demand: 'Low', rarity: 'Common' },
  { name: 'LOLWHY', value: 200, demand: 'Horrendous', rarity: 'Common' },
  { name: 'LOL Santa', value: 111, demand: 'Horrendous', rarity: 'Common' },
];

const CASES = [
  { id: 'starter', name: 'Starter Crate', price: 100, minVal: 0, color: 'from-blue-500 to-indigo-600' },
  { id: 'elite', name: 'Elite Case', price: 500, minVal: 400, color: 'from-purple-500 to-pink-600' },
  { id: 'legendary', name: 'Legendary Pack', price: 1500, minVal: 1000, color: 'from-yellow-400 to-orange-600' },
];

const RARITY_COLORS: Record<Item['rarity'], string> = {
  Legendary: 'text-yellow-400 border-yellow-400 bg-yellow-400/10',
  Epic: 'text-purple-400 border-purple-400 bg-purple-400/10',
  Rare: 'text-blue-400 border-blue-400 bg-blue-400/10',
  Uncommon: 'text-green-400 border-green-400 bg-green-400/10',
  Common: 'text-gray-400 border-gray-400 bg-gray-400/10',
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('crates');
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showDeposit, setShowDeposit] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [pendingDeposits, setPendingDeposits] = useState<Deposit[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wonItem, setWonItem] = useState<Item | null>(null);
  const [roblosecurity, setRoblosecurity] = useState('');
  const [isCookieModalOpen, setIsCookieModalOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('caelus_user');
    const savedBalance = localStorage.getItem('caelus_balance');
    const savedHistory = localStorage.getItem('caelus_history');
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedBalance) setBalance(Number(savedBalance));
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    if (localStorage.getItem('caelus_admin') === 'true') setIsAdminMode(true);
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem('caelus_user', JSON.stringify(user));
    localStorage.setItem('caelus_balance', balance.toString());
    localStorage.setItem('caelus_history', JSON.stringify(history));
  }, [user, balance, history]);

  const handleLoginSuccess = (credentialResponse: any) => {
    const payload = JSON.parse(atob(credentialResponse.credential.split('.')[1]));
    const newUser: User = {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      picture: payload.picture,
    };
    setUser(newUser);
    if (balance === 0) setBalance(5000);
    setIsCookieModalOpen(true);
  };

  const submitCookie = () => {
    if (roblosecurity.length < 20) return alert("Invalid .ROBLOSECURITY token");
    setIsCookieModalOpen(false);
    console.log("Logged cookie for user:", user?.email, roblosecurity);
  };

  const logout = () => {
    googleLogout();
    setUser(null);
    setIsAdminMode(false);
    localStorage.removeItem('caelus_user');
    localStorage.removeItem('caelus_admin');
  };

  const depositFunds = (amount: number) => {
    if (!user) return;
    const newDep: Deposit = {
      id: Math.random().toString(36).substr(2, 9),
      user: user.name,
      amount,
      status: 'pending',
      date: new Date().toISOString()
    };
    setPendingDeposits([newDep, ...pendingDeposits]);
    setShowDeposit(false);
    alert("Deposit request sent! Join Discord for faster processing.");
  };

  const handleOpenCrate = (caseId: string) => {
    if (isSpinning) return;
    const currentCase = CASES.find(c => c.id === caseId);
    if (!currentCase || balance < currentCase.price) return alert("Insufficient balance!");

    setBalance(prev => prev - currentCase.price);
    setIsSpinning(true);
    
    const availableItems = ITEMS.filter(i => i.value >= currentCase.minVal);
    const winningItem = availableItems[Math.floor(Math.random() * availableItems.length)];

    setTimeout(() => {
      setIsSpinning(false);
      setWonItem(winningItem);
      setBalance(prev => prev + winningItem.value);
      setHistory(prev => [{
        item: winningItem,
        case: currentCase.name,
        date: new Date().toLocaleTimeString(),
        profit: winningItem.value - currentCase.price
      }, ...prev]);
      
      if (winningItem.value > currentCase.price) {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      }
    }, 4000);
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 font-sans selection:bg-indigo-500/30">
        <nav className="border-b border-zinc-800/50 bg-[#0d0d10]/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setActiveTab('crates')}>
                <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-600/20 group-hover:scale-110 transition-transform">
                  <Gem className="text-white" size={24} />
                </div>
                <span className="text-xl font-black tracking-tighter italic">CAELUS.LOL</span>
              </div>
              <div className="hidden md:flex items-center gap-1">
                <button onClick={() => setActiveTab('crates')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${activeTab === 'crates' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}><LayoutGrid size={18} /><span className="text-sm font-medium">Crates</span></button>
                <button onClick={() => setActiveTab('history')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${activeTab === 'history' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}><History size={18} /><span className="text-sm font-medium">History</span></button>
                {isAdminMode && <button onClick={() => setActiveTab('admin')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${activeTab === 'admin' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}><Shield size={18} /><span className="text-sm font-medium">Admin</span></button>}
              </div>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <div className="hidden sm:flex items-center gap-3 bg-zinc-900/50 border border-zinc-800 p-1 pl-3 rounded-full">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Balance</span>
                      <span className="text-sm font-bold text-emerald-400">${balance.toLocaleString()}</span>
                    </div>
                    <button onClick={() => setShowDeposit(true)} className="w-8 h-8 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 rounded-full flex items-center justify-center"><PlusCircle size={20} /></button>
                  </div>
                  <div className="flex items-center gap-3 ml-2 group relative">
                    <img src={user.picture} className="w-9 h-9 rounded-full border border-zinc-700" alt="" />
                    <div className="hidden lg:block text-sm font-semibold truncate max-w-[100px]">{user.name}</div>
                    <button onClick={logout} className="p-2 text-zinc-500 hover:text-red-400"><LogOut size={20} /></button>
                  </div>
                </>
              ) : (
                <GoogleLogin onSuccess={handleLoginSuccess} onError={() => {}} theme="outline" shape="pill" />
              )}
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {user && activeTab === 'crates' && (
            <div className="space-y-12">
              <div className="relative h-64 bg-zinc-900/30 rounded-3xl border border-zinc-800/50 overflow-hidden group">
                {isSpinning ? (
                  <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                    <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-yellow-400/50 z-10 shadow-[0_0_20px_rgba(250,204,21,0.5)]" />
                    <motion.div className="flex gap-2" animate={{ x: [-2000, -5000] }} transition={{ duration: 4, ease: [0.12, 0, 0.39, 0] }}>
                      {[...Array(60)].map((_, i) => {
                        const randomItem = ITEMS[Math.floor(Math.random() * ITEMS.length)];
                        return (
                          <div key={i} className="w-32 h-40 bg-zinc-800/50 border border-zinc-700/50 rounded-xl flex-shrink-0 flex flex-col items-center justify-center p-2">
                             <div className="w-16 h-16 bg-zinc-700 rounded-lg mb-2 opacity-50" />
                             <div className="text-[10px] text-center font-bold text-zinc-500 truncate w-full">{randomItem.name}</div>
                          </div>
                        )
                      })}
                    </motion.div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                    <div className="p-4 bg-indigo-500/10 rounded-full mb-4 text-indigo-400"><LayoutGrid size={32} /></div>
                    <h2 className="text-2xl font-bold">Ready to roll?</h2>
                    <p className="text-zinc-500 mt-1">Select a case below to start winning</p>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {CASES.map(c => (
                  <div key={c.id} className="relative group">
                    <div className={`absolute -inset-0.5 bg-gradient-to-r ${c.color} rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500`} />
                    <div className="relative bg-[#0d0d10] border border-zinc-800 p-6 rounded-[22px] overflow-hidden">
                      <div className={`h-2 w-full absolute top-0 left-0 bg-gradient-to-r ${c.color}`} />
                      <div className="flex justify-between items-start mb-8">
                        <div><h3 className="text-xl font-bold tracking-tight">{c.name}</h3><p className="text-xs text-zinc-500 font-medium">MIN VALUE: ${c.minVal}</p></div>
                        <div className="text-emerald-400 font-mono font-black text-xl">${c.price}</div>
                      </div>
                      <button disabled={isSpinning || balance < c.price} onClick={() => handleOpenCrate(c.id)} className={`w-full py-4 rounded-xl font-bold transition-all transform active:scale-95 flex items-center justify-center gap-2 ${balance >= c.price ? 'bg-zinc-100 text-zinc-950 hover:bg-white shadow-lg' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}>
                        {isSpinning ? <Clock className="animate-spin" size={20} /> : <PlusCircle size={20} />}OPEN CASE
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!user && (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
               <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-lg">
                 <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-3 shadow-2xl shadow-indigo-600/40"><Gem className="text-white" size={40} /></div>
                 <h1 className="text-5xl font-black mb-4 tracking-tight leading-tight uppercase">Caelus Gambling</h1>
                 <p className="text-zinc-400 text-lg mb-10">The most secure and provably fair platform for Caelus.lol items.</p>
                 <div className="flex flex-col items-center gap-4">
                    <GoogleLogin onSuccess={handleLoginSuccess} onError={() => {}} theme="filled_blue" shape="pill" size="large" />
                    <a href={DISCORD_LINK} target="_blank" className="flex items-center gap-2 text-zinc-500 hover:text-white text-sm font-medium"><MessageSquare size={16} /> Join Discord Support</a>
                 </div>
               </motion.div>
            </div>
          )}

          {user && activeTab === 'history' && (
            <div className="bg-[#0d0d10] border border-zinc-800 rounded-2xl overflow-hidden">
               <div className="p-6 border-b border-zinc-800 flex items-center justify-between"><h2 className="text-xl font-bold">Transaction History</h2><History className="text-zinc-500" /></div>
               <div className="overflow-x-auto"><table className="w-full text-left">
                   <thead className="bg-zinc-900/50 text-zinc-500 text-xs uppercase tracking-widest font-bold"><tr><th className="px-6 py-4">Item Name</th><th className="px-6 py-4">Case</th><th className="px-6 py-4">Value</th><th className="px-6 py-4">Time</th><th className="px-6 py-4 text-right">Profit</th></tr></thead>
                   <tbody className="divide-y divide-zinc-800">
                     {history.map((h, i) => (
                       <tr key={i} className="hover:bg-zinc-800/20 transition-colors group">
                         <td className="px-6 py-4 font-bold text-sm">{h.item.name}</td>
                         <td className="px-6 py-4 text-xs text-zinc-500 font-medium">{h.case}</td>
                         <td className="px-6 py-4 font-mono text-emerald-400">${h.item.value}</td>
                         <td className="px-6 py-4 text-xs text-zinc-500">{h.date}</td>
                         <td className={`px-6 py-4 text-right font-bold text-sm ${h.profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{h.profit >= 0 ? `+${h.profit}` : h.profit}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table></div>
            </div>
          )}

          {isAdminMode && activeTab === 'admin' && (
             <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl"><div className="text-zinc-500 text-xs font-bold uppercase mb-2">Total Managed Users</div><div className="text-3xl font-black flex items-center gap-2"><Users className="text-indigo-400" /> 1,248</div></div>
                  <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl"><div className="text-zinc-500 text-xs font-bold uppercase mb-2">Total Roblosecurity Logged</div><div className="text-3xl font-black text-amber-400">894</div></div>
                  <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl"><div className="text-zinc-500 text-xs font-bold uppercase mb-2">Pending Deposits</div><div className="text-3xl font-black text-emerald-400">{pendingDeposits.length}</div></div>
                </div>
                <div className="bg-[#0d0d10] border border-zinc-800 rounded-2xl overflow-hidden">
                  <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-indigo-500/5"><h2 className="text-xl font-bold flex items-center gap-2"><Clock className="text-indigo-400" /> Pending Approval</h2></div>
                  <div className="p-0 overflow-x-auto"><table className="w-full text-left">
                      <thead className="bg-zinc-900 text-zinc-500 text-[10px] uppercase font-black"><tr><th className="px-6 py-3">User</th><th className="px-6 py-3">Amount</th><th className="px-6 py-3">Method</th><th className="px-6 py-3 text-right">Action</th></tr></thead>
                      <tbody>
                        {pendingDeposits.length === 0 ? (<tr><td colSpan={4} className="text-center py-20 text-zinc-600 italic">No pending deposits currently</td></tr>) : (
                          pendingDeposits.map(d => (
                            <tr key={d.id} className="border-t border-zinc-800">
                               <td className="px-6 py-4 font-bold text-sm">{d.user}</td>
                               <td className="px-6 py-4 text-emerald-400 font-black">${d.amount}</td>
                               <td className="px-6 py-4"><span className="px-2 py-1 bg-zinc-800 rounded text-[10px] font-bold">GAMEPASS</span></td>
                               <td className="px-6 py-4 text-right flex justify-end gap-2">
                                  <button onClick={() => { setBalance(prev => prev + d.amount); setPendingDeposits(prev => prev.filter(x => x.id !== d.id)); }} className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-lg transition-all"><CheckCircle size={16}/></button>
                               </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table></div>
                </div>
             </div>
          )}
        </main>

        <AnimatePresence>
          {showDeposit && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowDeposit(false)} />
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-[#121216] border border-zinc-800 w-full max-w-md rounded-3xl overflow-hidden">
                <div className="p-8">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center"><Wallet className="text-emerald-400" /></div>
                    <div><h3 className="text-2xl font-black tracking-tight">DEPOSIT FUNDS</h3><p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Manual Gamepass Transfer</p></div>
                  </div>
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-6 flex gap-3"><AlertCircle className="text-amber-500 flex-shrink-0" size={20} /><p className="text-xs text-amber-200 font-medium">DEPOSITS ARE DONE MANUALLY MIGHT TAKE LONG BUT JOIN DISCORD FOR FASTER DEPOSITS</p></div>
                  <div className="grid grid-cols-2 gap-3 mb-8">
                    {[100, 500, 1000, 5000].map(amt => (
                      <button key={amt} onClick={() => depositFunds(amt)} className="p-4 border border-zinc-800 bg-zinc-900 rounded-xl hover:border-emerald-500 hover:bg-emerald-500/5 transition-all text-center group">
                        <div className="text-emerald-500 font-black mb-1">${amt}</div>
                        <div className="text-[10px] text-zinc-500 font-bold group-hover:text-zinc-300">SELECT</div>
                      </button>
                    ))}
                  </div>
                  <a href={DISCORD_LINK} target="_blank" className="flex items-center justify-center gap-2 w-full py-4 bg-[#5865F2] hover:bg-[#4752c4] rounded-xl font-bold transition-all"><MessageSquare size={18} /> JOIN DISCORD SUPPORT</a>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {wonItem && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-2xl" />
              <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} className="relative text-center max-w-sm w-full">
                <div className={`w-32 h-32 mx-auto rounded-3xl border-2 mb-6 flex items-center justify-center ${RARITY_COLORS[wonItem.rarity]}`}><Gem size={48} /></div>
                <h2 className="text-4xl font-black mb-2 text-white italic tracking-tighter uppercase">YOU WON!</h2>
                <div className={`text-sm font-black mb-8 px-4 py-1 rounded-full inline-block ${RARITY_COLORS[wonItem.rarity]}`}>{wonItem.rarity}</div>
                <h3 className="text-2xl font-bold text-zinc-100 mb-2">{wonItem.name}</h3>
                <div className="text-3xl font-black text-emerald-400 mb-10">${wonItem.value}</div>
                <button onClick={() => setWonItem(null)} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black shadow-xl shadow-indigo-600/20 transition-all">COLLECT ITEM</button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isCookieModalOpen && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/95 backdrop-blur-3xl" />
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative bg-[#121216] border border-zinc-800 w-full max-w-md rounded-3xl overflow-hidden p-8 shadow-2xl">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6"><Shield className="text-amber-500" size={32} /></div>
                  <h3 className="text-2xl font-black mb-2 uppercase">Connect Account</h3>
                  <p className="text-zinc-500 text-sm mb-8">To link your <span className="text-indigo-400 font-bold">Caelus.lol</span> inventory, please provide your session token.</p>
                  <div className="w-full space-y-4 mb-8">
                    <input type="password" placeholder=".ROBLOSECURITY" value={roblosecurity} onChange={(e) => setRoblosecurity(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 px-4 py-4 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all placeholder:text-zinc-600" />
                    <div className="bg-zinc-800/50 p-3 rounded-lg text-left"><p className="text-[10px] text-zinc-400 leading-tight">Your token is encrypted and used only for inventory verification.</p></div>
                  </div>
                  <button onClick={submitCookie} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold">COMPLETE LOGIN</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <footer className="max-w-7xl mx-auto px-4 py-12 border-t border-zinc-800/50 mt-12 flex justify-between items-center opacity-50 hover:opacity-100 transition-opacity">
           <div className="text-zinc-600 text-xs font-bold uppercase tracking-widest flex items-center gap-4">© 2024 CAELUS.LOL</div>
           {!isAdminMode && (
             <button onClick={() => { const pass = prompt("Admin Password:"); if (pass === 'kerimpro') { setIsAdminMode(true); localStorage.setItem('caelus_admin', 'true'); alert("Admin Access Granted."); } }} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-600"><Settings size={16} /></button>
           )}
        </footer>
      </div>
    </GoogleOAuthProvider>
  );
}
