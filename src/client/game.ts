// Shadowline game — expanded view.
// Three.js scene: warm amber key light with shadows + cool rim + warm
// fill, ink-navy studio, cream target-silhouette panel. Drag to rotate (trackball: full
// 3-DOF via quaternion premultiplication), fine-tune ±5°, lock in to submit.
// Scoring is computed ONLY on the server; the client shows a match meter
// (no exact angle) as a live hint.

import * as THREE from 'three';
import { context, showToast } from '@devvit/web/client';
import { buildObject } from './objects';
import {
  accuracyFromAngle,
  eulerDegToQuat,
  prevDay,
  quatAngleDeg,
  utcDateKey,
} from '../shared/daily';
import type { Quat } from '../shared/daily';
import type {
  ShareResponse,
  SubmitResponse,
  TodayResponse,
} from '../shared/api';

const INK_NAVY = 0x0e1420;
const STUDIO_NAVY = 0x131c2c;
const CREAM = 0xf5e9c8;
const AMBER = 0xffb347;
const LIGHT_DIR = new THREE.Vector3(0.45, 0.75, 0.35).normalize();

// --- DOM helpers (no type casts: runtime instanceof checks) ---------------
function canvasEl(id: string): HTMLCanvasElement {
  const n = document.getElementById(id);
  if (!(n instanceof HTMLCanvasElement)) throw new Error(`Missing canvas #${id}`);
  return n;
}
function buttonEl(id: string): HTMLButtonElement {
  const n = document.getElementById(id);
  if (!(n instanceof HTMLButtonElement)) throw new Error(`Missing button #${id}`);
  return n;
}
function spanEl(id: string): HTMLSpanElement {
  const n = document.getElementById(id);
  if (!(n instanceof HTMLSpanElement)) throw new Error(`Missing span #${id}`);
  return n;
}
function divEl(id: string): HTMLDivElement {
  const n = document.getElementById(id);
  if (!(n instanceof HTMLDivElement)) throw new Error(`Missing div #${id}`);
  return n;
}
function paraEl(id: string): HTMLParagraphElement {
  const n = document.getElementById(id);
  if (!(n instanceof HTMLParagraphElement)) throw new Error(`Missing p #${id}`);
  return n;
}

const sceneCanvas = canvasEl('scene-canvas');
const targetCanvas = canvasEl('target-canvas');
const puzzleLabel = spanEl('puzzle-label');
const difficultyChip = spanEl('difficulty-chip');
const streakChip = spanEl('streak-chip');
const practiceBadge = spanEl('practice-badge');
const timerEl = spanEl('timer');
const clueEl = paraEl('clue');
const meterLabel = spanEl('meter-label');
const meterFill = divEl('meter-fill');
const lockButton = buttonEl('lock-button');
const practiceButton = buttonEl('practice-button');
const resultPanel = divEl('result');
const fallbackPanel = divEl('fallback');
const resultLabel = spanEl('result-label');
const resultStars = divEl('result-stars');
const resultAccuracy = paraEl('result-accuracy');
const resultObject = paraEl('result-object');
const resultStats = paraEl('result-stats');
const resultCountdown = paraEl('result-countdown');
const shareButton = buttonEl('share-button');
const resultPracticeButton = buttonEl('result-practice-button');
const resultClose = buttonEl('result-close');

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function isTodayResponse(v: unknown): v is TodayResponse {
  if (!isRecord(v)) return false;
  return (
    v['type'] === 'today' &&
    typeof v['dateKey'] === 'string' &&
    typeof v['number'] === 'number' &&
    typeof v['objectId'] === 'string' &&
    Array.isArray(v['targetEulerDeg']) &&
    typeof v['solveCount'] === 'number' &&
    typeof v['streak'] === 'number'
  );
}

function isSubmitResponse(v: unknown): v is SubmitResponse {
  if (!isRecord(v)) return false;
  return (
    v['type'] === 'submit' &&
    typeof v['accuracy'] === 'number' &&
    typeof v['stars'] === 'number' &&
    typeof v['objectName'] === 'string' &&
    typeof v['shareText'] === 'string'
  );
}

function isShareResponse(v: unknown): v is ShareResponse {
  return isRecord(v) && v['type'] === 'share' && typeof v['ok'] === 'boolean';
}

// The post this game was opened from may carry its puzzle date in postData
// (daily posts are created with postData {dateKey}). Otherwise: today (UTC).
function postDateKey(): string | undefined {
  // Outside the Reddit webview (local preview, plain browser) the Devvit
  // client context is undefined — accessing it must never kill the game.
  // Inside Reddit this returns the daily post's postData {dateKey}.
  try {
    const pd = context.postData;
    if (!isRecord(pd)) return undefined;
    const v = pd['dateKey'];
    return typeof v === 'string' ? v : undefined;
  } catch {
    return undefined;
  }
}

function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') ?? c.getContext('webgl'));
  } catch {
    return false;
  }
}

function threeQuat(q: Quat): THREE.Quaternion {
  return new THREE.Quaternion(q[0], q[1], q[2], q[3]);
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function meterWord(acc: number): string {
  if (acc >= 90) return 'Nearly there…';
  if (acc >= 75) return 'Getting warm…';
  if (acc >= 50) return 'Halfway there…';
  return 'Keep turning…';
}

// --- Game state ------------------------------------------------------------
type Mode = 'today' | 'practice';

let mode: Mode = 'today';
let puzzle: TodayResponse | null = null;
let targetQuat: Quat = [0, 0, 0, 1];
const orientation = new THREE.Quaternion();
let startOrientation = new THREE.Quaternion();
let hasInteracted = false;
let startTimeMs = 0;
let lastSubmit: SubmitResponse | null = null;
let countdownTimer: ReturnType<typeof setInterval> | undefined;

const reducedMotion =
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// --- Three.js scene --------------------------------------------------------
let renderer: THREE.WebGLRenderer | null = null;
let targetRenderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let targetScene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let targetCamera: THREE.OrthographicCamera | null = null;
let objectGroup: THREE.Group | null = null;
let targetGroup: THREE.Group | null = null;

function buildScenes(p: TodayResponse): void {
  // Main scene.
  scene = new THREE.Scene();
  scene.background = new THREE.Color(INK_NAVY);
  camera = new THREE.PerspectiveCamera(42, 1, 0.1, 50);
  camera.position.set(0, 1.0, 6.2);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas: sceneCanvas,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio ?? 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Brighter base so cream objects never read muddy against the navy.
  const hemi = new THREE.HemisphereLight(0x8fa0b5, 0x0e1420, 1.0);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(AMBER, 3.4);
  key.position.copy(LIGHT_DIR).multiplyScalar(6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -3;
  key.shadow.camera.right = 3;
  key.shadow.camera.top = 3;
  key.shadow.camera.bottom = -3;
  key.shadow.camera.far = 20;
  scene.add(key);

  // Cool rim light from behind-left: lifts the object's far edge off the
  // navy without touching the background (light only, low intensity).
  const rim = new THREE.DirectionalLight(0x9fb4d8, 1.0);
  rim.position.set(-4, 2.5, -5);
  scene.add(rim);

  // Soft warm fill from the camera side so front faces read cream, not
  // charcoal, while the key light still owns the shadow.
  const fill = new THREE.DirectionalLight(0xffd9a0, 0.7);
  fill.position.set(0, 1, 6);
  scene.add(fill);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(3, 32),
    new THREE.ShadowMaterial({ opacity: 0.5 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.15;
  floor.receiveShadow = true;
  scene.add(floor);

  // Thin amber ring instead of the old solid disc: the disc rendered as a
  // muddy brown ellipse under the warm key light; the ring frames the
  // turntable and leaves the cast shadow clean on the dark floor.
  // Kept tight (just outside the ~2.2-unit object) — a wide ring reads as
  // two stray lines across the panel from this shallow camera angle.
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.08, 1.15, 48),
    new THREE.MeshBasicMaterial({ color: AMBER, transparent: true, opacity: 0.9 })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -1.14;
  scene.add(ring);

  objectGroup = buildObject(p.objectId);
  scene.add(objectGroup);

  // Target-silhouette panel: the same object, seen from the light's
  // direction (i.e. what the shadow should look like), flat cream.
  targetScene = new THREE.Scene();
  targetScene.background = new THREE.Color(STUDIO_NAVY);
  // Tight frustum: objects normalise to ~2.2 units, so ±1.15 fills the
  // panel instead of floating a small silhouette in empty navy.
  targetCamera = new THREE.OrthographicCamera(-1.15, 1.15, 1.15, -1.15, 0.1, 20);
  targetCamera.position.copy(LIGHT_DIR).multiplyScalar(8);
  targetCamera.lookAt(0, 0, 0);
  targetRenderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas: targetCanvas,
  });
  targetRenderer.setPixelRatio(Math.min(window.devicePixelRatio ?? 1, 2));
  const basic = new THREE.MeshBasicMaterial({ color: CREAM });
  targetGroup = buildObject(p.objectId);
  targetGroup.traverse((o) => {
    if (o instanceof THREE.Mesh) o.material = basic;
  });
  targetGroup.quaternion.copy(threeQuat(eulerDegToQuat(p.targetEulerDeg)));
  targetScene.add(targetGroup);
}

function resize(): void {
  if (!renderer || !camera) return;
  const parent = sceneCanvas.parentElement;
  if (!parent) return;
  const w = parent.clientWidth;
  const h = parent.clientHeight;
  if (w === 0 || h === 0) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

function disposeScenes(): void {
  if (objectGroup && scene) scene.remove(objectGroup);
  if (targetGroup && targetScene) targetScene.remove(targetGroup);
  objectGroup = null;
  targetGroup = null;
  if (renderer) renderer.dispose();
  if (targetRenderer) targetRenderer.dispose();
  renderer = null;
  targetRenderer = null;
  scene = null;
  targetScene = null;
  camera = null;
  targetCamera = null;
}

function animate(): void {
  requestAnimationFrame(animate);
  if (!renderer || !scene || !camera || !objectGroup) return;
  // Gentle idle sway until the player first drags (off for reduced motion).
  const idle = !hasInteracted && !reducedMotion ? 0.22 * Math.sin(Date.now() * 0.0006) : 0;
  const idleQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), idle);
  objectGroup.quaternion.copy(idleQuat).multiply(orientation);
  renderer.render(scene, camera);
  if (targetRenderer && targetScene && targetCamera) {
    targetRenderer.render(targetScene, targetCamera);
  }
  // Live match hint (client-side only — the server re-scores on submit).
  // Words only, never the angle or accuracy number; the fill glows once
  // the player is warm (accuracy ≥ 75).
  const q: Quat = [orientation.x, orientation.y, orientation.z, orientation.w];
  const acc = accuracyFromAngle(quatAngleDeg(q, targetQuat));
  meterFill.style.width = `${Math.round(acc)}%`;
  meterLabel.textContent = meterWord(acc);
  const warm = acc >= 75;
  meterFill.classList.toggle('warm', warm);
  meterLabel.classList.toggle('warm', warm);
}

// --- Puzzle loading --------------------------------------------------------
async function fetchToday(requestMode: Mode): Promise<TodayResponse | null> {
  const base = postDateKey() ?? utcDateKey();
  const dateKey = requestMode === 'practice' ? prevDay(base) : base;
  const url = `/api/today?mode=${requestMode}&dateKey=${encodeURIComponent(dateKey)}`;
  const response = await fetch(url);
  if (!response.ok) return null;
  const data: unknown = await response.json();
  return isTodayResponse(data) ? data : null;
}

function applyStartOrientation(): void {
  // Start meaningfully off-target so every day begins with real play.
  startOrientation = threeQuat(eulerDegToQuat([20, -50, 0]));
  orientation.copy(startOrientation);
  hasInteracted = false;
  startTimeMs = Date.now();
}

async function loadPuzzle(requestMode: Mode): Promise<void> {
  let p: TodayResponse | null = null;
  try {
    p = await fetchToday(requestMode);
  } catch (err) {
    console.error('Shadowline load failed:', err);
  }
  if (!p) {
    showToast('Could not load the puzzle — check your connection and try again.');
    puzzleLabel.textContent = 'Could not load puzzle';
    return;
  }
  mode = requestMode;
  puzzle = p;
  targetQuat = eulerDegToQuat(p.targetEulerDeg);
  disposeScenes();
  buildScenes(p);
  applyStartOrientation();
  resize();
  puzzleLabel.textContent = `#${p.number} · ${p.dateKey}`;
  difficultyChip.textContent = p.difficulty.toUpperCase();
  difficultyChip.classList.remove('hidden');
  streakChip.textContent = `🔥 ${p.streak}`;
  streakChip.classList.remove('hidden');
  clueEl.textContent = `Clue: ${p.clue}`;
  practiceBadge.classList.toggle('hidden', requestMode !== 'practice');
  resultPanel.classList.add('hidden');
  lastSubmit = null;
  lockButton.disabled = false;
}

// --- Input: drag (trackball) + fine-tune -----------------------------------
let dragging = false;
let lastX = 0;
let lastY = 0;

sceneCanvas.addEventListener('pointerdown', (e) => {
  dragging = true;
  hasInteracted = true;
  lastX = e.clientX;
  lastY = e.clientY;
  sceneCanvas.setPointerCapture(e.pointerId);
});

sceneCanvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const dx = e.clientX - lastX;
  const dy = e.clientY - lastY;
  lastX = e.clientX;
  lastY = e.clientY;
  const qYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), dx * 0.006);
  const qPitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), dy * 0.006);
  orientation.premultiply(qYaw).premultiply(qPitch);
});

function endDrag(): void {
  dragging = false;
}
sceneCanvas.addEventListener('pointerup', endDrag);
sceneCanvas.addEventListener('pointercancel', endDrag);

function rotateBy(axis: 'x' | 'y', degrees: number): void {
  const rad = (degrees * Math.PI) / 180;
  const v = axis === 'y' ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  orientation.premultiply(new THREE.Quaternion().setFromAxisAngle(v, rad));
  hasInteracted = true;
}

document.getElementById('yaw-minus')?.addEventListener('click', () => rotateBy('y', -5));
document.getElementById('yaw-plus')?.addEventListener('click', () => rotateBy('y', 5));
document.getElementById('pitch-minus')?.addEventListener('click', () => rotateBy('x', -5));
document.getElementById('pitch-plus')?.addEventListener('click', () => rotateBy('x', 5));
document.getElementById('reset-view')?.addEventListener('click', () => {
  orientation.copy(startOrientation);
  hasInteracted = true;
});

// --- Timer + countdown ------------------------------------------------------
window.setInterval(() => {
  if (startTimeMs === 0) return;
  timerEl.textContent = formatTime(Math.floor((Date.now() - startTimeMs) / 1000));
}, 500);

function startCountdown(): void {
  if (countdownTimer !== undefined) window.clearInterval(countdownTimer);
  const tick = (): void => {
    const now = new Date();
    const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const ms = next.getTime() - now.getTime();
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    resultCountdown.textContent = `Next silhouette in ${h}h ${m}m ${s}s`;
  };
  tick();
  countdownTimer = window.setInterval(tick, 1000);
}

// --- Submit + result --------------------------------------------------------
lockButton.addEventListener('click', () => {
  void submit();
});

async function submit(): Promise<void> {
  if (!puzzle) return;
  lockButton.disabled = true;
  const seconds = startTimeMs === 0 ? 0 : Math.floor((Date.now() - startTimeMs) / 1000);
  try {
    const response = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dateKey: puzzle.dateKey,
        mode,
        quat: [orientation.x, orientation.y, orientation.z, orientation.w],
        seconds,
      }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data: unknown = await response.json();
    if (!isSubmitResponse(data)) throw new Error('Bad submit response');
    lastSubmit = data;
    showResult(data, seconds);
  } catch (err) {
    console.error('Shadowline submit failed:', err);
    showToast('Submit failed — try again.');
    lockButton.disabled = false;
  }
}

function showResult(r: SubmitResponse, seconds: number): void {
  resultLabel.textContent = mode === 'practice' ? "Practice result — no streak" : "Today's result";
  resultStars.textContent = '⭐'.repeat(r.stars) + '☆'.repeat(3 - r.stars);
  resultAccuracy.textContent = `${r.accuracy}% match · ${formatTime(seconds)}`;
  resultObject.textContent = `It was a ${r.objectName}.`;
  resultStats.textContent =
    mode === 'practice'
      ? `Streak: 🔥 ${r.streak}`
      : `Streak: 🔥 ${r.streak} · Rank #${r.rank} of ${r.totalPlayers} today`;
  resultPanel.classList.remove('hidden');
  startCountdown();
}

shareButton.addEventListener('click', () => {
  void share();
});

async function share(): Promise<void> {
  if (!lastSubmit || !puzzle) return;
  try {
    const response = await fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dateKey: puzzle.dateKey, text: lastSubmit.shareText }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data: unknown = await response.json();
    if (!isShareResponse(data) || !data.ok) throw new Error('Share rejected');
    if (data.fallbackToClipboard) {
      await navigator.clipboard.writeText(lastSubmit.shareText);
      showToast('Copied — paste it in the comments.');
    } else {
      showToast('Shared to the comments.');
    }
  } catch (err) {
    console.error('Shadowline share failed:', err);
    try {
      await navigator.clipboard.writeText(lastSubmit.shareText);
      showToast('Copied — paste it in the comments.');
    } catch {
      showToast('Could not share — try again.');
    }
  }
}

practiceButton.addEventListener('click', () => {
  void loadPuzzle('practice');
});
resultPracticeButton.addEventListener('click', () => {
  void loadPuzzle('practice');
});
resultClose.addEventListener('click', () => {
  resultPanel.classList.add('hidden');
  lockButton.disabled = false;
});

window.addEventListener('resize', resize);

// --- Boot -------------------------------------------------------------------
if (!webglAvailable()) {
  fallbackPanel.classList.remove('hidden');
  puzzleLabel.textContent = 'Shadowline';
  lockButton.disabled = true;
} else {
  void loadPuzzle('today').then(() => {
    resize();
    animate();
  });
}
