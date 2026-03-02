import { useState } from 'react';

export default function Mines() {
  const [grid, setGrid] = useState(Array(25).fill(null));
  const [gameOver, setGameOver] = useState(false);
  const [playing, setPlaying] = useState(false);

  const startGame = () => {
    setGrid(Array(25).fill(null));
    setGameOver(false);
    setPlaying(true);
  };

  const handleTileClick = (index: number) => {
    if (!playing || gameOver) return;
    
    // 70% House Edge (Bomb), 30% Player Advantage (Gem)
    const isBomb = Math.random() < 0.7;
    
    const newGrid = [...grid];
    newGrid[index] = isBomb ? 'bomb' : 'gem';
    setGrid(newGrid);
    
    if (isBomb) {
      setGameOver(true);
      setPlaying(false);
    }
  };

  return (
    <div className="bg-[#0f0f12] p-8 rounded-2xl border border-[#1f1f23]">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-white">Mines</h2>
        <button onClick={startGame} className="bg-indigo-600 px-6 py-2 rounded-xl font-bold hover:bg-indigo-500 transition-all">
          {playing ? 'Active' : 'New Game'}
        </button>
      </div>
      <div className="grid grid-cols-5 gap-3 max-w-sm mx-auto">
        {grid.map((val, i) => (
          <button 
            key={i} 
            onClick={() => handleTileClick(i)}
            disabled={gameOver || (val !== null && !playing)}
            className={`aspect-square rounded-xl flex items-center justify-center text-2xl transition-all duration-300 ${
              val === 'bomb' ? 'bg-red-500/20 border border-red-500/50' : 
              val === 'gem' ? 'bg-emerald-500/20 border border-emerald-500/50' : 
              'bg-[#16161a] border border-[#1f1f23] hover:border-indigo-500/50'
            }`}
          >
            {val === 'bomb' ? '💣' : val === 'gem' ? '💎' : ''}
          </button>
        ))}
      </div>
    </div>
  );
}
