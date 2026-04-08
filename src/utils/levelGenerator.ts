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
}

export interface LevelConfig {
  id: number;
  orbits: OrbitData[];
  meteorHealth: number;
  meteorCount: number;
}

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateSlot = (isNegativeForce: boolean): MathSlot => {
  const ops: MathOp[] = isNegativeForce ? ['-', '/'] : ['+', '*', '-', '/'];
  const op = ops[getRandomInt(0, ops.length - 1)];
  let value = 0;

  if (op === '+') value = getRandomInt(1, 20);
  if (op === '-') value = getRandomInt(1, 15);
  if (op === '*') value = getRandomInt(2, 4);
  if (op === '/') value = getRandomInt(2, 3);

  return {
    op,
    value,
    label: `${op}${value}`,
  };
};

export const generateLevel = (level: number): LevelConfig => {
  const orbitCount = Math.min(3 + Math.floor(level / 5), 10);
  const orbits: OrbitData[] = [];

  for (let i = 0; i < orbitCount; i++) {
    const slots: MathSlot[] = [];
    // Ensure at least one is negative/division as requested
    const negativeIndex = getRandomInt(0, 2);
    
    for (let s = 0; s < 3; s++) {
      slots.push(generateSlot(s === negativeIndex));
    }

    orbits.push({
      radius: 80 + (i * 45),
      rotationSpeed: Math.max(3000, 8000 - (level * 50) - (i * 200)),
      slots,
    });
  }

  // Meteor health logic: base 50 + (level * 20) + random variance
  const meteorHealth = 50 + (level * 25) + getRandomInt(0, level * 5);

  return {
    id: level,
    orbits,
    meteorHealth,
    meteorCount: 1, // Start with 1, can increase later
  };
};

export const generateInfinityLevel = (round: number): LevelConfig => {
  return generateLevel(round + 10); // Start harder in infinity
};
