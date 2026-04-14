<<<<<<< HEAD
import seedrandom from 'seedrandom';

export interface OrbitalData {
  radius: number;
  rotationSpeed: number;
  slices: {
    operation: string;
    type: 'gate';
  }[];
}

export interface LevelConfig {
  level: number;
  orbitals: OrbitalData[];
  enemyHealth: number;
  timeLimit: number;
}

const OPERATIONS = ['+2', '+5', '+10', 'x2', 'x3', '-5', '/2'];

export const generateLevel = (level: number): LevelConfig => {
  const rng = seedrandom(level.toString());
  
  // Difficulty scaling
  const orbitalCount = Math.min(3 + Math.floor(level / 10), 8);
  const baseRotationSpeed = Math.max(5000 - level * 50, 2000);
  const enemyHealth = Math.floor(20 * Math.pow(1.2, level));
  const timeLimit = Math.min(30 + level * 2, 120);

  const orbitals: OrbitalData[] = [];
  for (let i = 0; i < orbitalCount; i++) {
    const slices = [];
    for (let j = 0; j < 3; j++) {
       // Pick a random operation based on level
       const opIndex = Math.floor(rng() * Math.min(level + 3, OPERATIONS.length));
       slices.push({
         operation: OPERATIONS[opIndex] || '+2',
         type: 'gate' as const
       });
    }

    orbitals.push({
      radius: 80 + i * 50,
      rotationSpeed: baseRotationSpeed - i * 500,
      slices
    });
  }

  return {
    level,
    orbitals,
    enemyHealth,
    timeLimit
  };
};
=======
import { SeededRandom } from './random';

export type MathOp = '+' | '-' | '*' | '/';

export interface MathSlot {
  op: MathOp;
  value: number;
  label: string;
}

export interface OrbitData {
  radius: number;
  rotationSpeed: number;
  slots: MathSlot[];
  initialRotation: number;
}

export interface LevelConfig {
  id: number;
  orbits: OrbitData[];
  meteorHealth: number;
  meteorCount: number;
  isBoss: boolean;
}

const generateLevelSlots = (rng: SeededRandom, isBoss: boolean, orbitCount: number): MathSlot[][] => {
  const allSlots: MathSlot[][] = [];
  
  // Total negative operations = OrbitCount - 1
  const totalNegativeItems = orbitCount - 1;
  const slotPositions: { orbitIdx: number; slotIdx: number }[] = [];
  
  for (let i = 0; i < orbitCount; i++) {
    for (let s = 0; s < 3; s++) {
      slotPositions.push({ orbitIdx: i, slotIdx: s });
    }
  }
  
  // Randomly pick unique positions for negatives
  const negativePositions = rng.shuffle(slotPositions).slice(0, totalNegativeItems);
  
  for (let i = 0; i < orbitCount; i++) {
    const orbitSlots: MathSlot[] = [];
    for (let s = 0; s < 3; s++) {
      const isNegative = negativePositions.some(p => p.orbitIdx === i && p.slotIdx === s);
      const ops: MathOp[] = isNegative ? ['-', '/'] : ['+', '*'];
      const op = rng.pick(ops);
      
      let value = 0;
      if (op === '+') value = rng.nextInt(5, 25);
      if (op === '-') value = rng.nextInt(5, 15);
      if (op === '*') value = rng.nextInt(2, 4);
      if (op === '/') value = rng.nextInt(2, 3);
      
      orbitSlots.push({
        op,
        value,
        label: `${op}${value}`,
      });
    }
    allSlots.push(orbitSlots);
  }
  
  return allSlots;
};

export const generateLevel = (levelId: number): LevelConfig => {
  const rng = new SeededRandom(levelId);
  const isBoss = levelId > 0 && levelId % 10 === 0;
  
  // Difficulty scaling
  const orbitCount = Math.min(3 + Math.floor(levelId / 10), 6);
  const baseSpeed = Math.max(3000, 10000 - (levelId * 200));
  
  const slotsData = generateLevelSlots(rng, isBoss, orbitCount);
  const orbits: OrbitData[] = [];
  
  for (let i = 0; i < orbitCount; i++) {
    orbits.push({
      radius: 100 + (i * 55),
      rotationSpeed: baseSpeed + (rng.nextInt(-1000, 1000)),
      slots: slotsData[i],
      initialRotation: rng.nextInt(0, 359),
    });
  }

  // Meteor health calculation
  let meteorHealth = 0;
  if (isBoss) {
    // Boss Level: Requires finding the "best" path
    // Set health to a value that requires at least 2-3 multipliers or many additions
    meteorHealth = Math.floor(levelId * 80 + rng.nextInt(50, 200));
  } else {
    meteorHealth = 50 + (levelId * 30) + rng.nextInt(0, 50);
  }

  return {
    id: levelId,
    orbits,
    meteorHealth,
    meteorCount: 1,
    isBoss,
  };
};

export const generateInfinityLevel = (round: number): LevelConfig => {
  return generateLevel(round + 15); // Start harder in infinity
};
>>>>>>> 9e0da47b4f159a8f31eb1bc220f72c2cbfbc5a2e
