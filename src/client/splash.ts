// Shadowline splash — inline feed card. Fast by design: no three.js here,
// just a static SVG silhouette teaser + one fetch to /api/today.
import { requestExpandedMode } from '@devvit/web/client';
import type { TodayResponse } from '../shared/api';
import { silhouetteFor } from '../shared/silhouettes';

const puzzleLabel = document.getElementById('puzzle-label') as HTMLSpanElement;
const difficultyLabel = document.getElementById('difficulty-label') as HTMLSpanElement;
const streakLabel = document.getElementById('streak-label') as HTMLSpanElement;
const solveLabel = document.getElementById('solve-label') as HTMLSpanElement;
const teaserSvg = document.getElementById('teaser-svg') as unknown as SVGSVGElement;
const playButton = document.getElementById('play-button') as HTMLButtonElement;

playButton.addEventListener('click', (e) => {
  requestExpandedMode(e, 'game');
});

async function init(): Promise<void> {
  try {
    const response = await fetch('/api/today');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as TodayResponse;
    const date = new Date(`${data.dateKey}T00:00:00Z`);
    const dateText = date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
    puzzleLabel.textContent = `#${data.number} · ${dateText}`;
    difficultyLabel.textContent = data.difficulty.toUpperCase();
    streakLabel.textContent = data.streak > 0 ? `🔥 ${data.streak}-day streak` : '🔥 Start a streak';
    solveLabel.textContent =
      data.solveCount === 1 ? '1 player today' : `${data.solveCount} players today`;
    teaserSvg.innerHTML = silhouetteFor(data.objectId);
    if (data.played) {
      playButton.textContent = `✓ Played — ${'⭐'.repeat(data.played.stars)}${'☆'.repeat(3 - data.played.stars)} · Play again`;
    }
  } catch (err) {
    console.error('Shadowline splash failed to load today:', err);
    puzzleLabel.textContent = 'Shadowline — daily silhouette';
    streakLabel.textContent = '';
    solveLabel.textContent = '';
    teaserSvg.innerHTML = silhouetteFor('mug');
  }
}

void init();
