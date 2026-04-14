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
