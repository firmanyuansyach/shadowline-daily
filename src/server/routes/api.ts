// Shadowline API — Hono routes under /api.
// Trust rule: the client NEVER scores itself. /api/today sends the puzzle
// (objectId + target rotation) but never the object NAME; /api/submit
// recomputes accuracy from the day's seed with shared/daily.ts and stores
// the result in Redis. Flair failures are non-fatal by design.

import { Hono } from 'hono';
import { context, redis, reddit } from '@devvit/web/server';
import {
  currentStreak,
  dailyPuzzle,
  prevDay,
  scoreSubmission,
  shareText,
  utcDateKey,
} from '../../shared/daily';
import type { Quat } from '../../shared/daily';
import type {
  ErrorResponse,
  LeaderboardResponse,
  ShareRequest,
  ShareResponse,
  StreakResponse,
  SubmitRequest,
  SubmitResponse,
  TodayResponse,
} from '../../shared/api';

export const api = new Hono();

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function resultKey(dateKey: string): string {
  return `sl:result:${dateKey}`;
}
function leaderboardKey(dateKey: string): string {
  return `sl:lb:${dateKey}`;
}
function countKey(dateKey: string): string {
  return `sl:count:${dateKey}`;
}
function playedKey(userKey: string): string {
  return `sl:played:${userKey}`;
}

type StoredResult = {
  username: string;
  accuracy: number;
  stars: number;
  seconds: number;
};

async function getUser(): Promise<{ userKey: string; username: string }> {
  const username = context.username ?? (await reddit.getCurrentUsername()) ?? 'anonymous';
  const userKey = context.userId ?? context.loid ?? `anon:${username}`;
  return { userKey, username };
}

async function getRank(dateKey: string, userKey: string): Promise<number> {
  const rows = await redis.zRange(leaderboardKey(dateKey), 0, -1, {
    reverse: true,
    by: 'rank',
  });
  const idx = rows.findIndex((r) => r.member === userKey);
  return idx === -1 ? 0 : idx + 1;
}

async function getStreak(userKey: string, todayKey: string): Promise<{ streak: number; playedDates: string[] }> {
  const played = await redis.hGetAll(playedKey(userKey));
  const playedDates = Object.keys(played).sort();
  return { streak: currentStreak(playedDates, todayKey), playedDates };
}

async function getStoredResult(dateKey: string, userKey: string): Promise<StoredResult | null> {
  const raw = await redis.hGet(resultKey(dateKey), userKey);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof (parsed as Record<string, unknown>)['accuracy'] === 'number'
    ) {
      return parsed as StoredResult;
    }
    return null;
  } catch {
    return null;
  }
}

function badRequest(message: string) {
  return { status: 'error', message } as ErrorResponse;
}

// Resolve which puzzle date a request is about. `dateKey` comes from the
// post's postData (daily posts) or the client (today). Never the future:
// a future date is clamped to today so nobody plays ahead.
function resolvePuzzleDate(mode: 'today' | 'practice', requested: string | undefined): string {
  const today = utcDateKey();
  const base = requested && DATE_RE.test(requested) && requested <= today ? requested : today;
  return mode === 'practice' ? prevDay(base) : base;
}

api.get('/today', async (c) => {
  try {
    const mode = c.req.query('mode') === 'practice' ? 'practice' : 'today';
    const dateKey = resolvePuzzleDate(mode, c.req.query('dateKey'));
    const puzzle = dailyPuzzle(dateKey);
    const { userKey } = await getUser();
    const [countRaw, stored, streakInfo] = await Promise.all([
      redis.get(countKey(dateKey)),
      getStoredResult(dateKey, userKey),
      getStreak(userKey, utcDateKey()),
    ]);
    const solveCount = countRaw ? parseInt(countRaw, 10) : 0;
    let played: TodayResponse['played'] = null;
    if (stored) {
      played = {
        accuracy: stored.accuracy,
        stars: stored.stars,
        rank: await getRank(dateKey, userKey),
      };
    }
    // NOTE: objectName is deliberately NOT sent — the answer stays server-side.
    return c.json<TodayResponse>({
      type: 'today',
      dateKey: puzzle.dateKey,
      number: puzzle.number,
      difficulty: puzzle.difficulty,
      objectId: puzzle.objectId,
      targetEulerDeg: puzzle.targetEulerDeg,
      clue: puzzle.clue,
      mode,
      solveCount,
      streak: streakInfo.streak,
      played,
    });
  } catch (error) {
    console.error('Shadowline /today failed:', error);
    return c.json<ErrorResponse>(badRequest('Could not load today\'s puzzle'), 500);
  }
});

api.post('/submit', async (c) => {
  try {
    const body = (await c.req.json()) as SubmitRequest;
    const mode = body.mode === 'practice' ? 'practice' : 'today';
    if (!body.dateKey || !DATE_RE.test(body.dateKey)) {
      return c.json<ErrorResponse>(badRequest('Invalid dateKey'), 400);
    }
    if (!Array.isArray(body.quat) || body.quat.length !== 4 || body.quat.some((n) => !Number.isFinite(n))) {
      return c.json<ErrorResponse>(badRequest('Invalid rotation'), 400);
    }
    const dateKey = resolvePuzzleDate(mode, body.dateKey);
    const quat: Quat = [body.quat[0] ?? 0, body.quat[1] ?? 0, body.quat[2] ?? 0, body.quat[3] ?? 1];
    const len = Math.hypot(quat[0], quat[1], quat[2], quat[3]);
    if (len === 0) return c.json<ErrorResponse>(badRequest('Invalid rotation'), 400);
    const norm: Quat = [quat[0] / len, quat[1] / len, quat[2] / len, quat[3] / len];

    const { userKey, username } = await getUser();
    const todayKey = utcDateKey();

    // Practice never stores anything and never touches streaks.
    if (mode === 'practice') {
      const scored = scoreSubmission(dateKey, norm);
      const streakInfo = await getStreak(userKey, todayKey);
      const countRaw = await redis.get(countKey(dateKey));
      return c.json<SubmitResponse>({
        type: 'submit',
        dateKey,
        number: scored.number,
        objectName: scored.objectName,
        accuracy: scored.accuracy,
        stars: scored.stars,
        angleDeg: scored.angleDeg,
        streak: streakInfo.streak,
        rank: 0,
        totalPlayers: countRaw ? parseInt(countRaw, 10) : 0,
        alreadySubmitted: false,
        shareText: shareText(scored),
      });
    }

    // Idempotent: a day can only be submitted once per user.
    const existing = await getStoredResult(dateKey, userKey);
    if (existing) {
      const puzzle = dailyPuzzle(dateKey);
      const [rank, streakInfo, countRaw] = await Promise.all([
        getRank(dateKey, userKey),
        getStreak(userKey, todayKey),
        redis.get(countKey(dateKey)),
      ]);
      return c.json<SubmitResponse>({
        type: 'submit',
        dateKey,
        number: puzzle.number,
        objectName: puzzle.objectName,
        accuracy: existing.accuracy,
        stars: existing.stars,
        angleDeg: 0,
        streak: streakInfo.streak,
        rank,
        totalPlayers: countRaw ? parseInt(countRaw, 10) : 0,
        alreadySubmitted: true,
        shareText: shareText({ number: puzzle.number, stars: existing.stars, accuracy: existing.accuracy }),
      });
    }

    // Server-side scoring from the seed — never trust client accuracy.
    const scored = scoreSubmission(dateKey, norm);
    const stored: StoredResult = {
      username,
      accuracy: scored.accuracy,
      stars: scored.stars,
      seconds: Number.isFinite(body.seconds) ? Math.max(0, Math.round(body.seconds)) : 0,
    };
    await Promise.all([
      redis.hSet(resultKey(dateKey), { [userKey]: JSON.stringify(stored) }),
      redis.zAdd(leaderboardKey(dateKey), { member: userKey, score: scored.accuracy }),
      redis.incrBy(countKey(dateKey), 1),
      redis.hSet(playedKey(userKey), { [dateKey]: String(scored.accuracy) }),
    ]);
    const [rank, streakInfo, countRaw] = await Promise.all([
      getRank(dateKey, userKey),
      getStreak(userKey, todayKey),
      redis.get(countKey(dateKey)),
    ]);

    // Flair is best-effort: it must never fail a submit (e.g. if the app
    // is not a moderator of the subreddit, Reddit rejects the call).
    try {
      const flairText = `Shadowline ${'⭐'.repeat(scored.stars)}${'☆'.repeat(3 - scored.stars)} · 🔥${streakInfo.streak}`;
      await reddit.setUserFlair({
        subredditName: context.subredditName,
        username,
        text: flairText,
      });
    } catch (flairError) {
      console.error('Shadowline flair set failed (non-fatal):', flairError);
    }

    return c.json<SubmitResponse>({
      type: 'submit',
      dateKey,
      number: scored.number,
      objectName: scored.objectName,
      accuracy: scored.accuracy,
      stars: scored.stars,
      angleDeg: scored.angleDeg,
      streak: streakInfo.streak,
      rank,
      totalPlayers: countRaw ? parseInt(countRaw, 10) : 0,
      alreadySubmitted: false,
      shareText: shareText(scored),
    });
  } catch (error) {
    console.error('Shadowline /submit failed:', error);
    return c.json<ErrorResponse>(badRequest('Submit failed'), 500);
  }
});

api.get('/leaderboard', async (c) => {
  try {
    const today = utcDateKey();
    const requested = c.req.query('dateKey');
    const dateKey = requested && DATE_RE.test(requested) && requested <= today ? requested : today;
    const rows = await redis.zRange(leaderboardKey(dateKey), 0, 9, {
      reverse: true,
      by: 'rank',
    });
    const entries: LeaderboardResponse['entries'] = [];
    for (const row of rows) {
      const stored = await getStoredResult(dateKey, row.member);
      entries.push({
        username: stored?.username ?? 'anonymous',
        accuracy: row.score,
        stars: stored?.stars ?? 0,
        seconds: stored?.seconds ?? 0,
      });
    }
    const countRaw = await redis.get(countKey(dateKey));
    return c.json<LeaderboardResponse>({
      type: 'leaderboard',
      dateKey,
      entries,
      totalPlayers: countRaw ? parseInt(countRaw, 10) : 0,
    });
  } catch (error) {
    console.error('Shadowline /leaderboard failed:', error);
    return c.json<ErrorResponse>(badRequest('Could not load the leaderboard'), 500);
  }
});

api.get('/streak', async (c) => {
  try {
    const { userKey } = await getUser();
    const streakInfo = await getStreak(userKey, utcDateKey());
    return c.json<StreakResponse>({
      type: 'streak',
      streak: streakInfo.streak,
      playedDates: streakInfo.playedDates,
    });
  } catch (error) {
    console.error('Shadowline /streak failed:', error);
    return c.json<ErrorResponse>(badRequest('Could not load streak'), 500);
  }
});

api.post('/share', async (c) => {
  try {
    const body = (await c.req.json()) as ShareRequest;
    const postId = context.postId;
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    // Only genuine Shadowline result cards may be posted — no free-form
    // comment spam through this endpoint.
    if (!postId || !text.startsWith('Shadowline #') || text.length > 300) {
      return c.json<ShareResponse>({ type: 'share', ok: false, fallbackToClipboard: true });
    }
    try {
      await reddit.submitComment({ id: postId, text, runAs: 'USER' });
      return c.json<ShareResponse>({ type: 'share', ok: true, fallbackToClipboard: false });
    } catch (commentError) {
      console.error('Shadowline share as USER failed, falling back to clipboard:', commentError);
      return c.json<ShareResponse>({ type: 'share', ok: true, fallbackToClipboard: true });
    }
  } catch (error) {
    console.error('Shadowline /share failed:', error);
    return c.json<ShareResponse>({ type: 'share', ok: false, fallbackToClipboard: true });
  }
});
