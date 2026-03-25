import { create } from 'zustand';

interface GameState {
  heroValue: number;
  currentOrbit: number;
  gameState: 'START' | 'PLAYING' | 'FAILED' | 'BOSS' | 'WIN';
  score: number;
  highScore: number;
  
  // Actions
  setGameState: (state: GameState['gameState']) => void;
  updateHeroValue: (value: number | string) => void;
  nextOrbit: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  heroValue: 10,
  currentOrbit: 0,
  gameState: 'START',
  score: 0,
  highScore: 0,

  setGameState: (state) => set({ gameState: state }),

  updateHeroValue: (val) => set((state) => {
    let newValue = state.heroValue;
    if (typeof val === 'number') {
      newValue += val;
    } else {
      // Handle operators like 'x2' or '/2'
      const op = val[0];
      const num = parseInt(val.slice(1));
      if (op === 'x') newValue *= num;
      if (op === '/') newValue = Math.floor(newValue / num);
      if (op === '+') newValue += num;
      if (op === '-') newValue -= num;
    }
    return { heroValue: Math.max(0, newValue) };
  }),

  nextOrbit: () => set((state) => ({ 
    currentOrbit: state.currentOrbit + 1,
    score: state.score + 10 
  })),

  resetGame: () => set({
    heroValue: 10,
    currentOrbit: 0,
    gameState: 'START',
    score: 0,
  }),
}));
