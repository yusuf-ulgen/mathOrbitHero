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
      radius: Math.min(100 + (i * 40), 220),
      rotationSpeed: baseSpeed + (rng.nextInt(-1000, 1000)),
      slots: slotsData[i],
      initialRotation: rng.nextInt(0, 359),
    });
  }

  // Calculate maximum achievable power for balance
  let maxPossiblePower = 5;
  slotsData.forEach(orbitSlots => {
    let best = -999999;
    orbitSlots.forEach(slot => {
        let test = maxPossiblePower;
        if (slot.op === '+') test += slot.value;
        if (slot.op === '-') test -= slot.value;
        if (slot.op === '*') test *= slot.value;
        if (slot.op === '/') test = Math.floor(test / slot.value);
        if (test > best) best = test;
    });
    maxPossiblePower = Math.max(0, best);
  });

  // Meteor health calculation
  let meteorHealth = 0;
  if (isBoss) {
    // Requires a near perfect run (70% - 95% of max possible power)
    meteorHealth = Math.floor(maxPossiblePower * (0.7 + rng.next() * 0.25));
  } else {
    // Requires an okay run (40% - 75% of max possible power)
    meteorHealth = Math.floor(maxPossiblePower * (0.4 + rng.next() * 0.35));
  }
  
  meteorHealth = Math.max(10, meteorHealth); // Ensure health is at least 10

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
