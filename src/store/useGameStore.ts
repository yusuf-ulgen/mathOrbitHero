import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LevelConfig, generateLevel, generateInfinityLevel, MathOp } from '../utils/levelGenerator';

interface Skill {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  baseCost: number;
}

interface GameState {
<<<<<<< HEAD
  // Stats
  heroPower: number;
  gold: number;
  currentLevel: number;
  score: number;
=======
  heroPower: number;
  currentLevelIndex: number;
>>>>>>> 9e0da47b4f159a8f31eb1bc220f72c2cbfbc5a2e
  highScore: number;
  currentScore: number; // Tracks current run score for infinity
  gameMode: 'LEVEL' | 'INFINITY' | null;
  gamePhase: 'MENU' | 'ORBIT_PHASE' | 'METEOR_PHASE' | 'GAME_OVER' | 'WIN';
  currentLevelData: LevelConfig | null;
  activeOrbitIndex: number;
  showTutorialWarning: boolean;
  
  // Skill System
  unlockedSkills: string[]; // skill IDs
  skillLevels: Record<string, number>;
  levelsSinceLastDrop: number;

  // Game Progress
  gameState: 'NAV' | 'PLAYING' | 'BATTLE' | 'FAILED' | 'WIN';
  
  // Actions
<<<<<<< HEAD
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
=======
  setGameMode: (mode: 'LEVEL' | 'INFINITY') => void;
  startLevel: (level?: number) => void;
  applyMathOp: (op: MathOp, value: number) => void;
  nextOrbit: () => void;
  completeLevel: (success: boolean) => void;
  setGamePhase: (phase: GameState['gamePhase']) => void;
  resetToMenu: () => void;
  skipOrbit: () => void;
  setShowTutorialWarning: (show: boolean) => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      heroPower: 5,
      currentLevelIndex: 1,
      highScore: 0,
      currentScore: 0,
      gameMode: null,
      gamePhase: 'MENU',
      currentLevelData: null,
      activeOrbitIndex: 0,
      showTutorialWarning: false,
>>>>>>> 9e0da47b4f159a8f31eb1bc220f72c2cbfbc5a2e

      setGameMode: (mode) => set({ gameMode: mode, currentScore: 0 }),

<<<<<<< HEAD
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

=======
      startLevel: (level) => {
        const mode = get().gameMode;
        const currentLvl = get().currentLevelIndex;
        const score = get().currentScore;
        
        // Infinity starts easy and scales with current run score
        const data = mode === 'INFINITY' 
          ? generateInfinityLevel(score) 
          : generateLevel(level || currentLvl);

        set({
          currentLevelData: data,
          gamePhase: 'ORBIT_PHASE',
          activeOrbitIndex: 0,
          heroPower: 5,
        });
      },

      applyMathOp: (op, value) => set((state) => {
        let newPower = state.heroPower;
        if (op === '+') newPower += value;
        if (op === '-') newPower -= value;
        if (op === '*') newPower *= value;
        if (op === '/') newPower = Math.floor(newPower / value);
        return { heroPower: Math.max(0, newPower) };
      }),

      nextOrbit: () => set((state) => {
        const isLastOrbit = state.activeOrbitIndex === (state.currentLevelData?.orbits.length || 0) - 1;
        if (isLastOrbit) {
          return { gamePhase: 'METEOR_PHASE' };
        }
        return { activeOrbitIndex: state.activeOrbitIndex + 1 };
      }),

      completeLevel: (success) => set((state) => {
        if (!success) return { gamePhase: 'GAME_OVER' };
        
        if (state.gameMode === 'LEVEL') {
          return { 
            gamePhase: 'WIN', 
            currentLevelIndex: state.currentLevelIndex + 1 
          };
        } else {
          const newScore = state.currentScore + 1;
          return { 
            gamePhase: 'WIN', 
            currentScore: newScore,
            highScore: Math.max(state.highScore, newScore) 
          };
        }
      }),

      setGamePhase: (phase) => set({ gamePhase: phase }),

      resetToMenu: () => set({ gamePhase: 'MENU', gameMode: null, currentLevelData: null, showTutorialWarning: false }),

      skipOrbit: () => set((state) => {
        const isLastOrbit = state.activeOrbitIndex === (state.currentLevelData?.orbits.length || 0) - 1;
        if (isLastOrbit) {
          return { gamePhase: 'METEOR_PHASE' };
        }
        return { activeOrbitIndex: state.activeOrbitIndex + 1 };
      }),

      setShowTutorialWarning: (show) => set({ showTutorialWarning: show }),
    }),
    {
      name: 'math-orbit-hero-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        currentLevelIndex: state.currentLevelIndex, 
        highScore: state.highScore 
      }),
    }
  )
);
>>>>>>> 9e0da47b4f159a8f31eb1bc220f72c2cbfbc5a2e
