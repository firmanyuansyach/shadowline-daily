// Scheduler tasks — wired in devvit.json under "scheduler".
// daily-post runs on cron "5 0 * * *" (00:05 UTC) and posts that day's
// Shadowline game. createPost() is idempotent per day (Redis guard key
// sl:post:YYYY-MM-DD), so a re-fire never creates a duplicate post.

import { Hono } from 'hono';
import { createPost } from '../core/post';

export const scheduler = new Hono();

scheduler.post('/daily-post', async (c) => {
  try {
    const post = await createPost();
    console.log(`Shadowline daily post: ${post.id} (created=${post.created})`);
    return c.json({});
  } catch (error) {
    console.error('Shadowline daily post failed:', error);
    return c.json({ error: 'Failed to create daily post' }, 500);
  }
});
