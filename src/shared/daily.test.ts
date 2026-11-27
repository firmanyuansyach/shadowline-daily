// Shadowline core tests — ported 1:1 from core/daily.test.mjs.
// Run: npm run test:unit
// The .mjs file is the reference implementation; the cross-check in
// /tmp (run during verification) compares this port's outputs against the
// .mjs for every day 2026-11-28..2027-01-15.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  dailyPuzzle,
  difficultyFor,
  eulerDegToQuat,
  quatAngleDeg,
  accuracyFromAngle,
  starsFromAccuracy,
  scoreSubmission,
  currentStreak,
  shareText,
  OBJECTS,
  utcDateKey,
} from './daily.ts';

function dayKey(offset: number): string {
  return new Date(Date.UTC(2026, 10, 28) + offset * 86400000).toISOString().slice(0, 10);
}

test('daily puzzle deterministic over 200 days', () => {
  for (let i = 0; i < 200; i++) {
    const d = dayKey(i);
    const a = dailyPuzzle(d);
    const b = dailyPuzzle(d);
    assert.deepEqual(a, b);
    assert.equal(a.number, i + 1);
  }
});

test('dates before 2026-11-28 resolve to puzzle #1', () => {
  const early = dailyPuzzle('2026-11-27');
  const first = dailyPuzzle('2026-11-28');
  assert.equal(early.number, 1);
  assert.equal(early.dateKey, '2026-11-28');
  assert.deepEqual(early, first);
});

test('weekday difficulty ramp', () => {
  assert.equal(difficultyFor('2026-11-30'), 'easy'); // Monday
  assert.equal(difficultyFor('2026-12-01'), 'easy'); // Tuesday
  assert.equal(difficultyFor('2026-12-02'), 'medium'); // Wednesday
  assert.equal(difficultyFor('2026-12-03'), 'medium'); // Thursday
  assert.equal(difficultyFor('2026-12-04'), 'hard'); // Friday
  assert.equal(difficultyFor('2026-12-05'), 'hard'); // Saturday
  assert.equal(difficultyFor('2026-12-06'), 'hard'); // Sunday
});

test('puzzle object matches difficulty pool', () => {
  for (let i = 0; i < 200; i++) {
    const d = dayKey(i);
    const p = dailyPuzzle(d);
    const obj = OBJECTS.find((o) => o.id === p.objectId);
    if (!obj) throw new Error(`Object ${p.objectId} missing from bank`);
    assert.equal(obj.difficulty, p.difficulty);
    assert.equal(obj.targets.includes(p.targetEulerDeg), true);
  }
});

test('quaternion angle', () => {
  const q = eulerDegToQuat([0, 35, 0]);
  assert.ok(Math.abs(quatAngleDeg(q, q)) < 1e-9);
  const flip = eulerDegToQuat([0, 215, 0]);
  assert.ok(Math.abs(quatAngleDeg(q, flip) - 180) < 1e-6);
});

test('accuracy + stars boundaries', () => {
  assert.equal(accuracyFromAngle(0), 100);
  assert.equal(accuracyFromAngle(2), 97);
  assert.equal(starsFromAccuracy(97), 3);
  assert.equal(starsFromAccuracy(96.9), 2);
  assert.equal(starsFromAccuracy(90), 2);
  assert.equal(starsFromAccuracy(75), 1);
  assert.equal(starsFromAccuracy(74.9), 0);
  assert.equal(accuracyFromAngle(100), 0);
});

test('scoreSubmission end-to-end', () => {
  const key = '2026-12-07';
  const p = dailyPuzzle(key);
  const perfect = scoreSubmission(key, eulerDegToQuat(p.targetEulerDeg));
  assert.equal(perfect.accuracy, 100);
  assert.equal(perfect.stars, 3);
  // 10 degrees off in yaw:
  const off = eulerDegToQuat([p.targetEulerDeg[0], p.targetEulerDeg[1] + 10, p.targetEulerDeg[2]]);
  const s = scoreSubmission(key, off);
  assert.ok(Math.abs(s.angleDeg - 10) < 0.6, `angle ${s.angleDeg}`);
  assert.equal(s.stars, 1);
});

test('streak logic', () => {
  assert.equal(currentStreak(['2026-12-05', '2026-12-06', '2026-12-07'], '2026-12-07'), 3);
  assert.equal(currentStreak(['2026-12-05', '2026-12-07'], '2026-12-07'), 1);
  assert.equal(currentStreak(['2026-12-05', '2026-12-06'], '2026-12-07'), 2);
  assert.equal(currentStreak([], '2026-12-07'), 0);
});

test('share card is spoiler-free', () => {
  const p = dailyPuzzle('2026-12-07');
  const r = scoreSubmission('2026-12-07', eulerDegToQuat(p.targetEulerDeg));
  const text = shareText(r);
  assert.ok(!text.includes(p.objectName), text);
  assert.ok(text.includes('#' + p.number), text);
});

test('utc today is a valid date key', () => {
  assert.match(utcDateKey(), /^\d{4}-\d{2}-\d{2}$/);
});

test('object bank: 30 objects, 3 targets each, yaw-spaced, pools non-empty', () => {
  assert.equal(OBJECTS.length, 30);
  const ids = new Set(OBJECTS.map((o) => o.id));
  assert.equal(ids.size, OBJECTS.length);
  for (const obj of OBJECTS) {
    assert.equal(obj.targets.length, 3, `${obj.id} must have exactly 3 targets`);
    const yaws = obj.targets.map((t) => ((t[1] % 360) + 360) % 360).sort((a, b) => a - b);
    for (let i = 0; i < yaws.length; i++) {
      const a = yaws[i] ?? 0;
      const b = yaws[(i + 1) % yaws.length] ?? 0;
      const gap = (b - a + 360) % 360;
      assert.ok(gap >= 30, `${obj.id} targets must be >=30° apart in yaw (gap ${gap}°)`);
    }
  }
  for (const d of ['easy', 'medium', 'hard'] as const) {
    assert.ok(OBJECTS.some((o) => o.difficulty === d), `pool ${d} must be non-empty`);
  }
});
