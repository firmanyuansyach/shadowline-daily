// Shadowline API contract — shared by client and server.
// NOTE: /api/today never sends the object NAME (the answer). The client
// gets objectId (needed to build the 3D geometry) + the target rotation
// (the puzzle itself) + a 2-word clue. Scoring is always recomputed on
// the server; the client never scores itself.

export type Difficulty = 'easy' | 'medium' | 'hard';

export type TodayResponse = {
  type: 'today';
  dateKey: string;
  number: number;
  difficulty: Difficulty;
  objectId: string;
  targetEulerDeg: [number, number, number];
  clue: string;
  mode: 'today' | 'practice';
  solveCount: number;
  streak: number;
  // The caller's stored result for this day, if already submitted.
  played: {
    accuracy: number;
    stars: number;
    rank: number;
  } | null;
};

export type SubmitRequest = {
  dateKey: string;
  mode: 'today' | 'practice';
  quat: [number, number, number, number];
  seconds: number;
};

export type SubmitResponse = {
  type: 'submit';
  dateKey: string;
  number: number;
  objectName: string;
  accuracy: number;
  stars: number;
  angleDeg: number;
  streak: number;
  rank: number;
  totalPlayers: number;
  alreadySubmitted: boolean;
  shareText: string;
};

export type LeaderboardEntry = {
  username: string;
  accuracy: number;
  stars: number;
  seconds: number;
};

export type LeaderboardResponse = {
  type: 'leaderboard';
  dateKey: string;
  entries: LeaderboardEntry[];
  totalPlayers: number;
};

export type StreakResponse = {
  type: 'streak';
  streak: number;
  playedDates: string[];
};

export type ShareRequest = {
  dateKey: string;
  text: string;
};

export type ShareResponse = {
  type: 'share';
  ok: boolean;
  fallbackToClipboard: boolean;
};

export type ErrorResponse = {
  status: 'error';
  message: string;
};
