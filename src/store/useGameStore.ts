import { create } from 'zustand';

interface Skill {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  baseCost: number;
}

interface GameState {
  // Stats
  heroPower: number;
  gold: number;
  currentLevel: number;
  score: number;
  highScore: number;
  
  // Skill System
  unlockedSkills: string[]; // skill IDs
  skillLevels: Record<string, number>;
  levelsSinceLastDrop: number;

  // Game Progress
  gameState: 'NAV' | 'PLAYING' | 'BATTLE' | 'FAILED' | 'WIN';
  
  // Actions
  setGameState: (state: GameState['gameState']) => void;
  updateHeroPower: (value: number | string) => void;
  addGold: (amount: number) => void;
  unlockSkill: (skillId: string) => void;
  upgradeSkill: (skillId: string) => void;
  progressLevel: () => void;
  incrementPityTimer: () => void;
  resetPityTimer: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  heroPower: 5,
  gold: 0,
  currentLevel: 1,
  score: 0,
  highScore: 0,
  
  unlockedSkills: [],
  skillLevels: {},
  levelsSinceLastDrop: 0,

  gameState: 'NAV',

  setGameState: (state) => set({ gameState: state }),

  updateHeroPower: (val) => set((state) => {
    let newValue = state.heroPower;
    if (typeof val === 'number') {
      newValue += val;
    } else {
      const op = val[0];
      const num = parseInt(val.slice(1));
      if (op === 'x') newValue *= num;
      if (op === '/') newValue = Math.floor(newValue / num);
      if (op === '+') newValue += num;
      if (op === '-') newValue -= num;
    }
    return { heroPower: Math.max(0, newValue) };
  }),

  addGold: (amount) => set((state) => ({ gold: state.gold + amount })),

  unlockSkill: (skillId) => set((state) => ({
    unlockedSkills: [...state.unlockedSkills, skillId],
    skillLevels: { ...state.skillLevels, [skillId]: 1 }
  })),

  upgradeSkill: (skillId) => set((state) => ({
    skillLevels: { ...state.skillLevels, [skillId]: (state.skillLevels[skillId] || 1) + 1 }
  })),

  progressLevel: () => set((state) => ({
    currentLevel: state.currentLevel + 1,
    levelsSinceLastDrop: state.levelsSinceLastDrop + 1
  })),

  incrementPityTimer: () => set((state) => ({ levelsSinceLastDrop: state.levelsSinceLastDrop + 1 })),
  
  resetPityTimer: () => set({ levelsSinceLastDrop: 0 }),

  resetGame: () => set((state) => ({
    heroPower: 5,
    score: 0,
    gameState: 'NAV',
  })),
}));

