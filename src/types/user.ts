export interface UserProfile {
  id: string;
  username: string;
  avatar: string;
  rating: number; // ELO rating (default 1200)
  gamesPlayed: number;
  wins: number;
  bestTimeSeconds: number | null; // e.g. 24.5s
  country?: string;
  level: number;
  badges: string[];
}

export interface MatchRecord {
  id: string;
  gameId: string;
  date: string;
  opponentName: string;
  opponentAvatar: string;
  result: 'win' | 'loss' | 'draw';
  timeSeconds: number;
  ratingChange: number;
}
