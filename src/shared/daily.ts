// Shadowline core — framework-free daily logic.
// Shared by client preview + server verification: both import this exact
// file, so client and server agree exactly.
// Ported 1:1 from ~/workspace/reddit-game-of-the-day/core/daily.mjs — the
// .mjs is the reference implementation; any change here must be mirrored
// there and re-verified with the determinism cross-check (see daily.test.ts).
// No Date.now() inside pure functions: every function takes the UTC date
// string explicitly.

export type Difficulty = 'easy' | 'medium' | 'hard';

export type EulerDeg = [number, number, number];

export type Quat = [number, number, number, number];

export type DailyObject = {
  id: string;
  name: string;
  category: string;
  difficulty: Difficulty;
  clue: string;
  targets: EulerDeg[];
};

export type DailyPuzzle = {
  dateKey: string;
  number: number;
  difficulty: Difficulty;
  objectId: string;
  objectName: string;
  clue: string;
  targetEulerDeg: EulerDeg;
};

export type ScoreResult = DailyPuzzle & {
  angleDeg: number;
  accuracy: number;
  stars: number;
};

// --- Seeded PRNG (mulberry32) -------------------------------------------
export function hashDate(dateKey: string): number {
  // dateKey: 'YYYY-MM-DD' (UTC). FNV-1a 32-bit.
  let h = 0x811c9dc5;
  for (let i = 0; i < dateKey.length; i++) {
    h ^= dateKey.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function utcDateKey(d = new Date()): string {
  return d.toISOString().slice(0, 10); // UTC date, YYYY-MM-DD
}

export function weekdayUtc(dateKey: string): number {
  // 0=Sun .. 6=Sat, computed from the date key alone (no local TZ).
  return new Date(dateKey + 'T00:00:00Z').getUTCDay();
}

// Difficulty ramp: Mon–Tue easy, Wed–Thu medium, Fri–Sun hard.
export function difficultyFor(dateKey: string): Difficulty {
  const w = weekdayUtc(dateKey);
  if (w === 1 || w === 2) return 'easy';
  if (w === 3 || w === 4) return 'medium';
  return 'hard';
}

// --- Object bank ----------------------------------------------------------
// Each object: id, name, category, difficulty, clue, and curated target
// rotations (Euler degrees [x, y, z]) pre-verified to give a recognisable,
// non-degenerate silhouette (no near-symmetric view where two rotations
// look identical). Rotations are applied in XYZ order, degrees.
export const OBJECTS: DailyObject[] = [
  { id: 'teapot', name: 'Teapot', category: 'household', difficulty: 'easy', clue: 'kitchen, pours', targets: [[0, 35, 0], [0, 140, 0], [-15, 70, 0]] },
  { id: 'boot', name: 'Boot', category: 'household', difficulty: 'easy', clue: 'worn on foot', targets: [[0, 20, 0], [0, 115, 0], [10, 200, 0]] },
  { id: 'mug', name: 'Mug', category: 'household', difficulty: 'easy', clue: 'holds coffee', targets: [[0, 45, 0], [0, 160, 0], [-10, 90, 0]] },
  { id: 'lamp', name: 'Lamp', category: 'household', difficulty: 'easy', clue: 'lights the room', targets: [[0, 30, 0], [0, 130, 0], [5, 220, 0]] },
  { id: 'key', name: 'Key', category: 'household', difficulty: 'medium', clue: 'opens doors', targets: [[0, 55, 0], [20, 150, 0], [0, 250, 10]] },
  { id: 'scissors', name: 'Scissors', category: 'household', difficulty: 'medium', clue: 'cuts paper', targets: [[0, 40, 0], [15, 170, 0], [0, 300, 0]] },
  { id: 'pine', name: 'Pine Tree', category: 'nature', difficulty: 'easy', clue: 'evergreen', targets: [[0, 25, 0], [0, 120, 0], [-5, 200, 0]] },
  { id: 'fish', name: 'Fish', category: 'nature', difficulty: 'medium', clue: 'swims', targets: [[0, 50, 0], [10, 145, 0], [0, 230, 0]] },
  { id: 'snail', name: 'Snail', category: 'nature', difficulty: 'medium', clue: 'slow, shelled', targets: [[0, 35, 0], [0, 155, 0], [5, 260, 0]] },
  { id: 'mushroom', name: 'Mushroom', category: 'nature', difficulty: 'easy', clue: 'grows in shade', targets: [[0, 60, 0], [0, 180, 0], [-10, 280, 0]] },
  { id: 'bicycle', name: 'Bicycle', category: 'transport', difficulty: 'hard', clue: 'two wheels', targets: [[0, 15, 0], [0, 100, 0], [8, 190, 0]] },
  { id: 'anchor', name: 'Anchor', category: 'transport', difficulty: 'hard', clue: 'holds ships', targets: [[0, 45, 0], [12, 135, 0], [0, 240, 0]] },
  { id: 'guitar', name: 'Guitar', category: 'tools', difficulty: 'hard', clue: 'six strings', targets: [[0, 30, 0], [0, 125, 0], [15, 210, 0]] },
  { id: 'lighthouse', name: 'Lighthouse', category: 'whimsy', difficulty: 'medium', clue: 'guides ships', targets: [[0, 40, 0], [0, 150, 0], [-5, 270, 0]] },
  { id: 'windmill', name: 'Windmill', category: 'whimsy', difficulty: 'hard', clue: 'catches wind', targets: [[0, 20, 0], [0, 110, 0], [10, 200, 0]] },
  { id: 'crown', name: 'Crown', category: 'whimsy', difficulty: 'easy', clue: 'worn by royalty', targets: [[0, 50, 0], [0, 165, 0], [0, 290, 0]] },
  { id: 'chair', name: 'Chair', category: 'household', difficulty: 'easy', clue: 'sit on it', targets: [[0, 25, 0], [0, 130, 0], [0, 235, 0]] },
  { id: 'kettle', name: 'Kettle', category: 'household', difficulty: 'easy', clue: 'boils water', targets: [[0, 40, 0], [0, 150, 0], [-10, 260, 0]] },
  { id: 'headphones', name: 'Headphones', category: 'household', difficulty: 'easy', clue: 'listen', targets: [[0, 30, 0], [0, 140, 0], [0, 250, 0]] },
  { id: 'turtle', name: 'Turtle', category: 'nature', difficulty: 'easy', clue: 'slow, shelled', targets: [[0, 45, 0], [0, 155, 0], [5, 265, 0]] },
  { id: 'watering-can', name: 'Watering Can', category: 'household', difficulty: 'medium', clue: 'waters plants', targets: [[0, 35, 0], [0, 145, 0], [-12, 255, 0]] },
  { id: 'camera', name: 'Camera', category: 'tools', difficulty: 'medium', clue: 'takes photos', targets: [[0, 50, 0], [0, 160, 0], [0, 270, 0]] },
  { id: 'sailboat', name: 'Sailboat', category: 'transport', difficulty: 'medium', clue: 'catches wind', targets: [[0, 20, 0], [0, 125, 0], [8, 230, 0]] },
  { id: 'robot', name: 'Robot', category: 'whimsy', difficulty: 'medium', clue: 'beeps', targets: [[0, 40, 0], [0, 150, 0], [0, 260, 0]] },
  { id: 'castle', name: 'Castle', category: 'whimsy', difficulty: 'medium', clue: 'has towers', targets: [[0, 30, 0], [0, 135, 0], [-5, 240, 0]] },
  { id: 'hammer', name: 'Hammer', category: 'tools', difficulty: 'medium', clue: 'hits nails', targets: [[0, 55, 0], [0, 165, 0], [15, 275, 0]] },
  { id: 'dragonfly', name: 'Dragonfly', category: 'nature', difficulty: 'hard', clue: 'four wings', targets: [[0, 35, 0], [0, 140, 0], [10, 250, 0]] },
  { id: 'crane', name: 'Crane', category: 'transport', difficulty: 'hard', clue: 'lifts loads', targets: [[0, 25, 0], [0, 130, 0], [0, 235, 0]] },
  { id: 'rocket', name: 'Rocket', category: 'whimsy', difficulty: 'hard', clue: 'launches', targets: [[0, 45, 0], [0, 150, 0], [-8, 255, 0]] },
  { id: 'violin', name: 'Violin', category: 'tools', difficulty: 'hard', clue: 'four strings', targets: [[0, 30, 0], [0, 135, 0], [12, 240, 0]] },
];

export function dailyPuzzle(dateKey: string): DailyPuzzle {
  // Dates before the first Shadowline day resolve to day #1 (2026-11-28),
  // so no puzzle is ever numbered 0 or negative.
  const key = dateKey < '2026-11-28' ? '2026-11-28' : dateKey;
  const rand = mulberry32(hashDate(key));
  const difficulty = difficultyFor(key);
  const pool = OBJECTS.filter((o) => o.difficulty === difficulty);
  const object = pool[Math.floor(rand() * pool.length)];
  if (!object) throw new Error(`No object in bank for difficulty ${difficulty}`);
  const target = object.targets[Math.floor(rand() * object.targets.length)];
  if (!target) throw new Error(`No target rotation for object ${object.id}`);
  // Puzzle number: days since the first Shadowline day (2026-11-28 UTC).
  const epoch = Date.UTC(2026, 10, 28);
  const parts = key.split('-').map((v, i) => (i === 1 ? Number(v) - 1 : Number(v)));
  const day = Date.UTC(parts[0] ?? 2026, parts[1] ?? 0, parts[2] ?? 1);
  const number = Math.floor((day - epoch) / 86400000) + 1;
  return {
    dateKey: key,
    number,
    difficulty,
    objectId: object.id,
    objectName: object.name,
    clue: object.clue,
    targetEulerDeg: target,
  };
}

// --- Rotation scoring -----------------------------------------------------
// Quaternions as [x, y, z, w]. Angle between two orientations in degrees.
export function quatAngleDeg(a: Quat, b: Quat): number {
  const dot = Math.abs(a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]);
  const clamped = Math.min(1, dot);
  return (2 * Math.acos(clamped) * 180) / Math.PI;
}

export function eulerDegToQuat([ex, ey, ez]: EulerDeg): Quat {
  // XYZ intrinsic order, degrees -> quaternion [x,y,z,w].
  const hx = (ex * Math.PI) / 180 / 2;
  const hy = (ey * Math.PI) / 180 / 2;
  const hz = (ez * Math.PI) / 180 / 2;
  const cx = Math.cos(hx);
  const sx = Math.sin(hx);
  const cy = Math.cos(hy);
  const sy = Math.sin(hy);
  const cz = Math.cos(hz);
  const sz = Math.sin(hz);
  return [
    sx * cy * cz + cx * sy * sz,
    cx * sy * cz - sx * cy * sz,
    cx * cy * sz + sx * sy * cz,
    cx * cy * cz - sx * sy * sz,
  ];
}

// Accuracy: 100 at a perfect match, −1.5 points per degree of angular
// error, floored at 0. Playable with drag + ±5° fine-tune buttons:
// 3★ needs ≤2° error, 2★ ≤6.7°, 1★ ≤16.7°.
export function accuracyFromAngle(angleDeg: number): number {
  return Math.max(0, Math.min(100, 100 - 1.5 * angleDeg));
}

export function starsFromAccuracy(acc: number): number {
  if (acc >= 97) return 3;
  if (acc >= 90) return 2;
  if (acc >= 75) return 1;
  return 0;
}

export function scoreSubmission(dateKey: string, submittedQuat: Quat): ScoreResult {
  const puzzle = dailyPuzzle(dateKey);
  const targetQuat = eulerDegToQuat(puzzle.targetEulerDeg);
  const angle = quatAngleDeg(submittedQuat, targetQuat);
  const accuracy = accuracyFromAngle(angle);
  return { ...puzzle, angleDeg: round1(angle), accuracy: round1(accuracy), stars: starsFromAccuracy(accuracy) };
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

// --- Streaks --------------------------------------------------------------
// playedKeys: UTC date keys the user has completed (any stars incl. 0).
// Streak counts consecutive days ending today, or ending yesterday if
// today hasn't been played yet (standard daily-game rule).
export function currentStreak(playedKeys: string[], todayKey = utcDateKey()): number {
  const set = new Set(playedKeys);
  let cursor = set.has(todayKey) ? todayKey : prevDay(todayKey);
  let n = 0;
  while (set.has(cursor)) {
    n++;
    cursor = prevDay(cursor);
  }
  return n;
}

export function prevDay(dateKey: string): string {
  const d = new Date(dateKey + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

// Share card: spoiler-free — stars + accuracy only, never the object name.
export function shareText(result: { number: number; stars: number; accuracy: number }): string {
  const stars = '⭐'.repeat(result.stars) + '☆'.repeat(3 - result.stars);
  return `Shadowline #${result.number} — ${stars} ${result.accuracy}% — 🔥 streak in comments`;
}
