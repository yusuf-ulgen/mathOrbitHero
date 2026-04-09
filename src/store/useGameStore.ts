import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LevelConfig, generateLevel, generateInfinityLevel, MathOp } from '../utils/levelGenerator';

interface GameState {
  heroPower: number;
  currentLevelIndex: number;
  highScore: number;
  currentScore: number; // Tracks current run score for infinity
  gameMode: 'LEVEL' | 'INFINITY' | null;
  gamePhase: 'MENU' | 'ORBIT_PHASE' | 'METEOR_PHASE' | 'GAME_OVER' | 'WIN';
  currentLevelData: LevelConfig | null;
  activeOrbitIndex: number;
  showTutorialWarning: boolean;
  
  // Actions
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

      setGameMode: (mode) => set({ gameMode: mode, currentScore: 0 }),

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
