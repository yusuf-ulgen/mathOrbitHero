import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LevelConfig, generateLevel, MathOp } from '../utils/levelGenerator';

interface GameState {
  // Stats
  heroPower: number;
  gold: number;
  currentLevelIndex: number;
  highScore: number;
  currentScore: number;

  // Game Logic
  gameMode: 'LEVEL' | null;
  gamePhase: 'MENU' | 'ORBIT_PHASE' | 'METEOR_PHASE' | 'GAME_OVER' | 'WIN';
  activeOrbitIndex: number;
  currentLevelData: LevelConfig | null;
  meteorCurrentHealth: number;
  showTutorialWarning: boolean;
  levelSessionId: number;
  levelCompleted: boolean; // Flag to prevent ANY double completion

  // Skill System
  unlockedSkills: string[];
  skillLevels: Record<string, number>;
  levelsSinceLastDrop: number;

  // Actions
  setGameMode: (mode: 'LEVEL') => void;
  startLevel: (level?: number) => void;
  applyMathOp: (op: MathOp, value: number) => void;
  updateHeroPower: (opStr: string) => void;
  nextOrbit: () => void;
  completeLevel: (success: boolean) => void;
  setGamePhase: (phase: GameState['gamePhase']) => void;
  resetToMenu: () => void;
  skipOrbit: () => void;
  damageMeteor: (amount: number) => void;
  setShowTutorialWarning: (show: boolean) => void;
  addGold: (amount: number) => void;
  upgradeSkill: (skillId: string) => void;
  incrementPityTimer: () => void;
  resetPityTimer: () => void;
  resetHeroPower: () => void;
  resetProgress: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      heroPower: 5,
      gold: 0,
      currentLevelIndex: 1,
      highScore: 0,
      currentScore: 0,
      gameMode: null,
      gamePhase: 'MENU',
      currentLevelData: null,
      activeOrbitIndex: 0,
      meteorCurrentHealth: 0,
      showTutorialWarning: false,
      levelSessionId: 0,
      levelCompleted: false,
      unlockedSkills: [],
      skillLevels: {},
      levelsSinceLastDrop: 0,

      setGameMode: (mode) => set({ gameMode: mode, currentScore: 0 }),

      startLevel: (level) => {
        const currentLvl = get().currentLevelIndex;
        const data = generateLevel(level || currentLvl);

        set({
          currentLevelData: data,
          gamePhase: 'ORBIT_PHASE',
          activeOrbitIndex: 0,
          meteorCurrentHealth: data.meteorHealth,
          heroPower: 5,
          levelSessionId: Date.now(),
          levelCompleted: false, // Reset completion flag for new level
        });
      },

      applyMathOp: (op, value) => {
        const currentPower = get().heroPower;
        let newPower = currentPower;
        if (op === '+') newPower += value;
        if (op === '-') newPower -= value;
        if (op === '*') newPower *= value;
        if (op === '/') newPower = Math.floor(newPower / value);
        set({ heroPower: Math.max(0, newPower) });
      },

      updateHeroPower: (opStr) => {
        const opStrClean = opStr.trim();
        const opChar = opStrClean[0];
        const value = parseInt(opStrClean.slice(1));

        let op: MathOp = '+';
        if (opChar === 'x' || opChar === '*') op = '*';
        else if (opChar === '/') op = '/';
        else if (opChar === '-') op = '-';
        else op = '+';

        get().applyMathOp(op, value);
      },

      nextOrbit: () => {
        const state = get();
        const isLastOrbit = state.activeOrbitIndex === (state.currentLevelData?.orbits.length || 0) - 1;
        if (isLastOrbit) {
          set({ gamePhase: 'METEOR_PHASE' });
        } else {
          set({ activeOrbitIndex: state.activeOrbitIndex + 1 });
        }
      },

      completeLevel: (success) => {
        const state = get();

        // ABSOLUTE GUARD: If this level is already completed, do nothing.
        // This is the primary defense against the level-skip bug.
        if (state.levelCompleted) return;

        // Also reject if we're already in a terminal phase
        if (state.gamePhase === 'WIN' || state.gamePhase === 'GAME_OVER') return;

        // A level can only be won from the battle phase
        if (success && state.gamePhase !== 'METEOR_PHASE') return;

        if (!success) {
          set({ gamePhase: 'GAME_OVER', levelCompleted: true });
          return;
        }

        const bonusGold = 10 + (state.currentLevelIndex * 5);

        set({
          gamePhase: 'WIN',
          currentLevelIndex: state.currentLevelIndex + 1,
          gold: state.gold + bonusGold,
          levelCompleted: true,
        });
      },

      setGamePhase: (phase) => set({ gamePhase: phase }),

      resetToMenu: () => set({
        gamePhase: 'MENU',
        gameMode: null,
        currentLevelData: null,
        showTutorialWarning: false
      }),

      skipOrbit: () => {
        const state = get();
        const isLastOrbit = state.activeOrbitIndex === (state.currentLevelData?.orbits.length || 0) - 1;
        if (isLastOrbit) {
          set({ gamePhase: 'METEOR_PHASE' });
        } else {
          set({ activeOrbitIndex: state.activeOrbitIndex + 1 });
        }
      },

      damageMeteor: (amount) => {
        const state = get();
        if (state.gamePhase !== 'METEOR_PHASE') return;
        if (state.levelCompleted) return;

        const newHealth = Math.max(0, state.meteorCurrentHealth - amount);
        set({ meteorCurrentHealth: newHealth });
      },

      setShowTutorialWarning: (show) => set({ showTutorialWarning: show }),

      addGold: (amount) => set((state) => ({ gold: state.gold + amount })),

      upgradeSkill: (skillId) => set((state) => ({
        skillLevels: { ...state.skillLevels, [skillId]: (state.skillLevels[skillId] || 1) + 1 }
      })),

      incrementPityTimer: () => set((state) => ({ levelsSinceLastDrop: state.levelsSinceLastDrop + 1 })),

      resetPityTimer: () => set({ levelsSinceLastDrop: 0 }),

      resetHeroPower: () => set({ heroPower: 5 }),

      resetProgress: () => set({
        currentLevelIndex: 1,
        gold: 0,
        highScore: 0,
        currentScore: 0,
        unlockedSkills: [],
        skillLevels: {},
        levelsSinceLastDrop: 0,
        heroPower: 5,
        gamePhase: 'MENU',
        currentLevelData: null,
        levelSessionId: 0,
      }),
    }),
    {
      name: 'math-orbit-hero-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentLevelIndex: state.currentLevelIndex,
        highScore: state.highScore,
        gold: state.gold,
        unlockedSkills: state.unlockedSkills,
        skillLevels: state.skillLevels
      }),
    }
  )
);
