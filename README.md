# Shadowline — Daily Silhouette

Rotate a 3D object until its shadow matches the day's target silhouette.
Same object for every player, every UTC day. 60–90 seconds a day.

**App:** https://developers.reddit.com/apps/shadowline-daily
**Hackathon:** Reddit's Game of the Day Hackathon 2026 (Devpost)

## How to play

1. Open the daily post. The splash card shows today's silhouette teaser,
   the puzzle number, and your streak.
2. Tap **Play today**. Drag the object to rotate it — the live shadow on
   the turntable floor is what you're matching against the **Target Shadow**
   panel. Fine-tune with the ±5° buttons.
3. Tap **Lock it in** when the shadow matches. You get stars for accuracy
   (3★ at 97%+, 2★ at 90%+, 1★ at 75%+), your streak grows, and your rank
   for the day is shown on the single result card.
4. **Share to comments** posts a spoiler-free result card
   (`Shadowline #N — ⭐⭐⭐ 94%`) — it never reveals what the object was.
5. **Practice yesterday's puzzle** replays the previous day with no effect
   on your streak or score.

One puzzle per UTC day, same for everyone. Difficulty ramps through the
week: Mon–Tue easy, Wed–Thu medium, Fri–Sun hard. A new post goes up
every day at 00:05 UTC.

## How it works

- **Client** (`src/client/`): three.js scene — one warm directional key
  light with a 1024px shadow map, ink-navy studio, flat-shaded low-poly
  objects built from primitives (`objects.ts`, all 16 bank objects).
  No external models or assets. The splash card is a fast static SVG
  teaser with no 3D dependency.
- **Shared logic** (`src/shared/daily.ts`): deterministic date-seeded
  puzzles (FNV-1a + mulberry32), weekday difficulty ramp, quaternion
  scoring (accuracy = 100 − 1.5 × angle in degrees), streaks, spoiler-free
  share text. The client never scores itself.
- **Server** (`src/server/`): Hono + `@devvit/web/server`. `GET /api/today`
  (puzzle without the object name), `POST /api/submit` (server-side
  scoring, idempotent once per user per day), `GET /api/leaderboard`,
  `GET /api/streak`, `POST /api/share` (posts the result card as the
  player). Results, streaks and leaderboards live in Redis; the daily
  post is created by a 00:05 UTC scheduler task with a per-day Redis
  guard key so it can never double-post.

## Permissions (devvit.json) — why each is needed

- `redis: true` — daily results, streaks, leaderboards, solve counts,
  and the daily-post guard key. The game cannot persist anything without it.
- `reddit: { enable: true, scope: "user" }` — creating the daily custom
  post, posting the share card as the player (`runAs: 'USER'`), and
  setting the solve flair. No other Reddit API is used.

## Commands

- `npm run build` — build client + server with Vite
- `npm run test:types` — TypeScript check
- `npm run test:unit` — unit tests (daily logic, determinism, scoring)
- `npm run lint` — ESLint
- `npm run dev` — playtest on Reddit (uploads a private version)
- `npm run deploy` — type-check + lint + `devvit upload` (private, NOT published)
- `npm run launch` — deploy + `devvit publish` (App Review — do NOT run
  for the hackathon; the app stays unpublished by design)

## License

BSD-3-Clause (see LICENSE). All 3D objects are original geometry built
from three.js primitives; no third-party models, images, or audio.
