// Creates the daily Shadowline post for a UTC date.
// Idempotent per day: the post id is stored under sl:post:{dateKey}, so a
// second call (menu re-click, scheduler re-fire, reinstall) navigates to
// the existing post instead of spamming the subreddit with duplicates.

import { context, redis, reddit } from '@devvit/web/server';
import { dailyPuzzle, utcDateKey } from '../../shared/daily';

export const createPost = async (dateKey: string = utcDateKey()) => {
  const guardKey = `sl:post:${dateKey}`;
  const existing = await redis.get(guardKey);
  if (existing) {
    return { id: existing, created: false };
  }
  const puzzle = dailyPuzzle(dateKey);
  const post = await reddit.submitCustomPost({
    subredditName: context.subredditName,
    title: `Shadowline #${puzzle.number} — today's silhouette`,
    entry: 'default',
    postData: { dateKey },
  });
  await redis.set(guardKey, post.id);
  return { id: post.id, created: true };
};
